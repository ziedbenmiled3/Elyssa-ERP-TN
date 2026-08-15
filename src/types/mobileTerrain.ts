export type AssignedModule = 'standard' | 'chantier' | 'vente' | 'polyvalent' | 'livraison';

export type DeliveryStatus = 'non_requis' | 'en_attente' | 'en_transit' | 'livre';

export type PickingOrderStatus = 'en_attente' | 'en_cours' | 'pret_chargement' | 'annule';

export interface PickingOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  warehouseId?: string;
  warehouseName?: string;
  unitPrice?: number;
}

export interface PickingOrder {
  id: string;
  tenantId?: string;
  orderId: string;
  clientName: string;
  deliveryAddress: string;
  warehouseId: string;
  warehouseName: string;
  dockNumber?: string; // e.g. "Quai 2 - Dépôt Charguia"
  items: PickingOrderItem[];
  status: PickingOrderStatus;
  createdAt: string;
  preparedAt?: string;
  preparedBy?: string;
  notes?: string;
  // Reverse Logistics & SLA fields
  reintegrationStatus?: 'a_reintegrer' | 'reintegre';
  reintegratedAt?: string;
  reintegratedBy?: string;
  cancellationReason?: string;
  cancellationDate?: string;
  totalAmountTTC?: number;
}

export interface CreditNote {
  id: string;
  tenantId?: string;
  clientId?: string;
  clientName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  amountTTC: number;
  reason: string;
  issuedDate: string;
  status: 'VALIDE' | 'REMBOURSE' | 'COMPENSE';
  paymentMethod?: 'AVOIR_COMPTE' | 'CHEQUE' | 'ESPECES' | 'VIREMENT';
  refundOrderId?: string;
}

