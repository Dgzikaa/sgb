const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  }
};

// Para substituir console.log em produÃ§Ã£o
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const devLog: (...args: unknown[]) => void = isDevelopment ? console.log : () => { /* noop: log suprimido em produÃ§Ã£o */ };
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const devError: (...args: unknown[]) => void = isDevelopment ? console.error : () => { /* noop: error suprimido em produÃ§Ã£o */ };
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const devWarn: (...args: unknown[]) => void = isDevelopment ? console.warn : () => { /* noop: warn suprimido em produÃ§Ã£o */ }; 

