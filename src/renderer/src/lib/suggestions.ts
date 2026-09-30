import { Transaction, Category, Settings, MonthKey, Suggestion } from '../types/models';
import { getMonthTotals, getCategoryBreakdown } from './calc';
import { getDaysInMonth, subMonths, format, parseISO, isSaturday, isSunday } from 'date-fns';
import { formatCurrency } from './format';

export interface GenerateSuggestionsInput {
  month: MonthKey;
  transactions: Transaction[];
  categories: Category[];
  budget: number;
  settings: Settings;
  today: Date;
}

export function generateSuggestions(input: {
  month: MonthKey;
  transactions: Transaction[];
  categories: Category[];
  budget: number;
  settings: Settings;
  today: Date;
}): Suggestion[] {
  const { month, transactions, categories, budget, settings, today } = input;
  const suggestions: Suggestion[] = [];

  const [yearStr, monthStr] = month.split('-');
  const monthDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const totalDaysInMonth = getDaysInMonth(monthDate);

  const monthTx = transactions.filter(t => t.date.startsWith(month));
  const expenseTx = monthTx.filter(t => t.type === 'expense');
  const totals = getMonthTotals(transactions, month);
  const sym = settings.currencySymbol || '₹';
  const loc = settings.locale || 'en-IN';

  // Determine elapsed days in the target month relative to 'today'
  const todayMonthKey = format(today, 'yyyy-MM');
  let daysElapsed = totalDaysInMonth;
  if (month === todayMonthKey) {
    daysElapsed = Math.min(today.getDate(), totalDaysInMonth);
  } else if (month > todayMonthKey) {
    daysElapsed = 1;
  }
  const daysRemaining = Math.max(0, totalDaysInMonth - daysElapsed);

  // Category lookup
  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  // RULE 12: no-data (Fewer than 3 transactions this month)
  if (monthTx.length < 3) {
    suggestions.push({
      id: 'no-data',
      priority: 10,
      title: 'Keep logging transactions',
      body: `You have logged ${monthTx.length} transaction${monthTx.length === 1 ? '' : 's'} this month. Log regularly to unlock detailed financial insights and personalized savings tips.`,
      tone: 'info'
    });
  }

  // RULE 1: over-budget (Spend already exceeds budget)
  if (totals.expense > budget && budget > 0) {
    const overAmount = totals.expense - budget;
    suggestions.push({
      id: 'over-budget',
      priority: 1,
      title: 'Monthly budget exceeded',
      body: `You are over budget by ${formatCurrency(overAmount, sym, loc)} with ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in the month.`,
      tone: 'critical',
      potentialSaving: overAmount
    });
  }

  // RULE 2: pace-ahead (Projected spend exceeds budget by > 5%)
  if (totals.expense <= budget && daysElapsed > 0 && budget > 0) {
    const projectedSpend = (totals.expense / daysElapsed) * totalDaysInMonth;
    if (projectedSpend > budget * 1.05) {
      const currentDailyRate = totals.expense / daysElapsed;
      const budgetRemaining = Math.max(0, budget - totals.expense);
      const requiredDailyRate = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;
      suggestions.push({
        id: 'pace-ahead',
        priority: 2,
        title: 'Spending pace is high',
        body: `Current pace is ${formatCurrency(currentDailyRate, sym, loc)}/day. To stay within budget, reduce spending to ${formatCurrency(requiredDailyRate, sym, loc)}/day for the remaining ${daysRemaining} days.`,
        tone: 'critical',
        potentialSaving: projectedSpend - budget
      });
    }
  }

  // Breakdown for categories
  const breakdown = getCategoryBreakdown(transactions, categories, month);

  // RULE 3: category-dominant (One category is over 35% of the month's spend)
  if (totals.expense > 0 && breakdown.length > 0) {
    const top = breakdown[0];
    if (top.percent > 35) {
      suggestions.push({
        id: 'category-dominant',
        priority: 3,
        title: `${top.categoryName} is your largest expense`,
        body: `${top.categoryName} accounts for ${formatCurrency(top.amount, sym, loc)} (${Math.round(top.percent)}% of total monthly spend).`,
        tone: 'warning'
      });
    }
  }

  // RULE 4: discretionary-high (Discretionary categories exceed 30% of total spend)
  if (totals.expense > 0) {
    let discretionarySum = 0;
    for (const t of expenseTx) {
      const cat = categoryMap.get(t.categoryId);
      if (cat && cat.discretionary) {
        discretionarySum += t.amount;
      }
    }
    const discretionaryPercent = (discretionarySum / totals.expense) * 100;
    if (discretionaryPercent > 30) {
      const potential20Saving = discretionarySum * 0.2;
      suggestions.push({
        id: 'discretionary-high',
        priority: 4,
        title: 'Discretionary spending is high',
        body: `Discretionary expenses total ${formatCurrency(discretionarySum, sym, loc)} (${Math.round(discretionaryPercent)}% of spend). A 20% cut would save you ${formatCurrency(potential20Saving, sym, loc)}.`,
        tone: 'warning',
        potentialSaving: potential20Saving
      });
    }
  }

  // RULE 5: category-spike (>25% above its own average over previous 3 months)
  const prev3Months: MonthKey[] = [
    format(subMonths(monthDate, 1), 'yyyy-MM'),
    format(subMonths(monthDate, 2), 'yyyy-MM'),
    format(subMonths(monthDate, 3), 'yyyy-MM')
  ];

  // Verify we have transactions in the previous 3 months
  const hasHistory = prev3Months.every(m => transactions.some(t => t.date.startsWith(m)));
  if (hasHistory) {
    for (const item of breakdown) {
      let sumPrev = 0;
      for (const pm of prev3Months) {
        const pmTx = transactions.filter(t => t.date.startsWith(pm) && t.categoryId === item.categoryId && t.type === 'expense');
        sumPrev += pmTx.reduce((acc, curr) => acc + curr.amount, 0);
      }
      const avgPrev = sumPrev / 3;
      if (avgPrev > 0 && item.amount > avgPrev * 1.25) {
        const diff = item.amount - avgPrev;
        suggestions.push({
          id: 'category-spike',
          priority: 5,
          title: `Spike in ${item.categoryName}`,
          body: `${item.categoryName} spend (${formatCurrency(item.amount, sym, loc)}) is ${formatCurrency(diff, sym, loc)} higher than your 3-month average of ${formatCurrency(avgPrev, sym, loc)}.`,
          tone: 'warning',
          potentialSaving: diff
        });
        break; // at most one category spike suggestion
      }
    }
  }

  // RULE 6: recurring-detected (Same description within ±10% in at least 3 of last 4 months)
  const prev4Months: MonthKey[] = [
    month,
    format(subMonths(monthDate, 1), 'yyyy-MM'),
    format(subMonths(monthDate, 2), 'yyyy-MM'),
    format(subMonths(monthDate, 3), 'yyyy-MM')
  ];

  // Group description -> Map<month, amount[]>
  const descMap = new Map<string, Map<MonthKey, number[]>>();
  for (const t of transactions) {
    if (t.type === 'expense' && t.description && t.description.trim().length > 0) {
      const descClean = t.description.trim().toLowerCase();
      const tMonth = t.date.slice(0, 7);
      if (prev4Months.includes(tMonth)) {
        if (!descMap.has(descClean)) {
          descMap.set(descClean, new Map());
        }
        const mSub = descMap.get(descClean)!;
        if (!mSub.has(tMonth)) {
          mSub.set(tMonth, []);
        }
        mSub.get(tMonth)!.push(t.amount);
      }
    }
  }

  for (const [desc, mSub] of descMap.entries()) {
    if (mSub.size >= 3) {
      // Check if amounts are within ±10% of median/first
      const allAmounts: number[] = [];
      mSub.forEach(arr => allAmounts.push(...arr));
      const avg = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
      const isConsistent = allAmounts.every(a => Math.abs(a - avg) / avg <= 0.15);

      if (isConsistent && avg > 0) {
        const annualCost = avg * 12;
        suggestions.push({
          id: 'recurring-detected',
          priority: 6,
          title: `Recurring expense: "${desc}"`,
          body: `Detected recurring payment of ~${formatCurrency(avg, sym, loc)}/month across recent months (annual cost: ${formatCurrency(annualCost, sym, loc)}).`,
          tone: 'info',
          potentialSaving: annualCost
        });
        break;
      }
    }
  }

  // RULE 7: small-frequent (Category has 10+ transactions each under 5% of monthly budget)
  if (budget > 0) {
    const smallThreshold = budget * 0.05;
    const catSmallCount = new Map<string, { count: number; total: number }>();
    for (const t of expenseTx) {
      if (t.amount <= smallThreshold) {
        const curr = catSmallCount.get(t.categoryId) || { count: 0, total: 0 };
        curr.count += 1;
        curr.total += t.amount;
        catSmallCount.set(t.categoryId, curr);
      }
    }
    for (const [catId, stats] of catSmallCount.entries()) {
      if (stats.count >= 10) {
        const cat = categoryMap.get(catId);
        const name = cat ? cat.name : 'Unknown';
        suggestions.push({
          id: 'small-frequent',
          priority: 7,
          title: `Frequent micro-purchases in ${name}`,
          body: `${stats.count} small purchases under ${formatCurrency(smallThreshold, sym, loc)} in ${name} add up to ${formatCurrency(stats.total, sym, loc)} this month.`,
          tone: 'info',
          potentialSaving: stats.total * 0.3
        });
        break;
      }
    }
  }

  // RULE 8: savings-rate-low (Income recorded and (income - expense)/income < savingsGoalPercent)
  if (totals.income > 0) {
    const actualSavingsRate = ((totals.income - totals.expense) / totals.income) * 100;
    const goal = settings.savingsGoalPercent || 20;
    if (actualSavingsRate < goal) {
      const targetSavingsRupees = (totals.income * goal) / 100;
      const actualSavingsRupees = totals.income - totals.expense;
      const gap = Math.max(0, targetSavingsRupees - actualSavingsRupees);
      suggestions.push({
        id: 'savings-rate-low',
        priority: 4,
        title: 'Savings rate below goal',
        body: `Current savings rate is ${Math.max(0, Math.round(actualSavingsRate))}% (target: ${goal}%). You need ${formatCurrency(gap, sym, loc)} more in savings to hit your goal.`,
        tone: 'warning',
        potentialSaving: gap
      });
    }
  }

  // RULE 9: weekend-heavy (Sat+Sun spend > 40% of total spend)
  if (totals.expense > 0) {
    let weekendSum = 0;
    for (const t of expenseTx) {
      try {
        const d = parseISO(t.date);
        if (isSaturday(d) || isSunday(d)) {
          weekendSum += t.amount;
        }
      } catch {
        // ignore invalid date
      }
    }
    const weekendPercent = (weekendSum / totals.expense) * 100;
    if (weekendPercent > 40) {
      suggestions.push({
        id: 'weekend-heavy',
        priority: 8,
        title: 'High weekend spending',
        body: `Weekend purchases account for ${formatCurrency(weekendSum, sym, loc)} (${Math.round(weekendPercent)}% of total spend this month).`,
        tone: 'info'
      });
    }
  }

  // RULE 10: on-track (Spend < 70% of budget with > 1/3 of month elapsed)
  if (budget > 0 && daysElapsed > totalDaysInMonth / 3 && totals.expense > 0) {
    const usedPercent = (totals.expense / budget) * 100;
    if (usedPercent < 70) {
      const projectedSpend = (totals.expense / daysElapsed) * totalDaysInMonth;
      const likelySaving = Math.max(0, budget - projectedSpend);
      suggestions.push({
        id: 'on-track',
        priority: 9,
        title: 'Excellent budget discipline',
        body: `You have used only ${Math.round(usedPercent)}% of your budget with ${daysElapsed} days passed. You are on track to save ~${formatCurrency(likelySaving, sym, loc)} this month!`,
        tone: 'positive',
        potentialSaving: likelySaving
      });
    }
  }

  // RULE 11: surplus-idle (Previous month closed with surplus > 10% of budget)
  const prevMonthKey = format(subMonths(monthDate, 1), 'yyyy-MM');
  const prevMonthTotals = getMonthTotals(transactions, prevMonthKey);
  const prevBudget = settings.defaultMonthlyBudget;
  if (prevMonthTotals.count > 0 && prevBudget > 0) {
    const prevRemaining = prevBudget - prevMonthTotals.expense;
    if (prevRemaining > prevBudget * 0.1) {
      suggestions.push({
        id: 'surplus-idle',
        priority: 8,
        title: 'Unallocated surplus from last month',
        body: `Last month finished with a ${formatCurrency(prevRemaining, sym, loc)} surplus. Consider transferring it to long-term savings or an investment fund.`,
        tone: 'positive',
        potentialSaving: prevRemaining
      });
    }
  }

  // Sort by priority (1 = highest) and take at most 5
  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
