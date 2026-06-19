import '@testing-library/jest-dom';

// jsdom sometimes ships without a working localStorage — provide a minimal shim
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
    getItem: (key: string) => localStorageStore[key] ?? null,
    setItem: (key: string, value: string) => { localStorageStore[key] = value; },
    removeItem: (key: string) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
