import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  title = 'Something went wrong',
  onRetry,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-900 shadow-sm flex items-start gap-3 my-4"
    >
      <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" strokeWidth={1.75} />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-rose-900 mb-0.5">{title}</p>
        <p className="text-rose-700 leading-relaxed">{message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-rose-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-rose-100 text-rose-400 hover:text-rose-600 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
            title="Dismiss"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
};
