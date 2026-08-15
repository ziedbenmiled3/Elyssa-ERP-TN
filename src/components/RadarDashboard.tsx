/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, 
  Activity, 
  Clock, 
  Wifi, 
  Compass, 
  Zap, 
  Globe2,
  Building2,
  Users,
  Layers,
  MousePointer,
  Maximize2,
  ShieldCheck,
  Radio,
  Server
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker assets in Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface ActiveSession {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string;
  activePath: string;
  ip: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  ping: number;
  connectedAt: string;
  lastSeen: string;
}

export interface CompanySummary {
  id: string;
  companyName: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  activeUsersCount: number;
  avgPing: number;
  lastActivePath: string;
  packStatus: string;
  primaryIp: string;
  status: 'active' | 'warning' | 'idle';
  connectedAt: string;
  users: ActiveSession[];
}

// Tunisian city coordinate lookup for dynamic map beacon positioning
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  ariana: { lat: 36.8625, lng: 10.1956 },
  tunis: { lat: 36.8329, lng: 10.3013 },
  lac: { lat: 36.8329, lng: 10.3013 },
  sousse: { lat: 35.8256, lng: 10.6369 },
  sfax: { lat: 34.7406, lng: 10.7603 },
  nabeul: { lat: 36.4561, lng: 10.7376 },
  hammamet: { lat: 36.4561, lng: 10.7376 },
  bizerte: { lat: 37.2744, lng: 9.8739 },
  monastir: { lat: 35.7833, lng: 10.8333 },
  gabes: { lat: 33.8815, lng: 10.0982 },
  gabès: { lat: 33.8815, lng: 10.0982 },
  kairouan: { lat: 35.6781, lng: 10.0963 },
  gafsa: { lat: 34.4250, lng: 8.7842 },
};

function resolveDynamicGeo(
  groupName: string,
  normKey: string,
  companySettingsProp: any,
  fetchedSettingsState: any,
  firstSession?: ActiveSession
) {
  const isInterAffaires = normKey.includes('INTER') || normKey.includes('AFFAIRE');
  const isGep = normKey.includes('GEP');

  let settings = companySettingsProp || fetchedSettingsState;
  if (!settings && typeof localStorage !== 'undefined') {
    try {
      const storedKey = isInterAffaires ? 'carthage_admin_settings' : `carthage_admin_settings_${groupName}`;
      const saved = localStorage.getItem(storedKey) || localStorage.getItem('carthage_admin_settings');
      if (saved) settings = JSON.parse(saved);
    } catch (_e) {}
  }

  const configuredCityZip = settings?.cityZipCode || settings?.city || '';
  const configuredAddress = settings?.companyAddress || settings?.address || '';

  let displayCity = '';
  if (configuredCityZip) {
    displayCity = configuredCityZip;
  } else if (configuredAddress) {
    displayCity = configuredAddress;
  } else if (firstSession?.city) {
    displayCity = firstSession.city;
  } else {
    displayCity = isGep ? 'Ariana (Dépôt Central GEP)' : 'Tunis';
  }

  const searchStr = `${displayCity} ${configuredAddress} ${configuredCityZip}`.toLowerCase();
  let lat = firstSession?.lat || (isGep ? 36.8625 : 36.8329);
  let lng = firstSession?.lng || (isGep ? 10.1956 : 10.3013);

  for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
    if (searchStr.includes(cityName)) {
      lat = coords.lat;
      lng = coords.lng;
      break;
    }
  }

  const packStatus = isInterAffaires 
    ? 'Pack Full ERP (Siège)' 
    : isGep 
      ? 'Pack Sur-Mesure / Custom' 
      : 'Pack Enterprise SaaS';

  const defaultIp = firstSession?.ip || (isInterAffaires ? '197.14.120.10' : (isGep ? '197.14.120.45' : '197.14.120.88'));

  return {
    city: displayCity,
    address: configuredAddress,
    lat,
    lng,
    packStatus,
    defaultIp
  };
}

