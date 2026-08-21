/**
 * Elyssa ERP - Storage Adapter for Safe Cross-Environment Persistence
 * Prevents QuotaExceededError and iFrame storage restriction crashes
 */

const inMemoryStore = new Map<string, string>();

// Clean orphan, corrupted, or parent asset / purchasing keys on startup
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('carthage_temp_') || 
        key.startsWith('elyssa_corrupted_') ||
        key.includes('assets_immobilisations_inter_affaires') ||
        key.includes('assets_immobilisations_company_parent') ||
        key.includes('purchasing_orders_inter_affaires') ||
        key.includes('purchasing_orders_company_parent')
      ) {
        try {
          const val = localStorage.getItem(key);
          if (!val || val.includes('demo-') || val.includes('IMM-202') || val.includes('ast-inv-') || val.includes('Ciments de Bizerte') || val.includes('EL FOULADH') || key.includes('inter_affaires') || key.includes('company_parent')) {
            localStorage.removeItem(key);
          }
        } catch (_) {}
      }
    });
  }
} catch (_) {}

export const appStorage = {
  getItem: (key: string): string | null => {
    if (key.includes('assets_immobilisations') && (key.includes('inter_affaires') || key.includes('company_parent'))) {
      return JSON.stringify([]);
    }
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch (_) {}
    return inMemoryStore.get(key) || null;
  },

  setItem: (key: string, value: string): void => {
    // Strictly prevent writing asset data for company_parent or inter_affaires
    if (key.includes('assets_immobilisations') && (key.includes('inter_affaires') || key.includes('company_parent'))) {
      inMemoryStore.delete(key);
      try {
        localStorage.removeItem(key);
      } catch (_) {}
      return;
    }
    // 1. Always write to memory store for immediate runtime availability
    inMemoryStore.set(key, value);
    // 2. Try persisting to localStorage without propagating QuotaExceededError or iframe restriction errors
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[appStorage] localStorage inaccessible or quota exceeded for '${key}'. Falling back to in-memory store.`);
    }
  },

  removeItem: (key: string): void => {
    inMemoryStore.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }
};

