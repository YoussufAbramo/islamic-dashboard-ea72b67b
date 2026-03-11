import { toast } from 'sonner';
import { getErrorDetail, resolveErrorCode, type ErrorDetail } from './errorMessages';

interface NotifyErrorOptions {
  /** A known error code like 'AUTH_INVALID_CREDS' or a raw Supabase error object/message */
  error: string | any;
  /** Whether the current language is Arabic */
  isAr?: boolean;
  /** Optional raw error message to include in stored context */
  rawMessage?: string;
}

export function notifyError({ error, isAr = false, rawMessage }: NotifyErrorOptions) {
  const code = typeof error === 'string' && getErrorDetail(error).code === error
    ? error
    : resolveErrorCode(error);

  const detail = getErrorDetail(code);

  const title = isAr ? detail.titleAr : detail.title;
  const message = isAr ? detail.messageAr : detail.message;

  // Store error context for the ErrorDetails page
  const errorContext = {
    code: detail.code,
    title: detail.title,
    titleAr: detail.titleAr,
    message: detail.message,
    messageAr: detail.messageAr,
    suggestion: detail.suggestion,
    suggestionAr: detail.suggestionAr,
    category: detail.category,
    rawMessage: rawMessage || (typeof error === 'string' ? error : error?.message || ''),
    timestamp: new Date().toISOString(),
  };

  sessionStorage.setItem('last_error_detail', JSON.stringify(errorContext));

  toast.error(title, {
    description: message,
    action: {
      label: isAr ? 'عرض التفاصيل' : 'View Details',
      onClick: () => {
        window.location.href = `/dashboard/error/${detail.code}`;
      },
    },
    duration: 8000,
  });

  return detail;
}
