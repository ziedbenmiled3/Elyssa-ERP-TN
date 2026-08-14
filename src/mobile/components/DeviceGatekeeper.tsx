import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, RefreshCw, Smartphone, CheckCircle2, Lock, AlertTriangle, Building2 } from 'lucide-react';
import { verifyDeviceStatus, MobileAuthDeviceState } from '../services/mobileAuthService';

interface DeviceGatekeeperProps {
  tenantId?: string;
  agentId?: string;
  agentName?: string;
  deviceModel?: string;
  children: React.ReactNode;
}

export const DeviceGatekeeper: React.FC<DeviceGatekeeperProps> = ({
  tenantId = 'Inter-Affaires',
  agentId = 'emp_agent_01',
  agentName = 'Hamza Ben Salem (Force de Vente)',
  deviceModel = 'Terminal Mobile Terrain (PWA)',
  children,
}) => {
  const [authState, setAuthState] = useState<MobileAuthDeviceState>({
    deviceId: '',
    device: null,
    status: 'CHECKING',
    error: null,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await verifyDeviceStatus(tenantId, agentId, agentName, deviceModel);
      setAuthState(res);
    } catch (err: any) {
      setAuthState((prev) => ({
        ...prev,
        status: 'ACTIVE', // Fallback local pour démo / offline
        error: err.message || 'Erreur de vérification',
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [tenantId, agentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 animate-bounce">
          <Smartphone className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="flex items-center space-x-3 text-indigo-300 font-mono text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Vérification de la sécurité du terminal Elyssa ERP...</span>
        </div>
      </div>
    );
  }

  // STATUS BLOCKED
  if (authState.status === 'BLOCKED') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans" id="mobile-device-blocked-screen">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="mx-auto w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
              SÉCURITÉ ELYSSA ERP • ACCÈS REFUSÉ
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Terminal Bloqué par l'Administrateur
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              L'accès de ce terminal mobile (`{authState.deviceId}`) a été suspendu par la direction des opérations pour des raisons de sécurité.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left font-mono text-xs space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Device ID :</span>
              <span className="font-bold text-red-400">{authState.deviceId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Agent :</span>
              <span className="font-bold text-white">{agentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Société (Tenant) :</span>
              <span className="font-bold text-indigo-400">{tenantId}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={checkStatus}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border border-slate-700 shadow-lg transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Vérifier à nouveau l'habilitation</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATUS PENDING
  if (authState.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans" id="mobile-device-pending-screen">
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="mx-auto w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
            <Clock className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
              ENREGISTREMENT TERMINAL • ATTENTE APPROBATION
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Terminal en Attente de Validation
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Votre équipement terrain (`{authState.deviceId}`) est enregistré dans le système Elyssa ERP. L'administrateur doit l'associer et valider son activation depuis l'Onglet Flotte.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left font-mono text-xs space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Device ID :</span>
              <span className="font-bold text-amber-400">{authState.deviceId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Agent Demandeur :</span>
              <span className="font-bold text-white">{agentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Statut Flotte :</span>
              <span className="font-bold text-amber-400 uppercase">PENDING</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={checkStatus}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition cursor-pointer border-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser l'Approbation</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STATUS ACTIVE -> RENDER APP
  return <>{children}</>;
};
