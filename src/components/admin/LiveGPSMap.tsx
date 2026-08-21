import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Map, 
  Radio, 
  Layers, 
  Compass, 
  Crosshair, 
  RefreshCw, 
  Truck, 
  ShieldAlert, 
  BatteryCharging, 
  Search, 
  UserCheck, 
  Clock, 
  ArrowUpRight, 
  Sliders, 
  Eye,
  Building2,
  Phone,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export type AgentStatus = 'SUR_SITE' | 'EN_DEPLACEMENT' | 'HORS_ZONE';

export interface FieldAgentLocation {
  id: string;
  agentId: string; // Relational employeeId pointing to MOD-03
  vehicleId?: string; // Relational vehicleId pointing to MOD-08
  agentName: string;
  role: string;
  vehicleRef?: string;
  status: AgentStatus;
  lat: number;
  lng: number;
  address: string;
  siteOrClientName: string;
  batteryLevel: number;
  lastPunchTime: string;
  lastPunchType: 'IN' | 'OUT' | 'WAYPOINT';
  speedKmH: number;
  geofenceRadiusMeters: number;
  distanceFromSiteMeters: number;
  biometricVerified: boolean;
  photoUrl?: string;
  phoneNumber?: string;
}

const MOCK_AGENTS: FieldAgentLocation[] = [
  {
    id: 'agent_loc_1',
    agentId: 'demo-emp_6',
    vehicleId: 'demo-v_2',
    agentName: 'Hamza Ben Salem',
    role: 'Chauffeur Livreur / Logistique',
    vehicleRef: 'Isuzu D-Max Pick-Up (240 TN 8812)',
    status: 'EN_DEPLACEMENT',
    lat: 35.5034,
    lng: 10.4502,
    address: 'Autoroute A1 (Sens Tunis -> Sfax, Km 142)',
    siteOrClientName: 'Mission: Livraison Client Poulina (1 450 kg)',
    batteryLevel: 92,
    lastPunchTime: '07:30',
    lastPunchType: 'WAYPOINT',
    speedKmH: 88,
    geofenceRadiusMeters: 250,
    distanceFromSiteMeters: 45,
    biometricVerified: true,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    phoneNumber: '+216 29 881 200'
  },
  {
    id: 'agent_loc_2',
    agentId: 'demo-emp_3',
    vehicleId: 'demo-v_3',
    agentName: 'Mohamed Ali Gharbi',
    role: 'Chargé Clientèle / Ventes',
    vehicleRef: 'Citroën C-Élysée (215 TUN 9811)',
    status: 'SUR_SITE',
    lat: 35.8256,
    lng: 10.63699,
    address: 'Avenue Habib Bourguiba, Zone Commerciale Sousse',
    siteOrClientName: 'Mission: Prospection Commerciale Sousse',
    batteryLevel: 84,
    lastPunchTime: '08:00',
    lastPunchType: 'IN',
    speedKmH: 0,
    geofenceRadiusMeters: 150,
    distanceFromSiteMeters: 12,
    biometricVerified: true,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    phoneNumber: '+216 98 445 670'
  }
];

export interface LiveGPSMapProps {
  tenantId?: string;
  className?: string;
  employees?: any[];
  vehicles?: any[];
  onSelectAgent?: (agent: FieldAgentLocation) => void;
}

/**
 * Composant LiveGPSMap - Back-Office Suivi Géolocalisé en Temps Réel (MOD-11)
 * Visualisation cartographique stylisée dark-mode avec radar géofencing et liste des agents sur le terrain.
 */
