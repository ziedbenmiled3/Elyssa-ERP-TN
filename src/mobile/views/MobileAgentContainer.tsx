import React, { useState } from 'react';
import { DeviceGatekeeper } from '../components/DeviceGatekeeper';
import { MobileAccessGuard } from '../../components/MobileAccessGuard';
import { VanSalesScreen } from './VanSalesScreen';
import { ChantierScreen } from './ChantierScreen';
import { DriverDeliveryScreen } from './DriverDeliveryScreen';
import { Truck, Building2, Smartphone, ArrowLeft, Navigation } from 'lucide-react';

interface MobileAgentContainerProps {
  tenantId?: string;
  onBackToErp?: () => void;
}

export const MobileAgentContainer: React.FC<MobileAgentContainerProps> = ({
  tenantId = 'Inter-Affaires',
  onBackToErp
}) => {
  const [activeRoleView, setActiveRoleView] = useState<'VAN_SALES' | 'CHANTIER' | 'DELIVERY'>('DELIVERY');

  return (
    <MobileAccessGuard tenantId={tenantId} userId="emp_agent_01">
      <DeviceGatekeeper tenantId={tenantId}>
        <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
          
          {/* Elyssa ERP Agent App Switcher Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-40 flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              {onBackToErp && (
                <button
                  onClick={onBackToErp}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center space-x-1 border border-slate-700 cursor-pointer"
                  title="Retour au Tableau de Bord ERP Central"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Elyssa ERP</span>
                </button>
              )}

              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-black text-white tracking-wider font-display uppercase text-[11px]">
                  Elyssa Pocket
                </span>
              </div>
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveRoleView('DELIVERY')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                  activeRoleView === 'DELIVERY'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="btn-switch-delivery"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>🚚 Tournée</span>
              </button>

              <button
                onClick={() => setActiveRoleView('VAN_SALES')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                  activeRoleView === 'VAN_SALES'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="btn-switch-van-sales"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Force Vente</span>
              </button>

              <button
                onClick={() => setActiveRoleView('CHANTIER')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer ${
                  activeRoleView === 'CHANTIER'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="btn-switch-chantier"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Chantier</span>
              </button>
            </div>
          </div>

          {/* View Content */}
          <div className="flex-1">
            {activeRoleView === 'DELIVERY' ? (
              <DriverDeliveryScreen tenantId={tenantId} />
            ) : activeRoleView === 'VAN_SALES' ? (
              <VanSalesScreen tenantId={tenantId} />
            ) : (
              <ChantierScreen tenantId={tenantId} />
            )}
          </div>
        </div>
      </DeviceGatekeeper>
    </MobileAccessGuard>
  );
};

export default MobileAgentContainer;
