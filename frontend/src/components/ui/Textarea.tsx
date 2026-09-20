import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  id: string;
  showCount?: boolean;
  maxLength?: number;
  currentLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      showCount = false,
      maxLength,
      currentLength,
      className = '',
      value,
      ...props
    },
    ref
  ) => {
    const charCount =
      currentLength !== undefined
        ? currentLength
        : typeof value === 'string'
        ? value.length
        : 0;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="block text-sm font-medium text-zinc-800 select-none"
            >
              {label}
            </label>
          )}
          {showCount && (
            <span
              className={`text-xs tabular-nums ${
                maxLength && charCount > maxLength ? 'text-rose-600 font-medium' : 'text-zinc-400'
              }`}
            >
              {charCount.toLocaleString()}
              {maxLength ? ` / ${maxLength.toLocaleString()}` : ''}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={id}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          className={`w-full px-3.5 py-2.5 text-sm text-zinc-900 bg-white border rounded-lg transition-colors duration-150 ease-out placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent-600/20 focus:border-accent-600 disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed resize-y ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200 hover:border-zinc-300'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={`${id}-error`} className="text-xs text-rose-600 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${id}-helper`} className="text-xs text-zinc-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
