import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FieldSession } from '../../types/mobileTerrain';
import { MapPin } from 'lucide-react';

// Fix Leaflet default marker icons in Vite/React environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center map on selected session
const MapController: React.FC<{ selectedSession?: FieldSession | null }> = ({ selectedSession }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedSession && selectedSession.checkIn && typeof selectedSession.checkIn.lat === 'number') {
      map.setView([selectedSession.checkIn.lat, selectedSession.checkIn.lng], 13, {
        animate: true,
      });
    }
  }, [selectedSession, map]);

  return null;
};

// Custom Marker Icon Generator using L.divIcon
const createAgentMarkerIcon = (type: 'VAN_SALES' | 'CHANTIER', agentName: string = '', isSelected: boolean = false) => {
  const isVan = type === 'VAN_SALES';
  const bgColor = isVan ? '#0284c7' : '#d97706'; // Sky-600 vs Amber-600
  const borderColor = isSelected ? '#4f46e5' : '#ffffff'; // Indigo border if selected
  const iconEmoji = isVan ? '🚚' : '🏗️';
  const label = agentName ? agentName.split(' ')[0] : (isVan ? 'Van' : 'Chantier');

  return L.divIcon({
    className: 'custom-agent-marker-wrapper',
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 5px;
        background-color: ${bgColor};
        border: 2px solid ${borderColor};
        color: #ffffff;
        padding: 4px 10px;
        border-radius: 9999px;
        font-family: ui-sans-serif, system-ui, sans-serif;
        font-weight: 800;
        font-size: 11px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        white-space: nowrap;
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        transition: transform 0.2s ease-in-out;
      ">
        <span style="font-size: 13px; line-height: 1;">${iconEmoji}</span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [110, 32],
    iconAnchor: [55, 16],
    popupAnchor: [0, -18],
  });
};

export interface FieldAgentsMapProps {
  sessions: FieldSession[];
  selectedSessionId?: string;
  onSelectSession?: (session: FieldSession) => void;
}

export const FieldAgentsMap: React.FC<FieldAgentsMapProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
}) => {
  // Center of Tunisia (Tunis coordinates default)
  const defaultCenter: [number, number] = [36.8065, 10.1815];
  const defaultZoom = 7;

  const activeSessions = sessions.filter(
    (s) => s.checkIn && typeof s.checkIn.lat === 'number' && typeof s.checkIn.lng === 'number'
  );

  const selectedSession = activeSessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-slate-300 shadow-md">
      
      {/* Top Overlay HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-xl text-xs font-mono text-slate-200 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold text-white">CARTE INTERACTIVE CARTO • ELYSSA ERP</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          {activeSessions.length} Agent(s) Géolocalisé(s) en Tunisie
        </span>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%', minHeight: '480px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapController selectedSession={selectedSession} />

        {activeSessions.map((session) => {
          const isSelected = session.id === selectedSessionId;
          const isVan = session.type === 'VAN_SALES';
          const formattedTime = session.checkIn?.timestamp
            ? (typeof session.checkIn.timestamp === 'string'
              ? new Date(session.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : (session.checkIn.timestamp instanceof Date ? session.checkIn.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(session.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })))
            : '--:--';

          return (
            <Marker
              key={session.id}
              position={[session.checkIn.lat, session.checkIn.lng]}
              icon={createAgentMarkerIcon(session.type, session.agentName, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectSession) {
                    onSelectSession(session);
                  }
                },
              }}
            >
              <Popup className="elyssa-map-popup">
                <div className="p-1 space-y-2 min-w-[200px] text-slate-800 font-sans">
                  {/* Popup Header with Agent Name & Type Badge */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {session.agentName || session.agentId}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white ${
                        isVan ? 'bg-sky-600' : 'bg-amber-600'
                      }`}
                    >
                      {isVan ? 'VAN SALES' : 'CHANTIER'}
                    </span>
                  </div>

                  {/* CheckIn info */}
                  <div className="space-y-1 text-xs text-slate-600 font-mono">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="font-bold truncate">
                        {session.checkIn.address || `${session.checkIn.lat.toFixed(4)}, ${session.checkIn.lng.toFixed(4)}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Check-In: <strong>{formattedTime}</strong></span>
                      <span className="text-emerald-600 font-bold">STATUS: {session.status}</span>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      GPS: {session.checkIn.lat.toFixed(4)}, {session.checkIn.lng.toFixed(4)}
                    </div>
                  </div>

                  {session.notes && (
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px] text-slate-600 italic">
                      "{session.notes}"
                    </div>
                  )}

                  <button
                    onClick={() => onSelectSession && onSelectSession(session)}
                    className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase py-1.5 rounded-lg transition cursor-pointer text-center"
                  >
                    Inspecter cette Session
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Bottom Map Info Legend Footer */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-2.5 rounded-xl text-xs flex justify-between items-center text-slate-200 shadow-lg">
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block border border-white"></span>
            <span>Van Sales (Vente Itinérante)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-white"></span>
            <span>Suivi Chantier</span>
          </span>
        </div>

        {selectedSession && (
          <div className="text-[11px] font-bold text-indigo-300 truncate max-w-[200px]">
            Actif: {selectedSession.agentName}
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldAgentsMap;
