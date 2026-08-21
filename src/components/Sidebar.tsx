import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  BookOpen, 
  Plus, 
  Trash2, 
  Receipt, 
  UserCheck, 
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Building2,
  PackageCheck
} from 'lucide-react';
import { getTenantMeta, SAAS_PACKS, SaasPackType } from '../services/licensingService';

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  category?: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarMenuItem[];
}

export interface SidebarProps {
  tenantId: string;
  tenantName?: string;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  sections?: SidebarSection[];
  currentUser?: any;
  superAdminOverride?: boolean;
  onToggleSuperAdminOverride?: () => void;
  isDemoCompany?: boolean;
  onLoadDemoData?: () => void;
  onPurgeDemoData?: () => void;
  onOpenUserGuide?: () => void;
  hideLockedModules?: boolean;
  className?: string;
}

export function isModuleAllowedByPack(moduleId: string, allowedModules: string[]): boolean {
  if (!allowedModules || allowedModules.length === 0) return false;
  if (allowedModules.includes('*')) return true;

  // Free / Core modules are always allowed
  if (['admin', 'saas_config', 'company_settings', 'tej', 'copilot', 'dashboard'].includes(moduleId)) {
    return true;
  }

  if (allowedModules.includes(moduleId)) return true;

  // Semantic mapping for pack modules
  const aliasMap: Record<string, string[]> = {
    pos: ['pos', 'smart_pos', 'caisse'],
    sales: ['sales', 'facturation', 'billing', 'clients'],
    inventory: ['inventory', 'stock', 'products'],
    clients: ['clients', 'crm'],
    treasury: ['treasury', 'finance'],
    warehouse: ['warehouse', 'picking', 'depot', 'warehouses'],
    dispatch: ['dispatch', 'tournees', 'transit'],
    fleet: ['fleet', 'parc_auto', 'vehicles'],
    purchases: ['purchases', 'achats', 'suppliers']
  };

  return allowedModules.some(allowedKey => {
    const aliases = aliasMap[allowedKey] || [allowedKey];
    return aliases.includes(moduleId);
  });
}

