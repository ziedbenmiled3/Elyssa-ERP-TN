// src/context/TenantContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { appStorage } from '../services/storageAdapter';
import { AUTHORIZED_COMPANIES, CompanyTenant } from '../types';

interface TenantContextType {
  currentTenant: CompanyTenant;
  setCurrentTenant: (tenant: CompanyTenant) => void;
  isDemoEnvironment: boolean;
  activePack: string;
  allowedModules: string[];
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenantState] = useState<CompanyTenant>(() => {
    const savedId = appStorage.getItem('elyssa_active_tenant_id');
    const found = AUTHORIZED_COMPANIES.find(c => c.id === savedId);
    return found || AUTHORIZED_COMPANIES[0];
  });

  const [activePack, setActivePack] = useState<string>('FULL_INDUSTRIAL');
  const [allowedModules, setAllowedModules] = useState<string[]>(['*']);

  useEffect(() => {
    const metaRaw = appStorage.getItem(`elyssa_tenant_meta_${currentTenant.id}`);
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw);
        setActivePack(meta.activePack || 'FULL_INDUSTRIAL');
        setAllowedModules(meta.allowedModules || ['*']);
      } catch (_) {}
    } else {
      if (currentTenant.type === 'DEMO_SANDBOX') {
        setActivePack('FREE_TRIAL');
        setAllowedModules(['*']);
      } else {
        setActivePack('FULL_INDUSTRIAL');
        setAllowedModules(['*']);
      }
    }
  }, [currentTenant]);

  const setCurrentTenant = (tenant: CompanyTenant) => {
    setCurrentTenantState(tenant);
    appStorage.setItem('elyssa_active_tenant_id', tenant.id);
    window.dispatchEvent(new CustomEvent('elyssa_demo_state_changed', { detail: { tenantId: tenant.id } }));
  };

  const isDemoEnvironment = currentTenant.type === 'DEMO_SANDBOX';

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        isDemoEnvironment,
        activePack,
        allowedModules
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant doit être utilisé au sein d\'un TenantProvider');
  }
  return context;
};
