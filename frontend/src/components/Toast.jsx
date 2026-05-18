import React, { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    warning: (msg) => showToast(msg, 'warning'),
    info: (msg) => showToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '420px' }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const config = {
    success: {
      bg: 'bg-green-500/10 border-green-500/30',
      icon: '✓',
      iconBg: 'bg-green-500',
      text: 'text-green-300',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: '✕',
      iconBg: 'bg-red-500',
      text: 'text-red-300',
    },
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      icon: '!',
      iconBg: 'bg-yellow-500',
      text: 'text-yellow-300',
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: 'i',
      iconBg: 'bg-blue-500',
      text: 'text-blue-300',
    },
  };

  const c = config[toast.type] || config.info;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-up ${c.bg}`}
      style={{ animation: 'slideUp 0.35s ease-out' }}
    >
      <div className={`w-6 h-6 rounded-full ${c.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <span className="text-white text-xs font-black">{c.icon}</span>
      </div>
      <p className={`text-sm font-medium ${c.text} flex-grow`}>{toast.message}</p>
      <button onClick={onDismiss} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 mt-0.5">
        <span className="text-xs">✕</span>
      </button>
    </div>
  );
}
