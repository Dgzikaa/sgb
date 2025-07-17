const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message: any, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(message: any, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message: any, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message: any, ...args);
    }
  }
};

// Para substituir console.log em produá§á£o
export const devLog = isDevelopment ? console.log : () => {};
export const devError = isDevelopment ? console.error : () => {};
export const devWarn = isDevelopment ? console.warn : () => {}; 
