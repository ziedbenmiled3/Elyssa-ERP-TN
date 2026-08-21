// src/services/taxCalculations.ts

export const TUNISIAN_TAX_CONSTANTS = {
  TIMBRE_FISCAL: 1.000, // 1,000 TND par facture de vente
  VAT_RATES: [0, 7, 13, 19] as const,
  WITHHOLDING_RATES: {
    B2B_SUPPLY_SERVICES: 1.5, // RS 1.5% (factures >= 1000 TND TTC)
    COMMISSIONS_FEES: 10.0,    // RS 10% honoraires personnes morales
    PROFESSIONAL_FEES_NP: 15.0 // RS 15% professions libérales / personnes physiques
  },
  PAYROLL: {
    CNSS_EMPLOYEE_RATE: 0.0918, // 9.18% part salariale
    CNSS_EMPLOYER_RATE: 0.1657, // 16.57% part patronale
    ACCIDENT_WORK_RATE: 0.0050, // 0.50% Accidents du Travail (base standard)
    CSS_RATE: 0.0100,           // 1% Contribution Sociale Solidaire
    PROFESSIONAL_EXPENSES_RATE: 0.10, // 10% déduction frais professionnels
    PROFESSIONAL_EXPENSES_CAP: 2000   // Plafond 2 000 TND / an
  }
};

// --- MOTEUR FACTURATION & RETENUE À LA SOURCE ---
export interface InvoiceTaxCalculationInput {
  amountHT: number;
  vatRate: number; // 0, 7, 13 ou 19
  applyTimbre?: boolean;
  applyWithholding?: boolean;
  withholdingRate?: number; // Par défaut 1.5%
}

export interface InvoiceTaxCalculationResult {
  amountHT: number;
  vatRate: number;
  vatAmount: number;
  timbreFiscal: number;
  amountTTC: number;
  withholdingAmount: number;
  amountNetToPay: number; // Net financier après RS
}

export function computeInvoiceTaxes(input: InvoiceTaxCalculationInput): InvoiceTaxCalculationResult {
  const { amountHT, vatRate, applyTimbre = true, applyWithholding = false, withholdingRate = 1.5 } = input;
  
  const vatAmount = Number(((amountHT * vatRate) / 100).toFixed(3));
  const timbreFiscal = applyTimbre ? TUNISIAN_TAX_CONSTANTS.TIMBRE_FISCAL : 0;
  const amountTTC = Number((amountHT + vatAmount + timbreFiscal).toFixed(3));
  
  let withholdingAmount = 0;
  if (applyWithholding && amountTTC >= 1000) {
    withholdingAmount = Number(((amountTTC * withholdingRate) / 100).toFixed(3));
  }
  
  const amountNetToPay = Number((amountTTC - withholdingAmount).toFixed(3));

  return {
    amountHT: Number(amountHT.toFixed(3)),
    vatRate,
    vatAmount,
    timbreFiscal,
    amountTTC,
    withholdingAmount,
    amountNetToPay
  };
}

// --- MOTEUR DE PAIE TUNISIEN 2026 (CNSS, IRPP, CSS) ---
export interface PayrollCalculationInput {
  baseSalary: number;
  transportAllowance?: number;
  presenceAllowance?: number;
  otherAllowances?: number;
  childrenCount?: number;
  isHeadOfFamily?: boolean;
}

export interface PayrollCalculationResult {
  grossSalary: number;
  cnssEmployee: number;
  taxableGross: number;
  annualTaxable: number;
  irppAnnual: number;
  irppMonthly: number;
  cssMonthly: number;
  netSalary: number;
  cnssEmployer: number;
  employerTotalCost: number;
}

// Barème IRPP progressif tunisien (Tranches annuelles)
export function computeAnnualIRPP(annualNetTaxable: number, familyDeductions: number): number {
  const taxable = Math.max(0, annualNetTaxable - familyDeductions);
  let tax = 0;

  if (taxable > 50000) {
    tax += (taxable - 50000) * 0.35;
    tax += (50000 - 30000) * 0.30;
    tax += (30000 - 20000) * 0.28;
    tax += (20000 - 5000) * 0.26;
  } else if (taxable > 30000) {
    tax += (taxable - 30000) * 0.30;
    tax += (30000 - 20000) * 0.28;
    tax += (20000 - 5000) * 0.26;
  } else if (taxable > 20000) {
    tax += (taxable - 20000) * 0.28;
    tax += (20000 - 5000) * 0.26;
  } else if (taxable > 5000) {
    tax += (taxable - 5000) * 0.26;
  }

  return Number(tax.toFixed(3));
}

export function computeTunisianPayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const {
    baseSalary,
    transportAllowance = 0,
    presenceAllowance = 0,
    otherAllowances = 0,
    childrenCount = 0,
    isHeadOfFamily = true
  } = input;

  const grossSalary = baseSalary + transportAllowance + presenceAllowance + otherAllowances;
  const cnssEmployee = Number((grossSalary * TUNISIAN_TAX_CONSTANTS.PAYROLL.CNSS_EMPLOYEE_RATE).toFixed(3));
  const monthlyTaxableGross = grossSalary - cnssEmployee;

  // Déduction frais professionnels (10% plafonné à 2000 TND/an)
  const annualGross = monthlyTaxableGross * 12;
  const proExpensesDeduction = Math.min(
    annualGross * TUNISIAN_TAX_CONSTANTS.PAYROLL.PROFESSIONAL_EXPENSES_RATE,
    TUNISIAN_TAX_CONSTANTS.PAYROLL.PROFESSIONAL_EXPENSES_CAP
  );
  const netAnnualTaxableBase = annualGross - proExpensesDeduction;

  // Déductions chef de famille et enfants à charge
  let familyDeductions = 0;
  if (isHeadOfFamily) familyDeductions += 300; // Chef de famille : 300 TND/an
  familyDeductions += Math.min(childrenCount, 4) * 100; // 100 TND par enfant (max 4)

  const irppAnnual = computeAnnualIRPP(netAnnualTaxableBase, familyDeductions);
  const irppMonthly = Number((irppAnnual / 12).toFixed(3));

  // CSS 1% sur le revenu imposable
  const cssMonthly = Number((monthlyTaxableGross * TUNISIAN_TAX_CONSTANTS.PAYROLL.CSS_RATE).toFixed(3));

  const netSalary = Number((grossSalary - cnssEmployee - irppMonthly - cssMonthly).toFixed(3));

  // Charges Patronales
  const cnssEmployer = Number((grossSalary * (TUNISIAN_TAX_CONSTANTS.PAYROLL.CNSS_EMPLOYER_RATE + TUNISIAN_TAX_CONSTANTS.PAYROLL.ACCIDENT_WORK_RATE)).toFixed(3));
  const employerTotalCost = Number((grossSalary + cnssEmployer).toFixed(3));

  return {
    grossSalary: Number(grossSalary.toFixed(3)),
    cnssEmployee,
    taxableGross: Number(monthlyTaxableGross.toFixed(3)),
    annualTaxable: Number(netAnnualTaxableBase.toFixed(3)),
    irppAnnual,
    irppMonthly,
    cssMonthly,
    netSalary,
    cnssEmployer,
    employerTotalCost
  };
}