export const Sidebar: React.FC<SidebarProps> = ({
  tenantId,
  tenantName,
  activeTab,
  onSelectTab,
  sections = [],
  currentUser,
  superAdminOverride = false,
  onToggleSuperAdminOverride,
  isDemoCompany = false,
  onLoadDemoData,
  onPurgeDemoData,
  onOpenUserGuide,
  hideLockedModules = false,
  className = ''
}) => {
  const [tenantMeta, setTenantMeta] = useState<any>(() => getTenantMeta(tenantId));

  useEffect(() => {
    const handleStateChange = () => {
      setTenantMeta(getTenantMeta(tenantId));
    };

    window.addEventListener('elyssa_demo_state_changed', handleStateChange);
    window.addEventListener('storage', handleStateChange);

    return () => {
      window.removeEventListener('elyssa_demo_state_changed', handleStateChange);
      window.removeEventListener('storage', handleStateChange);
    };
  }, [tenantId]);

  const activePack: SaasPackType = tenantMeta?.activePack || 'FREE_TRIAL';
  const allowedModules: string[] = tenantMeta?.allowedModules || ['*'];
  const packConfig = SAAS_PACKS[activePack] || SAAS_PACKS.FREE_TRIAL;

  const isSuperAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'SUPER_ADMIN';

  return (
    <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 sticky top-16 h-[calc(100vh-64px)] p-4 justify-between overflow-y-auto print:hidden z-30 ${className}`}>
      <div className="space-y-5">
        
        {/* SuperAdmin Presentation Override Toolbar */}
        {isSuperAdmin && isDemoCompany && (
          <div className="space-y-2 shrink-0 bg-slate-950/70 border border-red-900/40 p-3 rounded-2xl">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-red-500 px-1 flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              Console Présentation
            </span>
            
            <div className="flex items-center justify-between p-1.5 bg-slate-900/50 rounded-xl border border-slate-850">
              <span className="text-[10px] font-bold text-slate-300 font-sans">Tous les modules</span>
              {onToggleSuperAdminOverride && (
                <button
                  onClick={onToggleSuperAdminOverride}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all duration-200 font-sans ${
                    superAdminOverride
                      ? 'bg-red-950/40 border-red-500 text-red-400 hover:bg-red-900/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {superAdminOverride ? 'ACTIFS 🔓' : 'RESTAURER 🔒'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* User Guide Button */}
        {onOpenUserGuide && (
          <div className="space-y-1.5 shrink-0 bg-emerald-950/15 border border-emerald-900/35 p-2.5 rounded-2xl">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-[#10b981] px-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Portail Assistance
            </span>
            <button
              onClick={onOpenUserGuide}
              className="w-full text-left p-2.5 px-3 rounded-xl text-xs font-bold transition-all bg-emerald-950/45 hover:bg-emerald-900/35 text-emerald-300 hover:text-emerald-100 border border-emerald-900/50 hover:border-emerald-700/60 cursor-pointer shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
                <span>Mode d'emploi</span>
              </div>
              <span className="bg-emerald-900/50 border border-emerald-800 text-emerald-250 px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider uppercase">GUIDE</span>
            </button>
          </div>
        )}

        {/* Tenant License & Pack Badge Card */}
        <div className="p-3 bg-slate-950/45 border border-slate-800/80 rounded-2xl text-[10px] space-y-2 shrink-0">
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-sans font-medium flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-400" />
              Tenant :
            </span>
            <span className="font-bold text-slate-200 truncate max-w-[110px]">{tenantName || tenantId}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-sans font-medium flex items-center gap-1">
              <PackageCheck className="w-3 h-3 text-indigo-400" />
              Pack SaaS :
            </span>
            <span className={`font-mono border px-2 py-0.5 rounded-md uppercase font-black text-[8.5px] tracking-wider ${
              activePack === 'FREE_TRIAL' ? 'bg-amber-950/60 border-amber-800/50 text-amber-400' :
              activePack === 'FULL_INDUSTRIAL' ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400' :
              'bg-indigo-950/60 border-indigo-900/50 text-indigo-400'
            }`}>
              {packConfig.name.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        {sections.map((section) => {
          return (
            <div key={section.title} className="space-y-1.5">
              <div className="flex items-center space-x-2 px-3 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 opacity-85 shadow-[0_0_6px_rgba(255,255,255,0.15)]"></span>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {section.title}
                </span>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = activeTab === item.id;
                  const isUnlocked = superAdminOverride || isModuleAllowedByPack(item.id, allowedModules);

                  if (!isUnlocked && hideLockedModules) {
                    return null; // Hidden when configured to hide locked links
                  }

                  let buttonStyles = '';
                  if (active) {
                    buttonStyles = 'bg-indigo-600 text-white border-indigo-650 shadow-sm font-bold';
                  } else if (isUnlocked) {
                    buttonStyles = 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200';
                  } else {
                    buttonStyles = 'border-slate-800/60 text-slate-500 hover:bg-slate-800/30';
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full text-left p-2.5 px-3 rounded-xl text-xs transition flex items-center justify-between border cursor-pointer ${buttonStyles}`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </div>

                      {!isUnlocked && (
                        <span className="ml-2 flex items-center gap-1 text-[8px] font-black uppercase bg-amber-950/60 border border-amber-800/50 text-amber-400 px-1.5 py-0.5 rounded shrink-0" title="Verrouillé (Pack Supérieur Requis)">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Pack Req.</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-4 shrink-0">
        <div className="border-t border-slate-800 pt-4 space-y-1.5 text-[10px]">
          <div className="flex items-center space-x-2 text-slate-500">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Session SaaS Active</span>
          </div>
          <p className="text-slate-400 font-mono text-[9px]">{tenantId} • Elyssa ERP Suite</p>
        </div>
      </div>
    </aside>
  );
};
