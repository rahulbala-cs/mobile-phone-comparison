// Centralized error handling utility

export interface AppError {
  message: string;
  code: string;
  details?: any;
  timestamp: number;
}

export class ContentstackError extends Error {
  public code: string;
  public details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ContentstackError';
    this.code = code;
    this.details = details;
  }
}

export class LivePreviewError extends Error {
  public code: string;
  public retryable: boolean;
  
  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = 'LivePreviewError';
    this.code = code;
    this.retryable = retryable;
  }
}

export const createAppError = (message: string, code: string, details?: any): AppError => ({
  message,
  code,
  details,
  timestamp: Date.now()
});

export const handleApiError = (error: any): AppError => {
  if (error.response?.status === 404) {
    return createAppError('Content not found', 'CONTENT_NOT_FOUND', error.response);
  }
  
  if (error.response?.status === 401) {
    return createAppError('Authentication failed', 'AUTH_ERROR', error.response);
  }
  
  if (error.response?.status >= 500) {
    return createAppError('Server error', 'SERVER_ERROR', error.response);
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return createAppError('Network connection error', 'NETWORK_ERROR', error);
  }
  
  return createAppError(error.message || 'Unknown error', 'UNKNOWN_ERROR', error);
};

export const logError = (error: AppError | Error, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 ${context || 'Error'}`);
    console.error('Message:', error.message);
    if ('code' in error) console.error('Code:', error.code);
    if ('details' in error) console.error('Details:', error.details);
    if ('stack' in error) console.error('Stack:', error.stack);
    console.groupEnd();
  }
  
  // In production, you might want to send to error reporting service
  if (process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true') {
    // Send to error reporting service (Sentry, etc.)
  }
};