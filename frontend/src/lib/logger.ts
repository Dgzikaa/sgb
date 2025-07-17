const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  }
};

// Para substituir console.log em produÃ§Ã£o
export const devLog = isDevelopment ? console.log : () => {};
export const devError = isDevelopment ? console.error : () => {};
export const devWarn = isDevelopment ? console.warn : () => {}; 
