import { GeofenceMode, FieldAgendaItem } from '../types/mobileTerrain';

/**
 * Coordonnées par défaut du Siège Social Elyssa ERP (Exemple: Tunis)
 */
export const DEFAULT_SIEGE_LOCATION = {
  lat: 36.8065,
  lng: 10.1815,
  name: 'Siège Social Principal'
};

/**
 * Rayon maximal de géofencing autorisé en mètres (150m)
 */
export const GEOFENCE_RADIUS_METERS = 150;

/**
 * Calcul de distance géographique selon la formule de Haversine.
 * @returns Distance en mètres entre deux coordonnées GPS.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000; // Rayon moyen de la Terre
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;

  return Math.round(distance * 10) / 10; // Arrondi à 0.1 mètre près
}

export interface GeofenceValidationParams {
  agentLocation: { lat: number; lng: number };
  mode: GeofenceMode;
  siegeLocation?: { lat: number; lng: number; name?: string };
  chantierLocation?: { lat: number; lng: number; name?: string };
  todayAgenda?: FieldAgendaItem[];
  customRadiusMeters?: number;
}

export interface GeofenceValidationResult {
  isValid: boolean;
  distanceMeters: number;
  maxRadiusMeters: number;
  mode: GeofenceMode;
  targetLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  message: string;
}

/**
 * Valide un pointage GPS selon 3 modes contextuels :
 * - Mode Siège : Rayon de 150m autour des coordonnées fixes du siège.
 * - Mode Chantier : Rayon de 150m autour des coordonnées du projet.
 * - Mode Van Sales (Dynamique) : Distance par rapport aux coordonnées du premier client planifié dans l'agenda.
 */
export function validateGeofencedAttendance(
  params: GeofenceValidationParams
): GeofenceValidationResult {
  const {
    agentLocation,
    mode,
    siegeLocation = DEFAULT_SIEGE_LOCATION,
    chantierLocation,
    todayAgenda = [],
    customRadiusMeters = GEOFENCE_RADIUS_METERS
  } = params;

  let targetLat = siegeLocation.lat;
  let targetLng = siegeLocation.lng;
  let targetName = siegeLocation.name || 'Siège Social';

  if (mode === 'CHANTIER') {
    if (chantierLocation) {
      targetLat = chantierLocation.lat;
      targetLng = chantierLocation.lng;
      targetName = chantierLocation.name || 'Zone Chantier Projet';
    } else {
      targetName = 'Chantier (Coordonnées non définies)';
    }
  } else if (mode === 'VAN_SALES') {
    // Trier par orderIndex pour récupérer le 1er client planifié de la journée
    const sortedAgenda = [...todayAgenda].sort((a, b) => a.orderIndex - b.orderIndex);
    const firstClient = sortedAgenda.find((item) => item.status !== 'CANCELLED');

    if (firstClient && firstClient.location) {
      targetLat = firstClient.location.lat;
      targetLng = firstClient.location.lng;
      targetName = `Client N°1: ${firstClient.targetName}`;
    } else {
      // Si aucun agenda n'est chargé, repli sécurisé sur le dépôt ou siège
      targetLat = siegeLocation.lat;
      targetLng = siegeLocation.lng;
      targetName = 'Dépôt / Point de Départ Itinérant';
    }
  }

  const distanceMeters = calculateHaversineDistance(
    agentLocation.lat,
    agentLocation.lng,
    targetLat,
    targetLng
  );

  const isValid = distanceMeters <= customRadiusMeters;

  const message = isValid
    ? `Pointage validé (${distanceMeters}m de "${targetName}", limite: ${customRadiusMeters}m)`
    : `Pointage HORS PERIMETRE ! Distance: ${distanceMeters}m de "${targetName}" (Max autorisé: ${customRadiusMeters}m)`;

  return {
    isValid,
    distanceMeters,
    maxRadiusMeters: customRadiusMeters,
    mode,
    targetLocation: {
      lat: targetLat,
      lng: targetLng,
      name: targetName
    },
    message
  };
}