export const LiveGPSMap: React.FC<LiveGPSMapProps> = ({
  tenantId = 'GEP',
  className = '',
  employees,
  vehicles,
  onSelectAgent
}) => {
  const [agents, setAgents] = useState<FieldAgentLocation[]>(MOCK_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<FieldAgentLocation | null>(MOCK_AGENTS[0]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AgentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapStyle, setMapStyle] = useState<'RADAR' | 'SATELLITE' | 'GRID'>('RADAR');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRadarScan, setAutoRadarScan] = useState<boolean>(true);

  // Dynamic lookup sync from MOD-03 & MOD-08
  useEffect(() => {
    if ((employees && employees.length > 0) || (vehicles && vehicles.length > 0)) {
      setAgents(prevAgents => prevAgents.map(ag => {
        const emp = employees?.find((e: any) => e.id === ag.agentId || e.matricule === ag.agentId);
        const veh = vehicles?.find((v: any) => v.assignedToEmployeeId === ag.agentId || v.id === ag.vehicleId);
        return {
          ...ag,
          agentName: emp ? emp.name : ag.agentName,
          role: emp ? emp.jobTitle : ag.role,
          vehicleRef: veh ? `${veh.brand} ${veh.model} (${veh.registrationNumber})` : ag.vehicleRef
        };
      }));
    }
  }, [employees, vehicles]);

  // Filtrage des agents
  const filteredAgents = agents.filter(agent => {
    const matchesStatus = statusFilter === 'ALL' || agent.status === statusFilter;
    const matchesSearch = 
      agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.siteOrClientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calcul des compteurs de statut
  const countSurSite = agents.filter(a => a.status === 'SUR_SITE').length;
  const countDeplacement = agents.filter(a => a.status === 'EN_DEPLACEMENT').length;
  const countHorsZone = agents.filter(a => a.status === 'HORS_ZONE').length;

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'SUR_SITE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Sur site
          </span>
        );
      case 'EN_DEPLACEMENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
            <Truck className="w-3 h-3 text-sky-400" />
            En déplacement
          </span>
        );
      case 'HORS_ZONE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm shadow-amber-500/10">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Hors zone
          </span>
        );
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-sans text-slate-100 ${className}`}>
      
      {/* En-tête : Titre & Actions Cartographiques */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Carte GPS & Flotte Terrain en Direct</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  MOD-11
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Suivi géolocalisé en temps réel, contrôle des périmètres géofencés et statut biométrique des agents.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'Action & Style Carte */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {/* Sélecteur de Style de Carte */}
          <div className="bg-slate-950 p-1 border border-slate-800 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setMapStyle('RADAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapStyle === 'RADAR' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Radar GPS
            </button>
            <button
              onClick={() => setMapStyle('GRID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapStyle === 'GRID' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grille Multi-Sites
            </button>
          </div>

          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer"
            title="Rafraîchir les positions GPS"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Barre de Filtres par Statut & Statistiques Clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        
        {/* Tous */}
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-indigo-600/15 border-indigo-500 text-indigo-200 shadow-lg'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Agents sur le Terrain</span>
            <span className="text-xl font-black text-white">{agents.length} Agents</span>
          </div>
          <Radio className="w-5 h-5 text-indigo-400 shrink-0" />
        </button>

        {/* Sur site */}
        <button
          onClick={() => setStatusFilter('SUR_SITE')}
          className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            statusFilter === 'SUR_SITE'
              ? 'bg-emerald-600/15 border-emerald-500 text-emerald-200 shadow-lg'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sur Site & Conformes</span>
            <span className="text-xl font-black text-emerald-400">{countSurSite} Agents</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        </button>

        {/* En déplacement */}
        <button
          onClick={() => setStatusFilter('EN_DEPLACEMENT')}
          className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            statusFilter === 'EN_DEPLACEMENT'
              ? 'bg-sky-600/15 border-sky-500 text-sky-200 shadow-lg'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">En Déplacement / Transit</span>
            <span className="text-xl font-black text-sky-400">{countDeplacement} Vehicles</span>
          </div>
          <Truck className="w-5 h-5 text-sky-400 shrink-0" />
        </button>

        {/* Hors zone */}
        <button
          onClick={() => setStatusFilter('HORS_ZONE')}
          className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
            statusFilter === 'HORS_ZONE'
              ? 'bg-amber-600/15 border-amber-500 text-amber-200 shadow-lg'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Alerte Périmètre / Hors Zone</span>
            <span className="text-xl font-black text-amber-400">{countHorsZone} Alertes</span>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        </button>

      </div>

      {/* Grid Cartographie + Panneau Latéral */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* VUE CARTE VECTORIELLE / RADAR (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl relative min-h-[460px] overflow-hidden flex flex-col justify-between p-4 shadow-inner">
          
          {/* Fond de Carte Stylisé avec Grille Cartographique */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
          
          {/* Radar Sweep Effect (Animation de Balayage GPS) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-[500px] h-[500px] border border-indigo-500/30 rounded-full animate-ping" />
            <div className="w-[300px] h-[300px] border border-indigo-500/40 rounded-full" />
            <div className="w-[100px] h-[100px] border border-indigo-500/60 rounded-full" />
          </div>

          {/* En-tête Carte Info Overlay */}
          <div className="relative z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span className="font-mono text-indigo-300 font-bold">TUNISIA_FIELD_HUB :: Live GPS Grid</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Site GEP
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Hors Périmètre
              </span>
            </div>
          </div>

          {/* MARQUEURS DES AGENTS PLACÉS INTERACTIVEMENT SUR LA CARTE SIMULÉE */}
          <div className="relative z-10 my-auto py-12 px-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    if (onSelectAgent) onSelectAgent(agent);
                  }}
                  className={`relative p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer group hover:scale-105 ${
                    isSelected
                      ? 'bg-indigo-950/90 border-indigo-400 shadow-xl shadow-indigo-950/50 ring-2 ring-indigo-500/40'
                      : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  {/* Halo d'Alerte si Hors Zone */}
                  {agent.status === 'HORS_ZONE' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-md">
                      !
                    </div>
                  )}

                  <div className="flex items-start space-x-2.5">
                    {/* Avatar / Photo avec badge statut */}
                    <div className="relative shrink-0">
                      <img
                        src={agent.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt={agent.agentName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                        agent.status === 'SUR_SITE' ? 'bg-emerald-400' : agent.status === 'EN_DEPLACEMENT' ? 'bg-sky-400' : 'bg-amber-400'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-indigo-300">
                          {agent.agentName}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {agent.siteOrClientName}
                      </p>
                      
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {agent.lastPunchTime}
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {agent.speedKmH > 0 ? `${agent.speedKmH} km/h` : 'Immobile'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Indicateur de Sélection */}
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-indigo-800/50 flex items-center justify-between text-[10px] text-indigo-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Crosshair className="w-3 h-3 text-indigo-400" /> Cible Active
                      </span>
                      <span>Détails &rarr;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pied de Carte : Coordonnées GPS du point sélectionné */}
          {selectedAgent && (
            <div className="relative z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-[11px] text-slate-300">
                  LAT: <strong>{selectedAgent.lat.toFixed(4)}°</strong> | LNG: <strong>{selectedAgent.lng.toFixed(4)}°</strong>
                </span>
                <span className="text-slate-500">({selectedAgent.address})</span>
              </div>

              <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                <span>Batterie Agent: {selectedAgent.batteryLevel}%</span>
              </div>
            </div>
          )}

        </div>

        {/* LISTE DES AGENTS TERRAIN & PANNEAU DÉTAILLÉ (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
          
          {/* Barre de Recherche dans le Panneau */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher agent, site, véhicule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Fiche Détaillée de l'Agent Sélectionné */}
          {selectedAgent && (
            <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedAgent.photoUrl}
                    alt={selectedAgent.agentName}
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-500/50"
                  />
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedAgent.agentName}</h3>
                    <p className="text-xs text-slate-400">{selectedAgent.role}</p>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold">
                      ID: {selectedAgent.agentId}
                    </span>
                  </div>
                </div>

                {getStatusBadge(selectedAgent.status)}
              </div>

              {/* Détails Véhicule & Géofencing */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Affectation / Site :</span>
                  <span className="font-bold text-white text-right truncate max-w-[160px]">{selectedAgent.siteOrClientName}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Véhicule Imposté :</span>
                  <span className="font-mono text-slate-200">{selectedAgent.vehicleRef || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Écart Périmètre GPS :</span>
                  <span className={`font-mono font-bold ${selectedAgent.distanceFromSiteMeters > selectedAgent.geofenceRadiusMeters ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {selectedAgent.distanceFromSiteMeters}m (Max: {selectedAgent.geofenceRadiusMeters}m)
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Reconnaissance Biométrique :</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> IA Validée
                  </span>
                </div>
              </div>

              {/* Action Appel Direct */}
              {selectedAgent.phoneNumber && (
                <a
                  href={`tel:${selectedAgent.phoneNumber}`}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contacter l'Agent ({selectedAgent.phoneNumber})</span>
                </a>
              )}
            </div>
          )}

          {/* Liste Récapitulative des Agents */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex-1 max-h-[220px] overflow-y-auto space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block">
              Agents Terrain ({filteredAgents.length})
            </span>
            {filteredAgents.map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setSelectedAgent(a);
                  if (onSelectAgent) onSelectAgent(a);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedAgent?.id === a.id
                    ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <img
                    src={a.photoUrl}
                    alt={a.agentName}
                    className="w-7 h-7 rounded-lg object-cover shrink-0"
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">{a.agentName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{a.siteOrClientName}</div>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {getStatusBadge(a.status)}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};

export default LiveGPSMap;