// Leaflet Map Controller to fly to selected company & toggle scroll wheel zoom
const LeafletMapController: React.FC<{ 
  selectedCompany: CompanySummary | null; 
  directScrollZoom: boolean;
}> = ({ selectedCompany, directScrollZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (directScrollZoom) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [directScrollZoom, map]);

  useEffect(() => {
    if (selectedCompany && typeof selectedCompany.lat === 'number' && typeof selectedCompany.lng === 'number') {
      map.flyTo([selectedCompany.lat, selectedCompany.lng], 12, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedCompany, map]);

  return null;
};

// Custom Company Badge Marker Icon Generator
const createCompanyMarkerIcon = (companyName: string, isSelected: boolean, activeUsers: number) => {
  const isGep = companyName.toUpperCase().includes('GEP');
  const primaryColor = isGep ? '#2563eb' : '#4f46e5'; // Blue-600 vs Indigo-600
  const borderColor = isSelected ? '#fbbf24' : primaryColor; // Amber-400 if selected
  
  return L.divIcon({
    className: 'custom-company-radar-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <!-- Pulsing Ring -->
        <div style="
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          background-color: ${borderColor};
          opacity: 0.35;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        
        <!-- Badge Box -->
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #0f172a;
          border: 2px solid ${borderColor};
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 9999px;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 11px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          white-space: nowrap;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: all 0.2s ease-in-out;
          z-index: ${isSelected ? 100 : 10};
        ">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 9999px;
            background-color: #10b981;
            box-shadow: 0 0 8px #10b981;
          "></span>
          <span style="color: #f8fafc; letter-spacing: 0.025em;">${companyName}</span>
          <span style="
            background-color: rgba(255,255,255,0.15);
            color: #fbbf24;
            padding: 1px 6px;
            border-radius: 9999px;
            font-size: 9px;
            font-family: monospace;
          ">${activeUsers} util.</span>
        </div>
      </div>
    `,
    iconSize: [120, 40],
    iconAnchor: [60, 20],
    popupAnchor: [0, -22]
  });
};

interface RadarDashboardProps {
  companyName?: string;
  tenantId?: string;
  companySettings?: any;
}

export default function RadarDashboard({ companyName, tenantId, companySettings }: RadarDashboardProps = {}) {
  const [rawSessions, setRawSessions] = useState<ActiveSession[]>([]);
  const [fetchedSettings, setFetchedSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [directScrollZoom, setDirectScrollZoom] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('fr-FR')}] PROTOCOLE ACCES : Initialisation Radar Leaflet Multi-Entreprises...`,
    `[${new Date().toLocaleTimeString('fr-FR')}] PROTOCOLE ACCES : Connexion au flux temps réel des sessions actives...`
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load admin settings from backend API as fallback
  useEffect(() => {
    const loadAdminSettings = async () => {
      try {
        const res = await fetch('/api/db/admin-settings');
        if (res.ok) {
          const data = await res.json();
          setFetchedSettings(data);
        }
      } catch (_e) {}
    };
    loadAdminSettings();
  }, []);

  // Aggregation logic: group real raw sessions strictly by Enterprise/Company
  const companySummaries = useMemo<CompanySummary[]>(() => {
    const map = new Map<string, {
      name: string;
      sessions: ActiveSession[];
      key: string;
    }>();

    // Grouping strictly by normalized company name from active real sessions
    rawSessions.forEach(s => {
      if (!s || !s.company) return;
      const cName = s.company.trim();
      let normKey = cName.toUpperCase();
      if (normKey.includes('GEP')) normKey = 'GEP';
      else if (normKey.includes('INTER') || normKey.includes('AFFAIRE')) normKey = 'INTER-AFFAIRES';

      if (!map.has(normKey)) {
        map.set(normKey, {
          name: normKey === 'GEP' ? 'GEP' : (normKey === 'INTER-AFFAIRES' ? 'Inter-Affaires' : cName),
          sessions: [],
          key: normKey
        });
      }
      map.get(normKey)!.sessions.push(s);
    });

    const result: CompanySummary[] = [];

    // Construct summaries dynamically for each active company group
    map.forEach((group, normKey) => {
      const geo = resolveDynamicGeo(
        group.name,
        normKey,
        companySettings,
        fetchedSettings,
        group.sessions[0]
      );

      const userCount = group.sessions.length;
      const avgP = userCount > 0 
        ? Math.round(group.sessions.reduce((acc, sess) => acc + (sess.ping || 14), 0) / userCount)
        : 12;

      result.push({
        id: `comp-${normKey.toLowerCase()}`,
        companyName: group.name,
        city: geo.city,
        country: group.sessions[0]?.country || 'Tunisie',
        lat: geo.lat,
        lng: geo.lng,
        activeUsersCount: userCount,
        avgPing: avgP,
        lastActivePath: group.sessions[0]?.activePath || 'Portail Elyssa ERP',
        packStatus: geo.packStatus,
        primaryIp: group.sessions[0]?.ip || geo.defaultIp,
        status: 'active',
        connectedAt: group.sessions[0]?.connectedAt || new Date().toISOString(),
        users: group.sessions
      });
    });

    return result;
  }, [rawSessions, companySettings, fetchedSettings]);

  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);

  // Sync selection to first available company if null or out of sync
  useEffect(() => {
    if (companySummaries.length > 0) {
      if (!selectedCompany || !companySummaries.some(c => c.id === selectedCompany.id || c.companyName === selectedCompany.companyName)) {
        setSelectedCompany(companySummaries[0]);
      }
    } else {
      setSelectedCompany(null);
    }
  }, [companySummaries]);

  // Fetch real active sessions from backend / Firestore endpoint
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/db/active-sessions?company=all`);
      if (res.ok) {
        const data: ActiveSession[] = await res.json();
        setRawSessions(data);

        // Append log entry to stream
        const timeStr = new Date().toLocaleTimeString('fr-FR');
        if (data.length > 0) {
          const randomSess = data[Math.floor(Math.random() * data.length)];
          const newLog = `[${timeStr}] FLUX REEL : Session active [${randomSess.email}] @ ${randomSess.company} (${randomSess.city || 'Tunis'}) : "${randomSess.activePath}" [Ping: ${randomSess.ping || 12}ms]`;
          setLogs(prev => [...prev.slice(-30), newLog]);
        }
      }
    } catch (_err) {
      // Keep state intact on network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchSessions();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const totalConnectedUsers = useMemo(() => {
    return companySummaries.reduce((acc, c) => acc + c.activeUsersCount, 0);
  }, [companySummaries]);

  const avgGlobalPing = useMemo(() => {
    if (companySummaries.length === 0) return 12;
    return Math.round(companySummaries.reduce((acc, c) => acc + c.avgPing, 0) / companySummaries.length);
  }, [companySummaries]);

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Upper Navigation / Status Header Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
              Radar Entreprises & Sessions
            </h1>
            <span className="bg-indigo-950 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-800">
              LEAFLET CARTO ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Surveillance géographique et réseau des locataires actifs sur la plateforme Elyssa ERP.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-2 text-xs">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Entreprises :</span>
            <span className="font-extrabold text-white font-mono">{companySummaries.length}</span>
          </div>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-2 text-xs">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-medium">Collaborateurs :</span>
            <span className="font-extrabold text-amber-400 font-mono">{totalConnectedUsers}</span>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'FLUX 5s' : 'PAUSE'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Left Control Panel (Zone Gauche) + Right Leaflet Map (Zone Droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* VOLET LATÉRAL DE CONTRÔLE (ZONE GAUCHE - 5 Colonnes) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          
          {/* Bloc Focus: Diagnostic Entreprise Sélectionnée */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                  Diagnostic Entreprise Sélectionnée
                </h2>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                EN LIGNE
              </span>
            </div>

            {selectedCompany ? (
              <div className="space-y-3.5 text-xs">
                {/* Header Title & Pack */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {selectedCompany.companyName}
                    </h3>
                    <p className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      {selectedCompany.packStatus}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Dernier Ping</span>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">
                      {selectedCompany.avgPing} ms
                    </span>
                  </div>
                </div>

                {/* Info Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" /> Siège / Ville
                    </span>
                    <p className="font-bold text-slate-200 truncate" title={selectedCompany.city}>
                      {selectedCompany.city || 'Tunis'}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <Server className="w-3 h-3 text-amber-400" /> Passerelle IP
                    </span>
                    <p className="font-bold text-slate-200 font-mono truncate">
                      {selectedCompany.primaryIp}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" /> Sessions Actives
                    </span>
                    <p className="font-bold text-slate-200 font-mono">
                      {selectedCompany.activeUsersCount} Collaborateur(s)
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <Globe2 className="w-3 h-3 text-sky-400" /> Coordonnées GPS
                    </span>
                    <p className="font-bold text-slate-200 font-mono text-[11px]">
                      {selectedCompany.lat.toFixed(4)}°N, {selectedCompany.lng.toFixed(4)}°E
                    </p>
                  </div>
                </div>

                {/* Main Activity Path */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Activité Principale :</span>
                  <span className="font-bold text-indigo-300 font-mono truncate max-w-[200px]">
                    {selectedCompany.lastActivePath}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs font-medium">
                Aucune entreprise sélectionnée ou connectée.
              </div>
            )}
          </div>

          {/* Liste Interactive: Entreprises Actives */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Entreprises Actives ({companySummaries.length})
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Cliquer pour centrer</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {companySummaries.length > 0 ? (
                companySummaries.map((comp) => {
                  const isSelected = selectedCompany?.id === comp.id || selectedCompany?.companyName === comp.companyName;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedCompany(comp)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className={`font-black text-xs ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {comp.companyName}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          {comp.city}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="inline-block bg-indigo-500/10 text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">
                          {comp.activeUsersCount} sess.
                        </span>
                        <span className="block text-[10px] text-emerald-400 font-mono font-bold">
                          {comp.avgPing}ms
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs">
                  Aucune session entreprise active enregistrée.
                </div>
              )}
            </div>
          </div>

          {/* Légende & Stream Terminal */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
            {/* Légende officielle */}
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                <span className="text-slate-300 font-medium">Pastille Verte = Entreprise connectée / Pack Actif</span>
              </div>
            </div>

            {/* Terminal activity logs */}
            <div className="font-mono text-[10px] text-slate-400 max-h-[80px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {logs.slice(-4).map((l, idx) => (
                <div key={idx} className="truncate">
                  <span className="text-indigo-400 font-bold">&gt; </span>
                  <span>{l}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

        {/* MOTEUR DE CARTE INTERACTIF LEAFLET (ZONE DROITE - 7 Colonnes) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-2 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[580px]">
          
          {/* Map Overlay Controls Header */}
          <div className="z-20 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs mb-2 shadow-md">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="font-black text-slate-200 tracking-wide">
                MOTEUR CARTO LEAFLET // TUILES CARTO POSITRON (LIGHT)
              </span>
            </div>

            {/* Scroll Wheel Zoom Mode Toggle Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDirectScrollZoom(!directScrollZoom)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold font-mono transition-all flex items-center space-x-1.5 border ${
                  directScrollZoom
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Basculer le mode de zoom molette souris"
              >
                <MousePointer className="w-3 h-3" />
                <span>Molette : {directScrollZoom ? 'Direct' : 'Standard'}</span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="w-full flex-1 rounded-xl overflow-hidden border border-slate-800 relative z-10 min-h-[500px]">
            <MapContainer
              center={[35.8, 10.2]}
              zoom={7.5}
              scrollWheelZoom={directScrollZoom}
              style={{ height: '100%', width: '100%', minHeight: '500px' }}
              zoomControl={true}
            >
              {/* CARTO Positron Light Tile Layer */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                subdomains={['a', 'b', 'c', 'd']}
                maxZoom={19}
              />

              {/* Dynamic Leaflet Map Controller */}
              <LeafletMapController 
                selectedCompany={selectedCompany} 
                directScrollZoom={directScrollZoom} 
              />

              {/* Interactive Company Markers */}
              {companySummaries.map((comp) => {
                const isSelected = selectedCompany?.id === comp.id || selectedCompany?.companyName === comp.companyName;
                const customIcon = createCompanyMarkerIcon(comp.companyName, isSelected, comp.activeUsersCount);

                return (
                  <Marker
                    key={comp.id}
                    position={[comp.lat, comp.lng]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedCompany(comp);
                      }
                    }}
                  >
                    {/* Interactive Leaflet Popup */}
                    <Popup className="custom-radar-popup" autoPan={true}>
                      <div className="p-1 space-y-2 font-sans min-w-[210px]">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600 inline" />
                            {comp.companyName}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                            ● EN LIGNE
                          </span>
                        </div>

                        <div className="space-y-1 text-[10.5px] text-slate-700">
                          <p className="font-extrabold text-indigo-700">{comp.packStatus}</p>
                          <p className="flex items-center gap-1 text-slate-600 font-medium">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            {comp.city}
                          </p>
                          <p className="flex items-center gap-1 text-slate-600 font-mono">
                            <Server className="w-3 h-3 text-slate-500 shrink-0" />
                            IP: {comp.primaryIp}
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-600">Sessions : <strong className="text-slate-900 font-extrabold">{comp.activeUsersCount}</strong></span>
                          <span className="text-emerald-700 font-bold">Ping : {comp.avgPing}ms</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

        </div>

      </div>
    </div>
  );
}
