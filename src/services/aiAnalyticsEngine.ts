import { format, addDays, isAfter, parseISO } from 'date-fns';

export interface LightweightERPContext {
  cashBalance: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalReceivables: number;
  totalPayables: number;
  inventoryValue: number;
  outOfStockAlerts?: number;
  employeeCount?: number;
  todayPresentCount?: number;
  totalPayroll?: number;
  activeMissionsCount?: number;
  availableVehiclesCount?: number;
  totalVehiclesCount?: number;
  lastUpdate: string;
}

export interface Anomaly {
  id: string;
  type: 'PRICE_SPIKE' | 'TAX_ERROR' | 'DUPLICATE' | 'OTHER';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  context: any;
  detectedAt: string;
}

export interface CashflowForecast {
  currentBalance: number;
  forecast30Days: number;
  forecast60Days: number;
  forecast90Days: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class AIAnalyticsEngine {
  /**
   * Extrait et compresse uniquement les métriques essentielles de company_erp_data
   * (pour ne pas dépasser les quotas de tokens)
   */
  static extractLightweightERPContext(erpData: any): LightweightERPContext {
    // Default values if data is missing
    let cashBalance = 0;
    let unpaidInvoicesCount = 0;
    let overdueInvoicesCount = 0;
    let totalReceivables = 0;
    let totalPayables = 0;
    let inventoryValue = 0;

    // 1. Trésorerie
    if (erpData?.treasury_module?.accounts) {
      cashBalance = Object.values(erpData.treasury_module.accounts).reduce(
        (acc: number, curr: any) => acc + (curr.balance || 0),
        0
      ) as number;
    }

    // 2. Ventes (Créances)
    if (erpData?.sales_module?.invoices) {
      const now = new Date();
      Object.values(erpData.sales_module.invoices).forEach((inv: any) => {
        if (inv.status !== 'Paid') {
          unpaidInvoicesCount++;
          totalReceivables += (inv.totalAmount || 0);
          if (inv.dueDate && isAfter(now, parseISO(inv.dueDate))) {
            overdueInvoicesCount++;
          }
        }
      });
    }

    // 3. Achats (Dettes fournisseurs)
    if (erpData?.purchases_module?.invoices) {
      Object.values(erpData.purchases_module.invoices).forEach((inv: any) => {
        if (inv.status !== 'Paid') {
          totalPayables += (inv.totalAmount || 0);
        }
      });
    }

    // 4. Stocks
    let outOfStockAlerts = 0;
    if (erpData?.inventory_module?.items) {
      const items = Array.isArray(erpData.inventory_module.items) ? erpData.inventory_module.items : Object.values(erpData.inventory_module.items);
      inventoryValue = items.reduce(
        (acc: number, item: any) => acc + ((item.quantity || 0) * (item.unitPrice || item.price || 0)),
        0
      ) as number;
      outOfStockAlerts = items.filter((item: any) => (item.quantity ?? 0) <= (item.minThreshold ?? item.min_stock ?? 0)).length;
    } else if (erpData?.products) {
      const items = Array.isArray(erpData.products) ? erpData.products : Object.values(erpData.products);
      inventoryValue = items.reduce(
        (acc: number, item: any) => acc + ((item.stock || item.quantity || 0) * (item.selling_price || item.unitPrice || 0)),
        0
      ) as number;
      outOfStockAlerts = items.filter((item: any) => (item.stock ?? item.quantity ?? 0) <= (item.minStock ?? item.min_stock ?? 0)).length;
    }

    // 5. RH, Collaborateurs & Pointage
    let employeeCount = 0;
    let todayPresentCount = 0;
    let totalPayroll = 0;
    const employeesList = erpData?.employees ? (Array.isArray(erpData.employees) ? erpData.employees : Object.values(erpData.employees)) : [];
    employeeCount = employeesList.length;
    totalPayroll = employeesList.reduce((acc: number, e: any) => acc + (Number(e.baseSalary || e.salary || 0)), 0);

    const attendances = erpData?.attendance_logs ? (Array.isArray(erpData.attendance_logs) ? erpData.attendance_logs : Object.values(erpData.attendance_logs)) : [];
    const todayStr = new Date().toISOString().split('T')[0];
    todayPresentCount = attendances.filter((a: any) => (a.date === todayStr || (a.checkIn && a.checkIn.startsWith(todayStr))) && a.status !== 'Absent').length;

    // 6. Flotte & Missions
    let activeMissionsCount = 0;
    let availableVehiclesCount = 0;
    let totalVehiclesCount = 0;
    const vehicles = erpData?.fleet_inventory ? (Array.isArray(erpData.fleet_inventory) ? erpData.fleet_inventory : Object.values(erpData.fleet_inventory)) : [];
    totalVehiclesCount = vehicles.length;
    availableVehiclesCount = vehicles.filter((v: any) => v.status === 'Available' || v.status === 'disponible' || v.status === 'Actif').length;

    const missions = erpData?.fleet_missions ? (Array.isArray(erpData.fleet_missions) ? erpData.fleet_missions : Object.values(erpData.fleet_missions)) : [];
    activeMissionsCount = missions.filter((m: any) => m.status === 'IN_PROGRESS' || m.status === 'EN_ROUTE' || m.status === 'en_cours').length;

    return {
      cashBalance,
      unpaidInvoices: unpaidInvoicesCount,
      overdueInvoices: overdueInvoicesCount,
      totalReceivables,
      totalPayables,
      inventoryValue,
      outOfStockAlerts,
      employeeCount,
      todayPresentCount,
      totalPayroll,
      activeMissionsCount,
      availableVehiclesCount,
      totalVehiclesCount,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Implémente le moteur de règles déterministes local
   */
  static detectLocalAnomalies(erpData: any): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // 1. Z-Score sur prix d'achat > 25% (Simplified as historical comparison for demo)
    if (erpData?.purchases_module?.items) {
      const items = Object.values(erpData.purchases_module.items);
      items.forEach((item: any) => {
        if (item.historicalPrices && item.historicalPrices.length > 0) {
          const avgPrice = item.historicalPrices.reduce((a: number, b: number) => a + b, 0) / item.historicalPrices.length;
          if (item.currentPrice > avgPrice * 1.25) {
            anomalies.push({
              id: `ANOMALY_PRICE_${item.id}`,
              type: 'PRICE_SPIKE',
              severity: 'HIGH',
              description: `Hausse anormale du prix d'achat pour ${item.name} (> 25% par rapport à la moyenne).`,
              context: { itemId: item.id, avgPrice, currentPrice: item.currentPrice },
              detectedAt: new Date().toISOString()
            });
          }
        }
      });
    }

    // 2. Vérification fiscale TVA/FODEC 1% tunisienne
    if (erpData?.sales_module?.invoices) {
      const invoices = Object.values(erpData.sales_module.invoices);
      const invoiceSignatures = new Set<string>();

      invoices.forEach((inv: any) => {
        // Check FODEC / TVA
        if (inv.isEligibleFodec && inv.fodecAmount !== (inv.netAmount * 0.01)) {
          anomalies.push({
            id: `ANOMALY_TAX_${inv.id}`,
            type: 'TAX_ERROR',
            severity: 'MEDIUM',
            description: `Erreur de calcul FODEC sur la facture ${inv.reference}. Le FODEC doit être de 1% du montant net.`,
            context: { invoiceId: inv.id, expectedFodec: inv.netAmount * 0.01, actualFodec: inv.fodecAmount },
            detectedAt: new Date().toISOString()
          });
        }

        // 3. Détection de doublons de factures (Même montant, même date, même client)
        if (inv.amount && inv.date && inv.clientId) {
          const signature = `${inv.clientId}_${inv.amount}_${inv.date}`;
          if (invoiceSignatures.has(signature)) {
            anomalies.push({
              id: `ANOMALY_DUP_${inv.id}`,
              type: 'DUPLICATE',
              severity: 'HIGH',
              description: `Doublon probable détecté pour la facture ${inv.reference} (même client, montant et date).`,
              context: { invoiceId: inv.id, signature },
              detectedAt: new Date().toISOString()
            });
          }
          invoiceSignatures.add(signature);
        }
      });
    }

    return anomalies;
  }

  /**
   * Moteur hybride de trésorerie (Soldes + échéances + DSO/DPO pondéré)
   */
  static calculateCashflowForecast(erpData: any): CashflowForecast {
    let currentBalance = 0;
    if (erpData?.treasury_module?.accounts) {
      currentBalance = Object.values(erpData.treasury_module.accounts).reduce(
        (acc: number, curr: any) => acc + (curr.balance || 0),
        0
      ) as number;
    }

    // Basic calculation parameters
    const dsoDays = erpData?.metrics?.avgDSO || 45; // Days Sales Outstanding
    const dpoDays = erpData?.metrics?.avgDPO || 30; // Days Payable Outstanding

    let receivables30 = 0, receivables60 = 0, receivables90 = 0;
    let payables30 = 0, payables60 = 0, payables90 = 0;

    const now = new Date();

    if (erpData?.sales_module?.invoices) {
      Object.values(erpData.sales_module.invoices).forEach((inv: any) => {
        if (inv.status !== 'Paid') {
          // Simplistic distribution based on DSO
          if (dsoDays <= 30) receivables30 += (inv.totalAmount || 0);
          else if (dsoDays <= 60) receivables60 += (inv.totalAmount || 0);
          else receivables90 += (inv.totalAmount || 0);
        }
      });
    }

    if (erpData?.purchases_module?.invoices) {
      Object.values(erpData.purchases_module.invoices).forEach((inv: any) => {
        if (inv.status !== 'Paid') {
          if (dpoDays <= 30) payables30 += (inv.totalAmount || 0);
          else if (dpoDays <= 60) payables60 += (inv.totalAmount || 0);
          else payables90 += (inv.totalAmount || 0);
        }
      });
    }

    const forecast30Days = currentBalance + receivables30 - payables30;
    const forecast60Days = forecast30Days + receivables60 - payables60;
    const forecast90Days = forecast60Days + receivables90 - payables90;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (forecast30Days < 0 || forecast60Days < 0) riskLevel = 'HIGH';
    else if (forecast90Days < currentBalance * 0.5) riskLevel = 'MEDIUM';

    return {
      currentBalance,
      forecast30Days,
      forecast60Days,
      forecast90Days,
      riskLevel
    };
  }
}
