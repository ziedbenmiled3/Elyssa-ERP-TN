export interface PayrollInput {
  grossSalary: number; // Monthly gross salary in TND
  isMarried: boolean;  // For chef de famille deduction
  numberOfKids: number;
  kidsInUniversity: number; // Additional deduction per student
  accidentRate?: number;    // Employer accident rate (default 0.5%)
}

export interface PayrollResult {
  grossSalary: number;
  cnssEmployee: number;    // 9.18% of gross
  cnssEmployer: number;    // 16.57% of gross
  cnssAccident: number;    // accident rate of gross
  taxableIncomeMonthly: number;
  irppMonthly: number;
  netSalary: number;       // gross - cnssEmployee - irppMonthly
  totalEmployerCost: number; // gross + cnssEmployer + cnssAccident
}

export class PayrollService {
  /**
   * Computes Tunisian legal payroll based on standard Finance Law rules.
   * Inputs are monthly, calculations are projected annually for IRPP bracket tax brackets.
   */
  public calculatePayroll(input: PayrollInput): PayrollResult {
    const round3 = (val: number) => Math.round(val * 1000) / 1000;

    // 1. CNSS Deductions
    const employeeCnssRate = 0.0918; // 9.18%
    const employerCnssRate = 0.1657; // 16.57%
    const accidentRate = input.accidentRate !== undefined ? input.accidentRate : 0.005; // 0.5% default

    const cnssEmployee = round3(input.grossSalary * employeeCnssRate);
    const cnssEmployer = round3(input.grossSalary * employerCnssRate);
    const cnssAccident = round3(input.grossSalary * accidentRate);

    // 2. Annualize Gross Salary for IRPP
    const annualGross = input.grossSalary * 12;
    const annualCnssEmployee = cnssEmployee * 12;
    
    // Net salary after CNSS
    let annualNetTaxableBase = annualGross - annualCnssEmployee;

    // 3. Deductions: Professional Expenses (10% of taxable base, capped at 2000 TND annually)
    const professionalExpenses = Math.min(annualNetTaxableBase * 0.10, 2000);
    annualNetTaxableBase -= professionalExpenses;

    // 4. Family deductions
    let familyDeductions = 0;
    if (input.isMarried) {
      familyDeductions += 150; // Chef de famille deduction
    }

    // Kids deductions (standard kids: 100 TND per child, capped at 4 kids = max 400 TND)
    const kidsCount = Math.min(input.numberOfKids, 4);
    familyDeductions += kidsCount * 100;

    // University kids (additional 1000 TND per kid, capped at 4 kids total)
    const uniKidsCount = Math.min(input.kidsInUniversity, 4 - kidsCount);
    familyDeductions += uniKidsCount * 1000;

    // Apply deductions (not letting taxable income go below 0)
    annualNetTaxableBase = Math.max(0, annualNetTaxableBase - familyDeductions);

    // 5. IRPP Progressive Scale (Current Tunisian Finance Law brackets)
    // Slabs:
    // 0 - 5,000 TND : 0%
    // 5,000 - 20,000 TND : 26%
    // 20,000 - 30,000 TND : 28%
    // 30,000 - 50,000 TND : 32%
    // Over 50,000 TND : 35%
    let annualIrpp = 0;
    let remainingIncome = annualNetTaxableBase;

    // Slab 1: up to 5000 (0%)
    const slab1 = Math.min(remainingIncome, 5000);
    remainingIncome -= slab1;

    // Slab 2: 5000 to 20000 (26%)
    if (remainingIncome > 0) {
      const slab2 = Math.min(remainingIncome, 15000);
      annualIrpp += slab2 * 0.26;
      remainingIncome -= slab2;
    }

    // Slab 3: 20000 to 30000 (28%)
    if (remainingIncome > 0) {
      const slab3 = Math.min(remainingIncome, 10000);
      annualIrpp += slab3 * 0.28;
      remainingIncome -= slab3;
    }

    // Slab 4: 30000 to 50000 (32%)
    if (remainingIncome > 0) {
      const slab4 = Math.min(remainingIncome, 20000);
      annualIrpp += slab4 * 0.32;
      remainingIncome -= slab4;
    }

    // Slab 5: over 50000 (35%)
    if (remainingIncome > 0) {
      annualIrpp += remainingIncome * 0.35;
    }

    const irppMonthly = round3(annualIrpp / 12);
    const netSalary = round3(input.grossSalary - cnssEmployee - irppMonthly);
    const totalEmployerCost = round3(input.grossSalary + cnssEmployer + cnssAccident);

    return {
      grossSalary: input.grossSalary,
      cnssEmployee,
      cnssEmployer,
      cnssAccident,
      taxableIncomeMonthly: round3(annualNetTaxableBase / 12),
      irppMonthly,
      netSalary,
      totalEmployerCost
    };
  }
}
