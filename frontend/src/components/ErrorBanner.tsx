import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div className="rounded-xl bg-red-950/60 border border-red-500/30 p-4 text-red-200 backdrop-blur-md shadow-lg flex items-start gap-3 my-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1 text-sm font-medium">
        <p className="font-semibold text-red-100 mb-0.5">Something went wrong</p>
        <p className="text-red-200/90 leading-relaxed">{message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-900/60 hover:bg-red-800 text-red-100 rounded-lg border border-red-500/40 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-900/40 text-red-400 hover:text-red-200 rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
