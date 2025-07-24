const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  }
};

// Para substituir console.log em produção
export const devLog = isDevelopment ? console.log : () => {};
export const devError = isDevelopment ? console.error : () => {};
export const devWarn = isDevelopment ? console.warn : () => {}; 
