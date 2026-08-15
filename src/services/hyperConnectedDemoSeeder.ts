import { db } from '../utils/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Employee, Invoice } from '../types';
import { DeliveryTour, FleetInventoryItem, PickingOrder } from '../types/mobileTerrain';
import { DEFAULT_DEMO_PERFORMANCE_CONTRACTS } from './performanceContractService';

export interface HyperConnectedDemoResult {
  employees: Employee[];
  fleetVehicles: FleetInventoryItem[];
  invoices: Invoice[];
  deliveryTours: DeliveryTour[];
  warehouses: any[];
  incomingEmails: any[];
  caisseTransactions: any[];
  accountingEntries: any[];
}

/**
 * Générateur de données de démonstration hyper-connectées (Cross-Modules) pour Elyssa ERP.
 * Seeding automatique et simultané dans Firestore sous company_erp_data/{tenantId}/...
 */
export async function seedHyperConnectedDemoData(tenantId: string): Promise<HyperConnectedDemoResult> {
  const companyId = (tenantId || 'Inter-Affaires').trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
  const now = new Date().toISOString();

  // 1. Ressources Humaines & Terrain (employees & collaborators)
  const employeesData: Employee[] = [
    {
      id: 'EMP-LIV-01',
      name: 'Hamza Ben Salem',
      email: 'h.bensalem@elyssa-erp.tn',
      phone: '+216 98 123 456',
      jobTitle: 'Chauffeur / Livreur Express',
      department: 'Logistique & Expéditions',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 1450,
      hireDate: '2022-03-01',
      nationalId: '08765432',
      birthDate: '1990-05-14',
      address: 'Cité El Khadra, Tunis',
      assigned_module: 'livraison',
      cnssNumber: '90812345-01'
    },
    {
      id: 'EMP-COM-01',
      name: 'Sami Cherif',
      email: 's.cherif@elyssa-erp.tn',
      phone: '+216 97 234 567',
      jobTitle: 'Commercial Itinérant',
      department: 'Ventes & Commercial Terrain',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 1850,
      hireDate: '2021-06-15',
      nationalId: '09876543',
      birthDate: '1988-11-20',
      address: 'Sousse Centre, Sousse',
      assigned_module: 'vente',
      cnssNumber: '90823456-02'
    },
    {
      id: 'EMP-POS-01',
      name: 'Mounir Karray',
      email: 'm.karray@elyssa-erp.tn',
      phone: '+216 95 345 678',
      jobTitle: 'Chef de Caisse / Vendeur POS',
      department: 'Magasin & Showroom POS',
      status: 'Active',
      contractType: 'CDI',
      baseSalary: 1350,
      hireDate: '2023-01-10',
      nationalId: '07654321',
      birthDate: '1992-02-10',
      address: 'Les Berges du Lac, Tunis',
      assigned_module: 'vente',
      cnssNumber: '90834567-03'
    }
  ];

  // Collaborators mapping
  const collaboratorsData = employeesData.map(e => ({
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.jobTitle,
    department: e.department,
    assigned_module: e.assigned_module,
    status: 'Active',
    license_status: 'Active'
  }));

  // Pointages & Attendance Logs
  const attendanceLogs = [
    {
      id: `att-liv-01-${Date.now()}`,
      employeeId: 'EMP-LIV-01',
      employeeName: 'Hamza Ben Salem',
      timestamp: new Date().toISOString(),
      type: 'IN',
      method: 'facial',
      location: 'Dépôt Central Charguia',
      verified: true
    },
    {
      id: `att-com-01-${Date.now()}`,
      employeeId: 'EMP-COM-01',
      employeeName: 'Sami Cherif',
      timestamp: new Date().toISOString(),
      type: 'IN',
      method: 'gps',
      location: 'Agence Sousse',
      verified: true
    },
    {
      id: `att-pos-01-${Date.now()}`,
      employeeId: 'EMP-POS-01',
      employeeName: 'Mounir Karray',
      timestamp: new Date().toISOString(),
      type: 'IN',
      method: 'facial',
      location: 'Showroom Tunis',
      verified: true
    }
  ];

  // 2. Parc Roulant & Matériel (fleet_inventory & fleet_vehicles)
  const fleetVehiclesData: FleetInventoryItem[] = [
    {
      id: 'FLEET-ISUZU-01',
      tenantId: companyId,
      fleet_park: 'Dépôt Central Charguia',
      device_name: 'Camion Isuzu D-Max',
      serial_reference: 'TN-210-9842',
      category: 'Véhicule Utilitaire / Camion',
      status: 'Available',
      registeredAt: now,
      mileage: 48500,
      assignedDriver: 'Hamza Ben Salem',
      maxPayloadKg: 1000
    },
    {
      id: 'FLEET-PARTNER-02',
      tenantId: companyId,
      fleet_park: 'Magasin Principal Tunis',
      device_name: 'Fourgon Peugeot Partner',
      serial_reference: 'TN-198-4431',
      category: 'Véhicule Utilitaire',
      status: 'Available',
      registeredAt: now,
      mileage: 22100,
      assignedDriver: 'Sami Cherif',
      maxPayloadKg: 1200
    },
    {
      id: 'FLEET-ISUZU-12T',
      tenantId: companyId,
      fleet_park: 'Dépôt Central Radès',
      device_name: 'Camion Isuzu 12 Tonnes Poids Lourd',
      serial_reference: 'TN-9021-33',
      category: 'Camion Poids Lourd',
      status: 'Available',
      registeredAt: now,
      mileage: 89400,
      assignedDriver: 'Kamel Trad',
      maxPayloadKg: 12000
    }
  ];

  // 3. Entrepôts & Stocks (warehouses & products)
  const warehousesData = [
    {
      id: 'WH-CHARGUIA-01',
      code: 'DEP-01',
      name: 'Dépôt Central Charguia',
      address: 'Zone Industrielle Charguia I, Tunis',
      manager: 'Hamza Ben Salem',
      capacity: '5000 m2',
      status: 'Active'
    },
    {
      id: 'WH-TUNIS-02',
      code: 'MAG-02',
      name: 'Magasin Principal Tunis',
      address: 'Avenue Habib Bourguiba, Tunis',
      manager: 'Mounir Karray',
      capacity: '1200 m2',
      status: 'Active'
    }
  ];

  const productsData = [
    {
      id: "PROD-CIM-50",
      sku: "CIM-50",
      name: "Ciment Portland Super CPJ45 (Sac 50kg)",
      category: "Gros Œuvre",
      type: "PRODUIT_FINI",
      unitPrice: 14.500,
      costPrice: 11.200,
      vatRate: 19,
      stockQuantity: 1200,
      stockLevel: 1200,
      minStockLevel: 300,
      unit: "Sac",
      supplierName: "Les Ciments de Bizerte",
      warehouse_location: "Dépôt Central - Radès (Tunis)"
    },
    {
      id: "PROD-BRI-12",
      sku: "BRI-12",
      name: "Brique Rouge 12 Alvéoles (Paquet)",
      category: "Gros Œuvre",
      type: "PRODUIT_FINI",
      unitPrice: 0.850,
      costPrice: 0.620,
      vatRate: 19,
      stockQuantity: 5000,
      stockLevel: 5000,
      minStockLevel: 1000,
      unit: "Paquet",
      supplierName: "Briqueterie El Wafa",
      warehouse_location: "Dépôt Central - Radès (Tunis)"
    },
    {
      id: "PROD-PEI-SAT",
      sku: "PEI-SAT",
      name: "Peinture Satino-Vinylique Blanche 15L",
      category: "Finition",
      type: "PRODUIT_FINI",
      unitPrice: 85.000,
      costPrice: 62.000,
      vatRate: 19,
      stockQuantity: 180,
      stockLevel: 180,
      minStockLevel: 40,
      unit: "Pot",
      supplierName: "Astral Tunisie",
      warehouse_location: "Magasin Principal - Tunis Bourguiba"
    },
    {
      id: "PROD-ROB-LAI",
      sku: "ROB-LAI",
      name: "Robinet Mélangeur Évier Laiton Chromé",
      category: "Sanitaire",
      type: "PRODUIT_FINI",
      unitPrice: 65.000,
      costPrice: 45.000,
      vatRate: 19,
      stockQuantity: 95,
      stockLevel: 95,
      minStockLevel: 25,
      unit: "Unité",
      supplierName: "SOPAL Tunisie",
      warehouse_location: "Magasin Principal - Tunis Bourguiba"
    },
    {
      id: "PROD-CAB-25",
      sku: "CAB-25",
      name: "Câble Électrique Rigide 2.5mm² (Rouleau 100m)",
      category: "Électricité",
      type: "PRODUIT_FINI",
      unitPrice: 110.000,
      costPrice: 82.000,
      vatRate: 19,
      stockQuantity: 320,
      stockLevel: 320,
      minStockLevel: 60,
      unit: "Rouleau",
      supplierName: "Chakira Câbles",
      warehouse_location: "Dépôt Central - Radès (Tunis)"
    },
    {
      id: "PROD-FER-12",
      sku: "FER-12",
      name: "Barre de Fer à Béton HLE 12mm (12m)",
      category: "Gros Œuvre",
      type: "PRODUIT_FINI",
      unitPrice: 28.000,
      costPrice: 21.000,
      vatRate: 19,
      stockQuantity: 850,
      stockLevel: 850,
      minStockLevel: 200,
      unit: "Barre",
      supplierName: "EL FOULADH Menzel Bourguiba",
      warehouse_location: "Dépôt Central - Radès (Tunis)"
    },
    {
      id: "PROD-DIS-CUT",
      sku: "DIS-CUT",
      name: "Disque de Découpe Diamanté 230mm Pro",
      category: "Outillage",
      type: "PRODUIT_FINI",
      unitPrice: 42.000,
      costPrice: 29.000,
      vatRate: 19,
      stockQuantity: 410,
      stockLevel: 410,
      minStockLevel: 100,
      unit: "Pièce",
      supplierName: "Bosch Tunisie Tools",
      warehouse_location: "Magasin Principal - Tunis Bourguiba"
    },
    {
      id: "PROD-DISJ-16",
      sku: "DISJ-16",
      name: "Disjoncteur Divisionnaire 16A",
      category: "Électricité",
      type: "PRODUIT_FINI",
      unitPrice: 7.050,
      costPrice: 4.550,
      vatRate: 19,
      stockQuantity: 1000,
      stockLevel: 1000,
      minStockLevel: 250,
      unit: "Pièce",
      supplierName: "Schneider Electric Tunisie",
      warehouse_location: "Usine GPAO & Dépôt Central"
    },
    {
      id: "RAW-CU-CAT",
      sku: "CU-CAT",
      name: "Cuivre Cathodique Pur de Haute Pureté",
      category: "Matières Premières",
      type: "MATIERE_PREMIERE",
      unitPrice: 24.500,
      costPrice: 24.500,
      vatRate: 19,
      stockQuantity: 850,
      stockLevel: 850,
      minStockLevel: 500,
      unit: "Kg",
      supplierName: "Société Tuniso-Africaine du Cuivre",
      warehouse_location: "Magasin Matières Usine"
    },
    {
      id: "RAW-PVC-GRA",
      sku: "PVC-GRA",
      name: "Grains PVC Isolants Auto-extinguibles",
      category: "Matières Premières",
      type: "MATIERE_PREMIERE",
      unitPrice: 4.800,
      costPrice: 4.800,
      vatRate: 19,
      stockQuantity: 1200,
      stockLevel: 1200,
      minStockLevel: 800,
      unit: "Kg",
      supplierName: "Tunisie Chimie Industrielle (TCI)",
      warehouse_location: "Magasin Matières Usine"
    },
    {
      id: "RAW-BOB-MAG",
      sku: "BOB-MAG",
      name: "Bobine de Déclenchement Magnétique 230V",
      category: "Matières Premières",
      type: "MATIERE_PREMIERE",
      unitPrice: 1.800,
      costPrice: 1.800,
      vatRate: 19,
      stockQuantity: 1500,
      stockLevel: 1500,
      minStockLevel: 1000,
      unit: "Pièce",
      supplierName: "Composants Électroniques du Cap Bon",
      warehouse_location: "Magasin Matières Usine"
    },
    {
      id: "RAW-RES-ACI",
      sku: "RES-ACI",
      name: "Ressort Acier Allié pour Déclencheur",
      category: "Matières Premières",
      type: "MATIERE_PREMIERE",
      unitPrice: 0.350,
      costPrice: 0.350,
      vatRate: 19,
      stockQuantity: 2200,
      stockLevel: 2200,
      minStockLevel: 1200,
      unit: "Pièce",
      supplierName: "Ressorts Industriels de Ben Arous",
      warehouse_location: "Magasin Matières Usine"
    }
  ];

  // 4. Multi-Canaux de Commandes & Factures (invoices & delivery_tours)
  const invoicesData: Invoice[] = [
    {
      id: 'FAC-2026-0881',
      invoiceNumber: 'FAC-2026-0881',
      clientId: 'CLI-WEB-881',
      clientName: 'Société du Sahel Distribution',
      sales_channel: 'web',
      warehouse_location: 'Entrepôt Principal - Z.I. Charguia II + Magasin Tunis Principal - Av. Bourguiba',
      warehouses_involved: [
        'Entrepôt Principal - Z.I. Charguia II',
        'Magasin Tunis Principal - Av. Bourguiba'
      ],
      multi_depot_tag: '📍 2 Dépôts impliqués (Charguia II + Tunis)',
      delivery_address: 'Zone Industrielle Akouda, Lot 14, Sousse',
      amountHT: 9800,
      vatRate: 19,
      vatAmount: 1862,
      withholdingTaxRate: 1.5,
      withholdingAmount: 147,
      amountNetToPay: 11515,
      amountTTC: 11662,
      status: 'Unpaid',
      delivery_status: 'en_attente',
      issuedDate: now,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      items: [
        {
          code: 'PROD-BTP-001',
          description: '40 Sacs Ciment Portland CEM I + 15 Palettes Briques (Ramassage Charguia II)',
          quantity: 55,
          unitPrice: 100,
          totalTTC: 5500
        },
        {
          code: 'PROD-PNT-006',
          description: '6 Pots Peinture Industrielle + 18 Rouleaux Câbles Armés (Ramassage Tunis Bourguiba)',
          quantity: 24,
          unitPrice: 256.75,
          totalTTC: 6162
        }
      ],
      recouvrementSteps: [],
      withholdingCertificateReceived: false,
      is_demo: true
    },
    {
      id: 'FAC-2026-0900',
      invoiceNumber: 'FAC-2026-0900',
      clientId: 'CLI-GTS-900',
      clientName: 'Grands Travaux du Sud - GTS',
      sales_channel: 'field_sales',
      commercial_id: 'EMP-COM-01',
      commercial_name: 'Sami Cherif (Commercial Terrain)',
      warehouse_location: 'Entrepôt Principal - Z.I. Charguia II + Magasin Tunis Principal + Stock Logistique Sousse',
      warehouses_involved: [
        'Entrepôt Principal - Z.I. Charguia II',
        'Magasin Tunis Principal',
        'Stock Logistique Sousse'
      ],
      multi_depot_tag: '📍 3 Dépôts impliqués (Charguia II + Tunis + Sousse)',
      delivery_address: 'Chantier Autoroute A1, Km 140, Sfax',
      amountHT: 20882.35,
      vatRate: 19,
      vatAmount: 3967.65,
      withholdingTaxRate: 1.5,
      withholdingAmount: 313.24,
      amountNetToPay: 24536.76,
      amountTTC: 24850,
      status: 'Unpaid',
      delivery_status: 'en_attente',
      issuedDate: now,
      dueDate: new Date(Date.now() + 45 * 86400000).toISOString(),
      items: [
        {
          code: 'PROD-STC-100',
          description: 'Armatures Acier BTP 12mm (Ramassage Charguia II)',
          quantity: 100,
          unitPrice: 120,
          totalTTC: 12000
        },
        {
          code: 'PROD-OUT-020',
          description: 'Outillage Coffrage Lourd (Ramassage Magasin Tunis Principal)',
          quantity: 20,
          unitPrice: 282.5,
          totalTTC: 5650
        },
        {
          code: 'PROD-AGG-050',
          description: 'Grave Bitume Routier (Ramassage Stock Logistique Sousse)',
          quantity: 50,
          unitPrice: 144,
          totalTTC: 7200
        }
      ],
      recouvrementSteps: [],
      withholdingCertificateReceived: false,
      is_demo: true
    },
    {
      id: 'POS-2026-0104',
      invoiceNumber: 'POS-2026-0104',
      clientId: 'CLI-POS-104',
      clientName: 'Comptoir BTP Ariana',
      sales_channel: 'pos',
      seller_id: 'EMP-POS-01',
      seller_name: 'Mounir Karray (Chef de Caisse)',
      warehouse_location: 'Magasin Principal Tunis',
      delivery_address: 'Chantier Résidence Les Jasmins, Ariana',
      amountHT: 8500,
      vatRate: 19,
      vatAmount: 1615,
      withholdingTaxRate: 1.5,
      withholdingAmount: 127.5,
      amountNetToPay: 9987.5,
      amountTTC: 10115,
      status: 'Paid',
      delivery_status: 'en_attente',
      issuedDate: now,
      dueDate: now,
      items: [
        {
          code: 'PROD-ALU-002',
          description: 'Profilés Aluminium Anodisé 6m',
          quantity: 70,
          unitPrice: 145,
          totalTTC: 10115
        }
      ],
      recouvrementSteps: [],
      withholdingCertificateReceived: true,
      is_demo: true
    },
    {
      id: 'COM-2026-0052',
      invoiceNumber: 'COM-2026-0052',
      clientId: 'CLI-FIELD-052',
      clientName: 'Établissements Trabelsi Sousse',
      sales_channel: 'field_sales',
      commercial_id: 'EMP-COM-01',
      commercial_name: 'Sami Cherif (Commercial Terrain)',
      warehouse_location: 'Dépôt Central Charguia',
      delivery_address: 'Avenue Habib Bourguiba, Nabeul',
      amountHT: 3100,
      vatRate: 19,
      vatAmount: 589,
      withholdingTaxRate: 1.5,
      withholdingAmount: 46.5,
      amountNetToPay: 3642.5,
      amountTTC: 3689,
      status: 'Unpaid',
      delivery_status: 'en_attente',
      issuedDate: now,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      items: [
        {
          code: 'PROD-BTP-001',
          description: 'Ciment Portland CEM I 42.5',
          quantity: 200,
          unitPrice: 18.445,
          totalTTC: 3689
        }
      ],
      recouvrementSteps: [],
      withholdingCertificateReceived: false,
      is_demo: true
    }
  ];

  // Ordres de Préparation / Picking Orders pour Multi-Dépôts
  const pickingOrdersData: PickingOrder[] = [
    {
      id: 'PICK-881-1',
      tenantId: companyId,
      orderId: 'FAC-2026-0881',
      clientName: 'Société du Sahel Distribution',
      deliveryAddress: 'Zone Industrielle Akouda, Lot 14, Sousse',
      warehouseId: 'WH-CHARGUIA-01',
      warehouseName: 'Entrepôt Principal - Z.I. Charguia II',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-BTP-001', productName: '40 Sacs Ciment Portland CEM I', quantity: 40 },
        { productId: 'PROD-BRQ-015', productName: '15 Palettes Briques de Structure', quantity: 15 }
      ]
    },
    {
      id: 'PICK-881-2',
      tenantId: companyId,
      orderId: 'FAC-2026-0881',
      clientName: 'Société du Sahel Distribution',
      deliveryAddress: 'Zone Industrielle Akouda, Lot 14, Sousse',
      warehouseId: 'WH-TUNIS-02',
      warehouseName: 'Magasin Tunis Principal - Av. Bourguiba',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-PNT-006', productName: '6 Pots Peinture Industrielle', quantity: 6 },
        { productId: 'PROD-CBL-018', productName: '18 Rouleaux Câbles Armés', quantity: 18 }
      ]
    },
    {
      id: 'PICK-900-1',
      tenantId: companyId,
      orderId: 'FAC-2026-0900',
      clientName: 'Grands Travaux du Sud - GTS',
      deliveryAddress: 'Chantier Autoroute A1, Km 140, Sfax',
      warehouseId: 'WH-CHARGUIA-01',
      warehouseName: 'Entrepôt Principal - Z.I. Charguia II',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-STC-100', productName: '100 Armatures Acier BTP 12mm', quantity: 100 }
      ]
    },
    {
      id: 'PICK-900-2',
      tenantId: companyId,
      orderId: 'FAC-2026-0900',
      clientName: 'Grands Travaux du Sud - GTS',
      deliveryAddress: 'Chantier Autoroute A1, Km 140, Sfax',
      warehouseId: 'WH-TUNIS-02',
      warehouseName: 'Magasin Tunis Principal',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-OUT-020', productName: '20 Outillages Coffrage Lourd', quantity: 20 }
      ]
    },
    {
      id: 'PICK-900-3',
      tenantId: companyId,
      orderId: 'FAC-2026-0900',
      clientName: 'Grands Travaux du Sud - GTS',
      deliveryAddress: 'Chantier Autoroute A1, Km 140, Sfax',
      warehouseId: 'WH-SOUSSE-03',
      warehouseName: 'Stock Logistique Sousse',
      status: 'pret_chargement',
      createdAt: now,
      items: [
        { productId: 'PROD-AGG-050', productName: '50 Unités Grave Bitume Routier', quantity: 50 }
      ]
    }
  ];

  // Incoming Emails linked to Web Order
  const incomingEmailsData = [
    {
      id: 'EML-2026-881',
      subject: 'Confirmation Commande Web #FAC-2026-0881 - Société du Sahel Distribution',
      sender: 'achats@sahel-distribution.tn',
      recipient: 'commandes@elyssa-erp.tn',
      date: now,
      content: 'Bonjour l\'équipe Elyssa ERP, nous confirmons la commande web N° FAC-2026-0881 (11 662.00 TND) nécessitant un ramassage sur 2 dépôts (Charguia II + Tunis Bourguiba) à livrer sur notre site de Sousse. Merci.',
      status: 'processed',
      linked_invoice_id: 'FAC-2026-0881'
    }
  ];

  // Tournées de Livraison initiales pour Hamza Ben Salem & Kamel Trad
  const deliveryToursData: DeliveryTour[] = [
    {
      id: 'TOUR-2026-0881',
      tenantId: companyId,
      tour_number: 'TR-2026-0881',
      driver_id: 'EMP-LIV-01',
      driver_name: 'Hamza Ben Salem (Chauffeur / Livreur Express)',
      vehicle_id: 'FLEET-ISUZU-01',
      vehicle_name: 'Camion Isuzu D-Max [TN-210-9842]',
      pickup_warehouse: 'Charguia II + Tunis Bourguiba',
      warehouse_location: 'Charguia II + Tunis Bourguiba',
      status: 'en_cours',
      created_at: now,
      notes: 'Tournée multi-ramassage (2 Dépôts) : Quai Charguia II + Quai Tunis Bourguiba -> Sousse.',
      orders: [
        {
          order_id: 'FAC-2026-0881',
          client_name: 'Société du Sahel Distribution',
          address: 'Zone Industrielle Akouda, Lot 14, Sousse',
          amount_ttc: 11662,
          delivery_status: 'en_transit',
          sales_channel: 'web',
          warehouse_location: 'Entrepôt Principal - Z.I. Charguia II + Magasin Tunis Principal - Av. Bourguiba',
          warehouses_involved: [
            'Entrepôt Principal - Z.I. Charguia II',
            'Magasin Tunis Principal - Av. Bourguiba'
          ],
          pickup_stops: [
            {
              stop_id: 'STOP-881-1',
              warehouse_id: 'WH-CHARGUIA-01',
              warehouse_name: 'Entrepôt Principal - Z.I. Charguia II',
              address: 'Entrepôt Principal - Z.I. Charguia II - Quai #1',
              items: [
                { productName: '40 Sacs Ciment Portland CEM I', quantity: 40 },
                { productName: '15 Palettes Briques de Structure', quantity: 15 }
              ],
              status: 'charge',
              loaded_at: now
            },
            {
              stop_id: 'STOP-881-2',
              warehouse_id: 'WH-TUNIS-02',
              warehouse_name: 'Magasin Tunis Principal - Av. Bourguiba',
              address: 'Magasin Tunis Principal - Av. Bourguiba - Quai #2',
              items: [
                { productName: '6 Pots Peinture Industrielle', quantity: 6 },
                { productName: '18 Rouleaux Câbles Armés', quantity: 18 }
              ],
              status: 'en_attente'
            }
          ]
        }
      ]
    },
    {
      id: 'TOUR-2026-0900',
      tenantId: companyId,
      tour_number: 'TR-2026-0900',
      driver_id: 'emp_drv_01',
      driver_name: 'Kamel Trad (Chauffeur Logistique Poids Lourds)',
      vehicle_id: 'v_camion_12t',
      vehicle_name: 'Camion Isuzu 12 Tonnes [TN-9021]',
      pickup_warehouse: 'Charguia II + Tunis + Sousse',
      warehouse_location: 'Charguia II + Tunis + Sousse',
      status: 'en_cours',
      created_at: now,
      notes: 'Tournée grand itinéraire 3 dépôts (Charguia II + Tunis + Sousse) -> Chantier Autoroute A1 Sfax.',
      orders: [
        {
          order_id: 'FAC-2026-0900',
          client_name: 'Grands Travaux du Sud - GTS',
          address: 'Chantier Autoroute A1, Km 140, Sfax',
          amount_ttc: 24850,
          delivery_status: 'en_transit',
          sales_channel: 'field_sales',
          warehouse_location: 'Entrepôt Principal - Z.I. Charguia II + Magasin Tunis Principal + Stock Logistique Sousse',
          warehouses_involved: [
            'Entrepôt Principal - Z.I. Charguia II',
            'Magasin Tunis Principal',
            'Stock Logistique Sousse'
          ],
          pickup_stops: [
            {
              stop_id: 'STOP-900-1',
              warehouse_id: 'WH-CHARGUIA-01',
              warehouse_name: 'Entrepôt Principal - Z.I. Charguia II',
              address: 'Entrepôt Principal - Z.I. Charguia II - Quai #1',
              items: [
                { productName: '100 Armatures Acier BTP 12mm', quantity: 100 }
              ],
              status: 'charge',
              loaded_at: now
            },
            {
              stop_id: 'STOP-900-2',
              warehouse_id: 'WH-TUNIS-02',
              warehouse_name: 'Magasin Tunis Principal',
              address: 'Magasin Tunis Principal - Quai #2',
              items: [
                { productName: '20 Outillages Coffrage Lourd', quantity: 20 }
              ],
              status: 'en_attente'
            },
            {
              stop_id: 'STOP-900-3',
              warehouse_id: 'WH-SOUSSE-03',
              warehouse_name: 'Stock Logistique Sousse',
              address: 'Stock Logistique Sousse - Quai #3',
              items: [
                { productName: '50 Unités Grave Bitume Routier', quantity: 50 }
              ],
              status: 'en_attente'
            }
          ]
        }
      ]
    }
  ];

  // 5. Finance, Caisse & Comptabilité (caisse_transactions & accounting_entries)
  const caisseTransactionsData = [
    {
      id: 'TRX-POS-104',
      date: now,
      type: 'Encaissement Vente POS',
      category: 'Vente Caisse',
      amount: 10115,
      cashier_id: 'EMP-POS-01',
      cashier_name: 'Mounir Karray',
      reference: 'POS-2026-0104',
      client: 'Comptoir BTP Ariana',
      journal: 'Caisse Showroom Tunis',
      status: 'Validated'
    }
  ];

  const accountingEntriesData = [
    {
      id: 'ECR-POS-2026-0104',
      journalCode: 'VT',
      pieceNumber: 'POS-2026-0104',
      date: now,
      label: 'Vente Caisse POS Comptoir BTP Ariana - Mounir Karray',
      lines: [
        { account: '530000', accountLabel: 'Caisse Showroom Tunis', debit: 10115, credit: 0 },
        { account: '707000', accountLabel: 'Ventes de marchandises POS', debit: 0, credit: 8500 },
        { account: '445700', accountLabel: 'TVA Collectée 19%', debit: 0, credit: 1615 }
      ]
    }
  ];

  // FIRESTORE PERSISTENCE
  if (db) {
    try {
      // Employees
      for (const emp of employeesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'employees', emp.id), emp, { merge: true });
      }

      // Collaborators
      for (const col of collaboratorsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'collaborators', col.id), col, { merge: true });
      }

      // Attendance logs
      for (const att of attendanceLogs) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'attendance_logs', att.id), att, { merge: true });
      }

      // Fleet
      for (const veh of fleetVehiclesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'fleet_inventory', veh.id), veh, { merge: true });
        await setDoc(doc(db, 'company_erp_data', companyId, 'fleet_vehicles', veh.id), veh, { merge: true });
      }

      // Warehouses
      for (const wh of warehousesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'warehouses', wh.id), wh, { merge: true });
      }

      // Products
      for (const prod of productsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'products', prod.id), prod, { merge: true });
      }

      // Invoices
      for (const inv of invoicesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'invoices', inv.id), inv, { merge: true });
      }

      // Incoming Emails
      for (const eml of incomingEmailsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'incomingEmails', eml.id), eml, { merge: true });
      }

      // Delivery Tours
      for (const tour of deliveryToursData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'delivery_tours', tour.id), tour, { merge: true });
      }

      // Caisse Transactions
      for (const ctx of caisseTransactionsData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'caisse_transactions', ctx.id), ctx, { merge: true });
      }

      // Accounting Entries
      for (const acc of accountingEntriesData) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'bank_transactions', acc.id), acc, { merge: true });
      }

      // Performance Contracts (MPO/OKR)
      for (const perf of DEFAULT_DEMO_PERFORMANCE_CONTRACTS) {
        await setDoc(doc(db, 'company_erp_data', companyId, 'performance_contracts', perf.id), perf, { merge: true });
      }

      console.log('✅ [seedHyperConnectedDemoData] Seeding Firestore sous company_erp_data réussi.');
    } catch (err) {
      console.error('❌ [seedHyperConnectedDemoData] Firestore seed error:', err);
    }
  }

  // Also update LocalStorage keys
  try {
    localStorage.setItem('carthage_employees', JSON.stringify(employeesData));
    localStorage.setItem('carthage_invoices', JSON.stringify(invoicesData));
    localStorage.setItem('carthage_fleet_vehicles', JSON.stringify(fleetVehiclesData));
    localStorage.setItem('carthage_products', JSON.stringify(productsData));
    localStorage.setItem('carthage_incoming_emails', JSON.stringify(incomingEmailsData));
    localStorage.setItem('carthage_performance_contracts', JSON.stringify(DEFAULT_DEMO_PERFORMANCE_CONTRACTS));
    localStorage.setItem('carthage_demo_simulation_active', 'true');
    
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('elyssa_demo_reloaded', { detail: { tenantId: companyId } }));
  } catch (e) {}

  return {
    employees: employeesData,
    fleetVehicles: fleetVehiclesData,
    invoices: invoicesData,
    deliveryTours: deliveryToursData,
    warehouses: warehousesData,
    incomingEmails: incomingEmailsData,
    caisseTransactions: caisseTransactionsData,
    accountingEntries: accountingEntriesData
  };
}
