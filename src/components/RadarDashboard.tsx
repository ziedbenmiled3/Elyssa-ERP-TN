/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Radar, 
  MapPin, 
  Activity, 
  Clock, 
  Laptop, 
  Wifi, 
  ChevronRight, 
  Compass, 
  User, 
  Zap, 
  Globe2,
  AlertCircle
} from 'lucide-react';

interface ActiveSession {
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

export default function RadarDashboard() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ActiveSession | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [radarAngle, setRadarAngle] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch active sessions from the server
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/db/active-sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        
        // Pick first user if none selected
        if (data.length > 0 && !selectedUser) {
          setSelectedUser(data[0]);
        }
        
        // Log action to terminal stream
        const randomSession = data[Math.floor(Math.random() * data.length)];
        if (randomSession) {
          const timeStr = new Date().toLocaleTimeString('fr-FR');
          const newLog = `[${timeStr}] PROTOCOLE ACCES : ${randomSession.name} (${randomSession.city}) effectue la tâche : "${randomSession.activePath}" [Ping: ${randomSession.ping}ms]`;
          setLogs(prev => [...prev.slice(-30), newLog]);
        }
      }
    } catch (err) {
      console.error('Error fetching radar sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchSessions();
    }, 5000); // Poll every 5s for snappy live feeling
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Keep terminal scrolled to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Sweep the radar angle
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setRadarAngle(prev => (prev + 1.5) % 360);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Coordinates Mapping for Tunisia (Lat: 33.5 to 37.5, Lng: 8.5 to 11.5)
  // Let's map this beautifully within a bounding box of 300x400
  const mapCoordinates = (lat: number, lng: number) => {
    const latMin = 33.2;
    const latMax = 37.6;
    const lngMin = 8.3;
    const lngMax = 11.7;

    // Normalizing
    const xPct = (lng - lngMin) / (lngMax - lngMin);
    const yPct = 1.0 - (lat - latMin) / (latMax - latMin); // Y is inverted in screen space

    return {
      x: xPct * 100, // percentage for responsive container
      y: yPct * 100
    };
  };

  // Helper for badges
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SuperAdmin':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Super Admin</span>;
      case 'Manager':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">Manager</span>;
      case 'Agent':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">Agent</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-full">Invité</span>;
    }
  };

  const activeLocationsCount = new Set(sessions.map(s => s.city)).size;
  const avgPing = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.ping, 0) / sessions.length) 
    : 15;

  return (
    <div id="radar-monitoring-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs animate-fadeIn">
      {/* 1. Header diagnostics strip */}
      <div className="col-span-12 bg-white rounded-xl border border-slate-150 p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
              <span>Radar d'Activité Live</span>
              <span className="text-[10px] text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">SAAS PRESENCE</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Surveillance en temps réel des accès entreprises et agents sur la plateforme Elyssa.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Quick Stats Grid */}
          <div className="flex space-x-3 border-r pr-4 border-slate-150">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Connectés</span>
              <span className="text-sm font-black text-slate-800 font-mono">{sessions.length}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Villes</span>
              <span className="text-sm font-black text-indigo-600 font-mono">{activeLocationsCount}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Moy. Ping</span>
              <span className="text-sm font-black text-emerald-600 font-mono">{avgPing}ms</span>
            </div>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] transition flex items-center space-x-1 ${
              autoRefresh 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Activity className={`w-3 h-3 ${autoRefresh ? 'animate-pulse' : ''}`} />
            <span>{autoRefresh ? "Mise à jour Auto (Active)" : "Mise à jour Suspendue"}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive SVG Map & Radar grid */}
      <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-[520px]">
        {/* Futuristic Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-15"></div>

        {/* Radar Sweep Line */}
        <div 
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            width: '180%',
            height: '180%',
            transform: `translate(-50%, -50%) rotate(${radarAngle}deg)`,
            background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.15) 0deg, rgba(16, 185, 129, 0) 90deg)',
            transformOrigin: 'center center',
          }}
        ></div>

        {/* Radar concentric target indicators */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border border-emerald-500/10 rounded-full w-1/4 aspect-square animate-pulse"></div>
          <div className="border border-emerald-500/10 rounded-full w-1/2 aspect-square"></div>
          <div className="border border-emerald-500/10 rounded-full w-3/4 aspect-square"></div>
          <div className="border border-emerald-500/5 rounded-full w-[95%] aspect-square"></div>
          
          {/* Crosshairs */}
          <div className="absolute left-0 right-0 h-[1px] bg-emerald-500/10"></div>
          <div className="absolute top-0 bottom-0 w-[1px] bg-emerald-500/10"></div>
        </div>

        {/* Coordinates compass indices */}
        <div className="absolute top-3 left-3 text-[9px] font-mono text-emerald-500/40 flex items-center space-x-1">
          <Compass className="w-3.5 h-3.5 animate-spin-slow text-emerald-500/30" />
          <span>SCANNING... MODE: SAAS ACTIVE_GEO</span>
        </div>
        <div className="absolute bottom-3 right-3 text-[8px] font-mono text-emerald-500/30">
          GRID REF: TN.02-26 // TUNISIA FOCUS
        </div>

        {/* Actual Plotting Container (Tunisia map overlay styled with high-tech elements) */}
        <div className="relative w-full h-full my-auto mx-auto flex items-center justify-center">
          <div className="relative w-[85%] h-[85%] border border-slate-800/60 rounded-xl bg-slate-950/60 backdrop-blur-xs p-2">
            
            {/* Outline representation of Tunisian coastline and key markers */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-10 pointer-events-none text-emerald-500">
              {/* Very basic vector points outlining Tunisia for professional geo look */}
              <polygon points="35,10 45,5 55,8 65,12 58,22 62,35 68,40 58,55 54,75 50,90 44,90 40,78 32,50 34,35 25,25 35,10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="0.8" />
              {/* Regional grid lines */}
              <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1,2" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1,2" />
            </svg>

            {/* Plotted Connections */}
            {sessions.map((user) => {
              const { x, y } = mapCoordinates(user.lat, user.lng);
              const isSelected = selectedUser?.id === user.id;
              
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="absolute group transition-transform duration-300 hover:scale-125 focus:outline-none"
                  style={{ 
                    left: `${x}%`, 
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Pulse aura */}
                  <span className="absolute -inset-2.5 rounded-full opacity-60 bg-emerald-400/40 animate-ping [animation-duration:1.5s]"></span>
                  
                  {/* Solid beacon node */}
                  <span className={`relative block w-3.5 h-3.5 rounded-full shadow-lg border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-indigo-500 border-white scale-110 z-30' 
                      : 'bg-emerald-500 border-slate-900'
                  }`}>
                    {/* Tiny pulsing core */}
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  </span>

                  {/* Popover label on hover */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 bg-slate-950 text-white border border-slate-800 rounded px-2 py-1 text-[8.5px] font-mono whitespace-nowrap transition-all duration-200 shadow-xl z-50">
                    <p className="font-extrabold text-emerald-400">{user.name}</p>
                    <p className="text-[7.5px] text-slate-400">{user.city} · {user.ping}ms</p>
                  </div>
                </button>
              );
            })}

            {/* Geographical Markers (Tunis, Sousse, Sfax, Bizerte) to anchor the map visually */}
            <div className="absolute top-[18%] left-[54%] flex items-center space-x-1 text-slate-500/60 font-mono text-[7px] pointer-events-none">
              <MapPin className="w-2 h-2" />
              <span>Tunis (Lac 2)</span>
            </div>
            <div className="absolute top-[48%] left-[64%] flex items-center space-x-1 text-slate-500/60 font-mono text-[7px] pointer-events-none">
              <MapPin className="w-2 h-2" />
              <span>Sousse</span>
            </div>
            <div className="absolute top-[68%] left-[70%] flex items-center space-x-1 text-slate-500/60 font-mono text-[7px] pointer-events-none">
              <MapPin className="w-2 h-2" />
              <span>Sfax</span>
            </div>
            <div className="absolute top-[6%] left-[43%] flex items-center space-x-1 text-slate-500/60 font-mono text-[7px] pointer-events-none">
              <MapPin className="w-2 h-2" />
              <span>Bizerte</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Right side: Selected user dossier & connections list */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        
        {/* Dynamic Connected Dossier Panel */}
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Fiche du Collaborateur Connecté</span>
          </h3>

          {selectedUser ? (
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              {/* Bio & Access details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm text-white bg-emerald-600">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-tight flex items-center gap-1.5">
                      <span>{selectedUser.name}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Rôle d'Accès :</span>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Entreprise / Locataire :</span>
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{selectedUser.company}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Adresse IP publique :</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-150 text-[9.5px] text-slate-600">{selectedUser.ip}</span>
                  </div>
                </div>
              </div>

              {/* Geographic, telemetry & diagnostics */}
              <div className="space-y-3 md:border-l md:pl-4 border-slate-150">
                <div className="space-y-2">
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-extrabold">{selectedUser.city}, {selectedUser.country}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Coordonnées GPS : {selectedUser.lat.toFixed(4)}°N, {selectedUser.lng.toFixed(4)}°E
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[10px] flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Action en cours :</span>
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{selectedUser.activePath}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[10px] flex items-center space-x-1">
                      <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Temps de Réponse :</span>
                    </span>
                    <span className={`font-mono font-bold text-[10px] ${
                      selectedUser.ping < 20 ? 'text-emerald-600' : selectedUser.ping < 50 ? 'text-amber-500' : 'text-red-500'
                    }`}>{selectedUser.ping} ms</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-50 border rounded-xl">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">Aucun utilisateur connecté sélectionné.</p>
              <p className="text-slate-400 text-[10px] mt-1">Veuillez cliquer sur un nœud du radar ou sur un membre de la liste ci-dessous.</p>
            </div>
          )}
        </div>

        {/* Connections List Feed */}
        <div className="bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-3 flex-1 flex flex-col">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Globe2 className="w-4 h-4 text-indigo-600" />
              <span>Liste des Sessions Actives sur le Portail</span>
            </span>
            <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-black">
              {sessions.length} Actif{sessions.length > 1 ? 's' : ''}
            </span>
          </h3>

          <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1">
            {sessions.map((user) => {
              const isSelected = selectedUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-indigo-50/60 border-indigo-250 shadow-xs' 
                      : 'bg-white border-slate-150 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white bg-emerald-600">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-emerald-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-slate-700 text-xs truncate max-w-[120px]">{user.name}</span>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-[9.5px] text-slate-400 truncate max-w-[160px]">{user.company}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded block max-w-[140px] truncate">
                      {user.activePath}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 block font-mono">
                      {user.city} · Ping: <span className="font-bold text-emerald-600">{user.ping}ms</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time micro terminal diagnostic logs */}
        <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 shadow-lg font-mono text-[9px] text-slate-300 flex-1 flex flex-col h-[130px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[8px] text-slate-400">
            <span className="flex items-center space-x-1 text-emerald-500 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>TERMINAL DE DIAGNOSTIC DES PROTOCOLES IP (ELYSSA-SEC)</span>
            </span>
            <span>SYSTEME: NOMINAL</span>
          </div>
          
          <div className="overflow-y-auto flex-1 space-y-1.5 scrollbar-thin text-[8.5px] text-slate-400">
            {logs.length === 0 ? (
              <p className="text-slate-500 italic">En attente de protocoles de connexion...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="leading-relaxed hover:text-white transition-colors duration-150">
                  <span className="text-slate-500">&gt;</span> {log}
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
