import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { AppShell } from './components/AppShell';
import { GrainOverlay } from './components/GrainOverlay';
import { ToastContainer } from './components/Toast';
import { TransactionForm } from './components/TransactionForm';
import { PageTransition } from './motion/PageTransition';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { AnimatePresence } from 'motion/react';

export const App: React.FC = () => {
  const {
    data,
    isLoading,
    initError,
    initializeApp,
    activePage,
    setActivePage,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    editingTransaction,
    saveTransaction,
    toasts,
    removeToast
  } = useAppStore();

  useEffect(() => {
    initializeApp();

    // Listen for window focus changes to pause/resume ambient animations
    if (typeof window !== 'undefined' && window.api) {
      const unsub = window.api.onWindowFocusChanged(focused => {
        if (focused) {
          document.documentElement.removeAttribute('data-window-blurred');
        } else {
          document.documentElement.setAttribute('data-window-blurred', 'true');
        }
      });
      return unsub;
    }
    return undefined;
  }, []);

  if (!isLoading && !data && initError) {
    return (
      <div className="w-screen h-screen bg-[var(--bg-app)] flex items-center justify-center p-8">
        <GrainOverlay />
        <div className="card-static w-full max-w-md p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--danger)] flex items-center justify-center text-white mx-auto font-semibold text-lg">
            !
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Couldn&apos;t load SpendLedger</h2>
          <p className="text-sm text-[var(--text-secondary)]">{initError}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="w-screen h-screen bg-[var(--bg-app)] flex items-center justify-center p-8">
        <GrainOverlay />
        <div className="card-static w-full max-w-md p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white mx-auto font-semibold text-lg">
            ₹
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Loading SpendLedger...</h2>
          <div className="w-full h-2 rounded-full overflow-hidden animate-skeleton" />
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Signature Grain Texture Overlay */}
      <GrainOverlay />

      {/* Main App Layout Shell */}
      <AppShell
        activePage={activePage}
        onPageChange={setActivePage}
        onAddTransaction={() => openAddModal()}
      >
        <AnimatePresence mode="wait">
          <PageTransition key={activePage} pageKey={activePage}>
            {renderCurrentPage()}
          </PageTransition>
        </AnimatePresence>
      </AppShell>

      {/* Global Add/Edit Transaction Modal */}
      <TransactionForm
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        categories={data.categories}
        initialData={editingTransaction}
        onSave={(txData, keepOpen) => {
          saveTransaction(txData, keepOpen);
        }}
      />

      {/* Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default App;
