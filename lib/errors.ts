export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public isRetryable: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GeminiError extends AppError {
  constructor(message: string, isRetryable: boolean = true) {
    super(message, 'GEMINI_ERROR', 502, isRetryable);
  }
}

export class HuggingFaceError extends AppError {
  constructor(message: string, isRetryable: boolean = true) {
    super(message, 'HUGGINGFACE_ERROR', 502, isRetryable);
  }
}

export class CompilationError extends AppError {
  constructor(message: string) {
    super(message, 'COMPILATION_ERROR', 422, false);
  }
}

export class FileTooLargeError extends AppError {
  constructor(message: string = 'File is too large') {
    super(message, 'FILE_TOO_LARGE', 413, false);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please wait before trying again.') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401, false);
  }
}

export class ParseError extends AppError {
  constructor(message: string) {
    super(message, 'PARSE_ERROR', 400, false);
  }
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (msg.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again later.';
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isRetryable;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('econnreset')
    ) {
      return true;
    }
  }

  return false;
}