export interface RefundOrder {
  id: string;
  tenantId?: string;
  clientId?: string;
  clientName: string;
  sourceType: 'ANNULATION_FACTURE' | 'RETOUR_DEPOT' | 'POS_CAISSE' | 'RECLAMATION';
  sourceRef: string;
  amount: number;
  reason: string;
  status: 'EN_ATTENTE' | 'CHEQUE_EN_PREPARATION' | 'PAYE_VALIDE' | 'REJETEE';
  paymentMethod: 'CHEQUE' | 'VIREMENT' | 'ESPECES_POS' | 'AVOIR_COMPTE';
  chequeNumber?: string;
  bankName?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface DeliveryPickupStop {
  stop_id: string;
  warehouse_id: string;
  warehouse_name: string;
  dock_number?: string;
  address?: string;
  items: { productName: string; quantity: number }[];
  status: 'en_attente' | 'charge';
  loaded_at?: string;
}

export interface ItemQualification {
  articleId: string;
  articleName: string;
  qtyOrdered: number;
  qtyDelivered: number;
  status: 'LIVRE' | 'REFUSE' | 'PARTIEL';
  returnReason?: string;
  unitPriceTTC?: number;
}

export interface PaymentCollection {
  method: 'CASH' | 'CHEQUE' | 'TRAITE' | 'DEJA_PAYE';
  amountTTC: number;
  chequeNumber?: string;
  bankName?: string;
  collectedAt?: string;
}

export interface WithholdingTaxRS {
  enabled: boolean;
  certificateNumber?: string;
  ratePercent: number;
  amountRS: number;
  issueDate?: string;
}

export interface DeliveryTourOrder {
  order_id: string;
  client_name: string;
  address: string;
  amount_ttc: number;
  amount_ht?: number;
  delivery_status: 'en_attente' | 'en_transit' | 'livre' | 'refuse';
  sales_channel?: 'web' | 'pos' | 'field_sales';
  warehouse_location?: string;
  dock_number?: string;
  warehouses_involved?: string[];
  pickup_stops?: DeliveryPickupStop[];
  signatureUrl?: string;
  delivered_at?: string;
  notes?: string;
  // Cross-Module Pipeline Fields
  item_qualifications?: ItemQualification[];
  payment_collected?: PaymentCollection;
  withholding_tax_rs?: WithholdingTaxRS;
  pod_gps?: { lat: number; lng: number; timestamp: string; address?: string };
  signed_bl_document_id?: string;
  clientCreditAlert?: { creditLimit: number; currentOutstanding: number; overdueCount: number; isExceeded: boolean };
  estimatedWeightKg?: number;
}

export interface EveningTourClosure {
  closedAt: string;
  closedBy: string;
  expectedCash: number;
  actualCash: number;
  expectedCheques: number;
  actualCheques: number;
  expectedRSAmount: number;
  actualRSAmount: number;
  cashGap: number;
  status: 'CONFORME' | 'ARBITRAGE_REQUIS';
  endingOdometerKm: number;
  startingOdometerKm: number;
  distanceTraveledKm: number;
  fuelExpensesTND: number;
  tollExpensesTND: number;
  receiptRef?: string;
  treasuryTxId?: string;
  notes?: string;
}

export interface DeliveryTour {
  id: string;
  tenantId: string;
  tour_number: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_name: string;
  pickup_warehouse?: string;
  warehouse_location?: string;
  orders: DeliveryTourOrder[];
  status: 'en_preparation' | 'en_cours' | 'terminee' | 'cloturee_validee';
  created_at: string;
  notes?: string;
  // Cross-Module Payload & Closure
  total_weight_kg?: number;
  vehicle_max_payload_kg?: number;
  payload_ratio_percent?: number;
  evening_closure?: EveningTourClosure;
  actualCashCounted?: number;
  actualChequesCounted?: number;
  actualRSCounted?: number;
}

export type FleetDeviceStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Decommissioned' | 'Garage' | 'En Panne';

export interface FleetInventoryItem {
  id: string;
  tenantId: string;
  category?: string; // e.g. "Terminal Mobile", "Véhicule", "Outillage Chantier", "Informatique", etc.
  fleet_park: string; // e.g. "Flotte Commerciale & Vente", "Flotte Chantiers", "Flotte Logistique", "Stock Réserve"
  device_name: string; // Nom / Marque / Modèle
  serial_reference: string; // Référence Unique / N° de Série / VIN / IMEI
  status: FleetDeviceStatus;
  assignedTo?: string; // Agent auquel l'appareil est loué / attribué
  assignedDriver?: string;
  registeredAt: string;
  mileage?: number;
  maxPayloadKg?: number;
}

export interface MobileDevice {
  id: string;
  tenantId: string;
  agentId: string; // Relational employeeId pointing to MOD-03 HR
  vehicleId?: string; // Relational vehicleId pointing to MOD-08 Fleet
  agentName: string;
  deviceModel: string;
  assigned_module?: AssignedModule;
  imeiOrUuid?: string;
  lastSync: Date | string;
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  batteryLevel?: number;
  appVersion?: string;
  macAddress?: string;
  phoneNumber?: string;
}

export type GeofenceMode = 'SIEGE' | 'CHANTIER' | 'VAN_SALES';

export interface FieldSession {
  id: string;
  tenantId: string;
  agentId: string; // Relational employeeId pointing to MOD-03 HR
  vehicleId?: string; // Relational vehicleId pointing to MOD-08 Fleet
  agentName?: string;
  type: 'VAN_SALES' | 'CHANTIER';
  depotVanId?: string;
  chantierId?: string;
  checkIn: {
    timestamp: Date | string;
    lat: number;
    lng: number;
    address?: string;
    photoUrl?: string;
    geofenceValid?: boolean;
    verificationMode?: GeofenceMode;
  };
  checkOut?: {
    timestamp: Date | string;
    lat: number;
    lng: number;
    address?: string;
  };
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface AttendancePointage {
  id: string;
  tenantId: string;
  agentId: string;
  agentName?: string;
  timestamp: Date | string;
  type: 'IN' | 'OUT';
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    address?: string;
  };
  mode: GeofenceMode;
  geofenceValid: boolean;
  distanceToTargetMeters: number;
  agendaItemId?: string;
  metadata?: {
    clientName?: string;
    chantierName?: string;
    photoUrl?: string;
    deviceModel?: string;
  };
}

export interface FieldAgendaItem {
  id: string;
  tenantId: string;
  agentId: string;
  date: string; // ISO format 'YYYY-MM-DD'
  orderIndex: number;
  clientOrChantierId: string;
  targetName: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  visitType: 'VAN_DELIVERY' | 'PROSPECTING' | 'CHANTIER_INSPECTION';
  notes?: string;
}

export interface MobileOrderItem {
  articleId: string;
  label: string;
  qty: number;
  unitPrice: number;
  total: number;
  productName?: string;
  quantity?: number;
  unitPriceHT?: number;
  tvaRate?: number;
}

export interface MobileOrder {
  id: string;
  tenantId: string;
  localUuid: string;
  agentId?: string;
  agentName?: string;
  clientId: string;
  clientName: string;
  items: MobileOrderItem[];
  totalHT: number;
  totalTTC: number;
  paymentStatus: 'PAID' | 'PENDING';
  paymentMethod?: 'CASH' | 'CHECK' | 'TRAITE';
  signatureUrl?: string;
  signatureDataUrl?: string;
  ticketNumber?: string;
  timestamp?: Date | string | number;
  clientTaxId?: string;
  gpsCoordinates?: string;
  status?: 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED';
  createdAt: Date | string;
}

export interface ChantierMaterialItem {
  articleId: string;
  articleName?: string;
  qty: number;
  unit?: string;
}

export interface ChantierReport {
  id: string;
  tenantId: string;
  chantierId: string;
  chantierName?: string;
  chefChantierId: string;
  chefChantierName?: string;
  date: Date | string;
  workersPresent: number;
  materialsConsumed: ChantierMaterialItem[];
  photoUrls: string[];
  signatureUrl?: string;
  notes: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface VanArticleStock {
  articleId: string;
  reference: string;
  label: string;
  unitPrice: number;
  stockQty: number;
  lastUpdated: string;
}

export interface TenantSubscription {
  tenantId: string;
  plan: 'ESSENTIAL' | 'PRO' | 'ENTERPRISE';
  activeModules: string[];
  quotas: {
    maxUsers: number;
    maxFieldAgents: number;
    monthlyBiometricVerifications: number;
  };
  addOnPricing: {
    mobileFleetActive: boolean;
    pricePerExtraFieldAgent: number; // ex: 39 TND / mois
  };
}

export interface FieldAgentLicense {
  agentId: string; // Relational employeeId pointing to MOD-03 HR
  vehicleId?: string; // Relational vehicleId pointing to MOD-08 Fleet
  vehicleLabel?: string;
  agentName: string;
  email: string;
  role: string;
  department: string;
  hasMobileLicense: boolean;
  assignedAt?: string;
  lastMobileSync?: string;
}
