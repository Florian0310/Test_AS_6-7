export const safeStorageGet = key => {try {return localStorage.getItem(key);} catch {return null;}};
export const safeStorageSet = (key, value) => {try {localStorage.setItem(key, value);} catch { /* The current page remains usable. */ }};
