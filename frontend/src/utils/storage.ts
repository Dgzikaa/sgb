// Utilitários de storage

// Local Storage
export const localStorage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
  },
};

// Session Storage
export const sessionStorage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null;
    
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to sessionStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(key);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.clear();
  },
};

// Cookie Storage
export const cookies = {
  get: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const value = ` ${document.cookie}`;
    const parts = value.split(` ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  },

  set: (name: string, value: string, options?: {
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }): void => {
    if (typeof document === 'undefined') return;
    
    let cookie = `${name}=${value}`;
    
    if (options?.expires) {
      cookie += ` expires=${options.expires.toUTCString()}`;
    }
    
    if (options?.path) {
      cookie += ` path=${options.path}`;
    }
    
    if (options?.domain) {
      cookie += ` domain=${options.domain}`;
    }
    
    if (options?.secure) {
      cookie += '; secure';
    }
    
    if (options?.sameSite) {
      cookie += ` samesite=${options.sameSite}`;
    }
    
    document.cookie = cookie;
  },

  remove: (name: string, options?: { path?: string; domain?: string }): void => {
    cookies.set(name, '', { 
      expires: new Date(0),
      ...options,
    });
  },
};

// IndexedDB Storage (simplificado)
export const indexedDB = {
  async get<T>(dbName: string, storeName: string, key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const db = await openDB(dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        },
      });
      
      return await db.get(storeName, key);
    } catch {
      return null;
    }
  },

  async set<T>(dbName: string, storeName: string, key: string, value: T): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const db = await openDB(dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        },
      });
      
      await db.put(storeName, value, key);
    } catch (error) {
      console.warn('Failed to save to IndexedDB:', error);
    }
  },
};

// Função helper para abrir IndexedDB
async function openDB(name: string, version: number, options: {
  upgrade: (db: IDBDatabase) => void;
}): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => options.upgrade(request.result);
  });
}