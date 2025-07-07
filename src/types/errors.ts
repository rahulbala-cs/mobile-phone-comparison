/**
 * Custom error types for better error handling in the mobile phone comparison application
 */

export enum ErrorType {
  // Network and API errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Content and Data errors
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  INVALID_CONTENT_FORMAT = 'INVALID_CONTENT_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication and Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Live Preview and CMS errors
  LIVE_PREVIEW_ERROR = 'LIVE_PREVIEW_ERROR',
  CMS_CONNECTION_ERROR = 'CMS_CONNECTION_ERROR',
  VISUAL_BUILDER_ERROR = 'VISUAL_BUILDER_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  
  // Application errors
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  ROUTING_ERROR = 'ROUTING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  abstract readonly type: ErrorType;
  abstract readonly code: string;
  readonly timestamp: Date;
  readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): object {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  readonly type = ErrorType.NETWORK_ERROR;
  readonly code = 'NETWORK_001';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * API-related errors
 */
export class APIError extends AppError {
  readonly type = ErrorType.API_ERROR;
  readonly code = 'API_001';
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number, context?: Record<string, any>) {
    super(message, context);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Content not found errors
 */
export class ContentNotFoundError extends AppError {
  readonly type = ErrorType.CONTENT_NOT_FOUND;
  readonly code = 'CONTENT_001';
  readonly resourceType: string;
  readonly resourceId: string;

  constructor(resourceType: string, resourceId: string, context?: Record<string, any>) {
    super(`${resourceType} with ID '${resourceId}' not found`, context);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    Object.setPrototypeOf(this, ContentNotFoundError.prototype);
  }
}

/**
 * Invalid content format errors
 */
export class InvalidContentFormatError extends AppError {
  readonly type = ErrorType.INVALID_CONTENT_FORMAT;
  readonly code = 'CONTENT_002';
  readonly expectedFormat: string;
  readonly receivedFormat: string;

  constructor(expectedFormat: string, receivedFormat: string, context?: Record<string, any>) {
    super(`Invalid content format. Expected: ${expectedFormat}, Received: ${receivedFormat}`, context);
    this.expectedFormat = expectedFormat;
    this.receivedFormat = receivedFormat;
    Object.setPrototypeOf(this, InvalidContentFormatError.prototype);
  }
}

/**
 * Missing required field errors
 */
export class MissingRequiredFieldError extends AppError {
  readonly type = ErrorType.MISSING_REQUIRED_FIELD;
  readonly code = 'CONTENT_003';
  readonly fieldName: string;
  readonly contentType: string;

  constructor(fieldName: string, contentType: string, context?: Record<string, any>) {
    super(`Required field '${fieldName}' is missing in ${contentType}`, context);
    this.fieldName = fieldName;
    this.contentType = contentType;
    Object.setPrototypeOf(this, MissingRequiredFieldError.prototype);
  }
}

/**
 * Live Preview errors
 */
export class LivePreviewError extends AppError {
  readonly type = ErrorType.LIVE_PREVIEW_ERROR;
  readonly code = 'PREVIEW_001';
  readonly action: string;

  constructor(action: string, message: string, context?: Record<string, any>) {
    super(`Live Preview ${action} failed: ${message}`, context);
    this.action = action;
    Object.setPrototypeOf(this, LivePreviewError.prototype);
  }
}

/**
 * CMS connection errors
 */
export class CMSConnectionError extends AppError {
  readonly type = ErrorType.CMS_CONNECTION_ERROR;
  readonly code = 'CMS_001';
  readonly endpoint: string;

  constructor(endpoint: string, message: string, context?: Record<string, any>) {
    super(`CMS connection failed for ${endpoint}: ${message}`, context);
    this.endpoint = endpoint;
    Object.setPrototypeOf(this, CMSConnectionError.prototype);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  readonly type = ErrorType.VALIDATION_ERROR;
  readonly code = 'VALIDATION_001';
  readonly validationErrors: string[];

  constructor(validationErrors: string[], context?: Record<string, any>) {
    super(`Validation failed: ${validationErrors.join(', ')}`, context);
    this.validationErrors = validationErrors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Component errors
 */
export class ComponentError extends AppError {
  readonly type = ErrorType.COMPONENT_ERROR;
  readonly code = 'COMPONENT_001';
  readonly componentName: string;
  readonly action: string;

  constructor(componentName: string, action: string, message: string, context?: Record<string, any>) {
    super(`Component ${componentName} failed during ${action}: ${message}`, context);
    this.componentName = componentName;
    this.action = action;
    Object.setPrototypeOf(this, ComponentError.prototype);
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  readonly type = ErrorType.TIMEOUT_ERROR;
  readonly code = 'TIMEOUT_001';
  readonly timeoutMs: number;
  readonly operation: string;

  constructor(operation: string, timeoutMs: number, context?: Record<string, any>) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`, context);
    this.operation = operation;
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  /**
   * Create error from unknown error object
   */
  static fromUnknown(error: unknown, context?: Record<string, any>): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      // Try to determine error type based on message patterns
      if (error.message.includes('not found')) {
        return new ContentNotFoundError('Resource', 'unknown', { ...context, originalError: error });
      }
      
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return new TimeoutError('Unknown operation', 30000, { ...context, originalError: error });
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return new NetworkError(error.message, { ...context, originalError: error });
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return new APIError(error.message, 401, { ...context, originalError: error });
      }
      
      if (error.message.includes('forbidden') || error.message.includes('403')) {
        return new APIError(error.message, 403, { ...context, originalError: error });
      }
    }
    
    // Fallback to unknown error
    return new UnknownError(
      error instanceof Error ? error.message : String(error),
      { ...context, originalError: error }
    );
  }

  /**
   * Create API error with status code
   */
  static apiError(message: string, statusCode: number, context?: Record<string, any>): APIError {
    return new APIError(message, statusCode, context);
  }

  /**
   * Create content not found error
   */
  static contentNotFound(resourceType: string, resourceId: string, context?: Record<string, any>): ContentNotFoundError {
    return new ContentNotFoundError(resourceType, resourceId, context);
  }

  /**
   * Create validation error
   */
  static validationError(errors: string[], context?: Record<string, any>): ValidationError {
    return new ValidationError(errors, context);
  }

  /**
   * Create component error
   */
  static componentError(componentName: string, action: string, message: string, context?: Record<string, any>): ComponentError {
    return new ComponentError(componentName, action, message, context);
  }

  /**
   * Create live preview error
   */
  static livePreviewError(action: string, message: string, context?: Record<string, any>): LivePreviewError {
    return new LivePreviewError(action, message, context);
  }
}

/**
 * Unknown error type for unhandled cases
 */
export class UnknownError extends AppError {
  readonly type = ErrorType.UNKNOWN_ERROR;
  readonly code = 'UNKNOWN_001';

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
    Object.setPrototypeOf(this, UnknownError.prototype);
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Log error with appropriate level
   */
  static log(error: AppError): void {
    const errorData = error.toJSON();
    
    // Log with different levels based on error type
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.API_ERROR:
      case ErrorType.CMS_CONNECTION_ERROR:
        console.error('🌐 Network/API Error:', errorData);
        break;
      case ErrorType.CONTENT_NOT_FOUND:
        console.warn('📄 Content Error:', errorData);
        break;
      case ErrorType.LIVE_PREVIEW_ERROR:
      case ErrorType.VISUAL_BUILDER_ERROR:
        console.info('🔄 Live Preview Error:', errorData);
        break;
      case ErrorType.VALIDATION_ERROR:
        console.warn('✅ Validation Error:', errorData);
        break;
      case ErrorType.COMPONENT_ERROR:
        console.error('⚛️ Component Error:', errorData);
        break;
      default:
        console.error('❌ Unknown Error:', errorData);
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection and try again.';
      case ErrorType.API_ERROR:
        return 'Server error occurred. Please try again later.';
      case ErrorType.CONTENT_NOT_FOUND:
        return 'The requested content was not found.';
      case ErrorType.CMS_CONNECTION_ERROR:
        return 'Unable to connect to content management system. Please try again later.';
      case ErrorType.LIVE_PREVIEW_ERROR:
        return 'Live preview functionality is temporarily unavailable.';
      case ErrorType.VALIDATION_ERROR:
        return 'Invalid data detected. Please check your input.';
      case ErrorType.TIMEOUT_ERROR:
        return 'Request timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    return [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.CMS_CONNECTION_ERROR
    ].includes(error.type);
  }
}