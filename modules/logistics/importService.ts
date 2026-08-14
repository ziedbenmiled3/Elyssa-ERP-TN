import { EventBus, AppEvent } from '../../infrastructure/EventBus';

export interface ImportDossierInput {
  dossierId: string;
  items: Array<{ productId: string; qty: number; fobPriceTnd: number }>;
  freightCostTnd: number;
  insuranceCostTnd: number;
  customsDutyRate: number; // e.g. 0.15 (15% standard duties)
  applyAIR: boolean;       // Avance sur Impôt sur les Sociétés (usually 10% or 15% in customs)
  applyRPD: boolean;       // Redevance de Prestations Douanières
}

export interface CredocValidationInput {
  credocNumber: string;
  domiciliationBank: string; // Tunisian Bank (e.g. BIAT, UIB, BH)
  currency: string;          // EUR, USD, etc.
  amountForeign: number;
  authorizedImportCode: string; // BCT Authorized Import Code
  coveragePercentage: number;   // Circular 2017-01 mandatory cash collateral
}

export class ImportService {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Validates a Letter of Credit (Crédoc) against standard BCT (Banque Centrale de Tunisie) circulars and control exchange laws.
   */
  public validateBCTCredocCompliance(credoc: CredocValidationInput): { compliant: boolean; errors: string[] } {
    const errors: string[] = [];

    // BCT circulars check: Every letter of credit must be domiciled with an approved intermediary Tunisian bank
    const approvedTunisianBanks = ['BIAT', 'UIB', 'BH', 'ATB', 'STB', 'BNA', 'AMEN', 'BT'];
    const uppercaseBank = credoc.domiciliationBank.toUpperCase();
    if (!approvedTunisianBanks.some(b => uppercaseBank.includes(b))) {
      errors.push(`La banque de domiciliation "${credoc.domiciliationBank}" n'est pas agréée par la BCT.`);
    }

    // BCT requirement: Importers must possess a valid customs import code authorization
    if (!credoc.authorizedImportCode || credoc.authorizedImportCode.length < 5) {
      errors.push("Code d'autorisation d'importation BCT manquant ou invalide.");
    }

    // BCT requirements: Minimum cash margin/collateral percentage compliance checks (Circular 2017-01 rules)
    if (credoc.coveragePercentage < 100) {
      errors.push(`Taux de couverture insuffisant (${credoc.coveragePercentage}%). La BCT impose une couverture minimale de 100% pour les produits non essentiels.`);
    }

    return {
      compliant: errors.length === 0,
      errors
    };
  }

  /**
   * Calculates Landed Cost (Coût de revient consolidé) for port of Radès/Sfax clearance.
   * Compiles FOB prices, freight, insurance, customs, RPD, and AIR to determine accurate warehouse cost adjustments.
   */
  public calculateLandedCost(companyId: string, input: ImportDossierInput): any {
    const round3 = (val: number) => Math.round(val * 1000) / 1000;

    const totalFob = input.items.reduce((sum, item) => sum + (item.fobPriceTnd * item.qty), 0);
    
    // CIF (Cost, Insurance, Freight) - Base value for Customs Duties
    const totalCif = totalFob + input.freightCostTnd + input.insuranceCostTnd;

    // Customs Duties (Droits de douane) - e.g. 15% on CIF
    const customsDuties = round3(totalCif * input.customsDutyRate);

    // RPD (Redevance Prestations Douanières) - Standard fixed/proportional tax
    const rpd = input.applyRPD ? round3(totalCif * 0.03) : 0.000; // 3% estimation or fixed

    // AIR (Avance sur Impôt sur les Sociétés) - 10% on (CIF + Customs Duties + RPD)
    const airBasis = totalCif + customsDuties + rpd;
    const airTax = input.applyAIR ? round3(airBasis * 0.10) : 0.000;

    // Consolidate total transit cost
    const totalConsolidatedImportCost = totalCif + customsDuties + rpd + airTax;

    // Calculate individual landed cost unit prices by distributing transit expenses proportionally
    const costRatio = totalConsolidatedImportCost / totalFob;

    const itemsWithLandedCost = input.items.map(item => {
      const originalUnitPrice = item.fobPriceTnd;
      const landedUnitPrice = round3(originalUnitPrice * costRatio);
      return {
        productId: item.productId,
        qty: item.qty,
        originalFobPrice: originalUnitPrice,
        landedCostUnitPrice: landedUnitPrice,
        totalLandedCost: round3(landedUnitPrice * item.qty)
      };
    });

    const result = {
      dossierId: input.dossierId,
      totalFob: round3(totalFob),
      totalCif: round3(totalCif),
      customsDuties,
      rpd,
      airTax,
      totalConsolidatedImportCost: round3(totalConsolidatedImportCost),
      items: itemsWithLandedCost
    };

    // Close the import dossier and emit event so STOCKS_FOURNISSEURS can increment stock values asynchronously
    const closeEvent: AppEvent = {
      eventId: `EV-IMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      eventType: 'IMPORT_DOSSIER_CLOSED',
      timestamp: new Date().toISOString(),
      companyId,
      payload: result
    };

    this.eventBus.publish(closeEvent);

    return result;
  }
}
