/**
 * 구조화된 로깅 유틸리티
 * 프로덕션 환경에서 로그 레벨 제어 및 구조화된 로그 출력
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 현재 로그 레벨 가져오기
 */
function getCurrentLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }
  // 프로덕션에서는 info 이상만, 개발 환경에서는 debug
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * 로그 레벨 확인
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = getCurrentLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * 구조화된 로그 출력
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(context && { context }),
    ...(process.env.NODE_ENV === 'production' && {
      env: process.env.NODE_ENV,
    }),
  };

  // 프로덕션에서는 JSON 형식으로 출력 (구조화된 로깅)
  if (process.env.NODE_ENV === 'production') {
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logMethod(JSON.stringify(logEntry));
  } else {
    // 개발 환경에서는 읽기 쉬운 형식
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    if (context) {
      logMethod(prefix, message, context);
    } else {
      logMethod(prefix, message);
    }
  }
}

/**
 * Debug 로그
 */
export function debug(message: string, context?: LogContext): void {
  log('debug', message, context);
}

/**
 * Info 로그
 */
export function info(message: string, context?: LogContext): void {
  log('info', message, context);
}

/**
 * Warning 로그
 */
export function warn(message: string, context?: LogContext): void {
  log('warn', message, context);
}

/**
 * Error 로그
 */
export function error(message: string, error?: unknown, context?: LogContext): void {
  const errorContext: LogContext = {
    ...context,
    ...(error instanceof Error && {
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    }),
    ...(typeof error === 'string' && { error }),
  };
  log('error', message, errorContext);
}

/**
 * API 요청 로그
 */
export function logApiRequest(
  method: string,
  path: string,
  status: number,
  duration: number,
  context?: LogContext
): void {
  const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  log(level, `${method} ${path} ${status}`, {
    ...context,
    duration: `${duration}ms`,
    status,
  });
}

/**
 * 데이터베이스 쿼리 로그
 */
export function logDbQuery(query: string, duration: number, context?: LogContext): void {
  const level: LogLevel = duration > 1000 ? 'warn' : 'debug';
  log(level, `DB Query: ${query}`, {
    ...context,
    duration: `${duration}ms`,
  });
}

