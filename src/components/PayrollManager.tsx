import React, { useState, useMemo, useEffect } from 'react';
import { Employee, Payslip, BankAccount, BankTransaction, AbsenceRecord, WorkContract, AdminSettings, MissionOrder } from '../types';
import { getValidMockBase64 } from '../utils/mockDynamicGed';
import { ElyssaLogo } from './ElyssaLogo';
import { 
  Users, 
  Calculator, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit, 
  CreditCard, 
  Printer, 
  FileText, 
  Check, 
  Calendar, 
  DollarSign, 
  Info, 
  X,
  UserCheck,
  Building,
  Scale,
  Clock,
  HeartPulse,
  ShieldAlert,
  ClipboardList,
  PenTool,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Copy,
  Download,
  Upload,
  Paperclip,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PayrollManagerProps {
  bankAccounts: BankAccount[];
  onUpdateBankAccounts: (accounts: BankAccount[]) => void;
  bankTransactions: BankTransaction[];
  onUpdateBankTransactions: (txs: BankTransaction[]) => void;
  adminSettings?: AdminSettings;
  employees: Employee[];
  onUpdateEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  contracts: WorkContract[];
  onUpdateContracts: React.Dispatch<React.SetStateAction<WorkContract[]>>;
  absences: AbsenceRecord[];
  onUpdateAbsences: React.Dispatch<React.SetStateAction<AbsenceRecord[]>>;
  payslips: Payslip[];
  onUpdatePayslips: React.Dispatch<React.SetStateAction<Payslip[]>>;
  companyLocations?: any[];
  onUpdateCompanyLocations?: (locations: any[]) => void;
  missions?: MissionOrder[];
}

// Tunisian Progressive Personal Income Tax (IRPP) Calculator
// Brackets from latest LF:
// - 0 to 5,000 TND: 0%
// - 5,000.01 to 20,000 TND: 26%
// - 20,000.01 to 30,000 TND: 28%
// - 30,000.01 to 50,000 TND: 32%
// - 以上/Above 50,000 TND: 35%
export function calculateAnnualTax(annualTaxableIncome: number): number {
  let brackets = [
    { limit: 5000, rate: 0 },
    { limit: 20000, rate: 0.26 },
    { limit: 30000, rate: 0.28 },
    { limit: 50000, rate: 0.32 },
    { limit: 999999999, rate: 0.35 }
  ];
  
  const saved = localStorage.getItem('carthage_payroll_settings_irpp_brackets');
  if (saved) {
    try {
      brackets = JSON.parse(saved);
    } catch (e) {}
  }

  if (annualTaxableIncome <= brackets[0].limit) return 0;
  
  let tax = 0;
  let remaining = annualTaxableIncome;
  let prevLimit = 0;
  
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const width = b.limit - prevLimit;
    if (remaining > width) {
      tax += width * b.rate;
      remaining -= width;
      prevLimit = b.limit;
    } else {
      tax += remaining * b.rate;
      remaining = 0;
      break;
    }
  }
  return tax;
}

export function FrenchNumberToWords(amount: number): string {
  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
  
  if (amount === 0) return "zéro dinar";
  
  const integerPart = Math.floor(amount);
  const millimesPart = Math.round((amount - integerPart) * 1000);
  
  const convertUnder1000 = (num: number): string => {
    if (num === 0) return "";
    let res = "";
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    
    if (h > 0) {
      if (h === 1) res += "cent ";
      else res += units[h] + " cent " + (remainder === 0 ? "" : "");
    }
    
    if (remainder > 0) {
      if (remainder < 10) res += units[remainder];
      else if (remainder < 20) res += teens[remainder - 10];
      else {
        const t = Math.floor(remainder / 10);
        const u = remainder % 10;
        if (u === 0) {
          res += tens[t];
        } else if (u === 1 && t < 8) {
          res += tens[t] + " et un";
        } else {
          if (t === 7) res += "soixante-" + teens[u];
          else if (t === 9) res += "quatre-vingt-" + teens[u];
          else res += tens[t] + " " + units[u];
        }
      }
    }
    return res.trim() + " ";
  };
  
  const convertAll = (num: number): string => {
    if (num === 0) return "";
    let words = "";
    
    const millions = Math.floor(num / 1000000);
    const thousands = Math.floor((num % 1000000) / 1000);
    const unitsPart = num % 1000;
    
    if (millions > 0) {
      words += convertUnder1000(millions) + (millions > 1 ? "millions " : "million ");
    }
    if (thousands > 0) {
      if (thousands === 1) words += "mille ";
      else words += convertUnder1000(thousands) + "mille ";
    }
    if (unitsPart > 0) {
      words += convertUnder1000(unitsPart);
    }
    return words.trim();
  };
  
  let finalStr = "";
  if (integerPart > 0) {
    finalStr += convertAll(integerPart) + " dinar" + (integerPart > 1 ? "s" : "");
  } else {
    finalStr += "zéro dinar";
  }
  
  if (millimesPart > 0) {
    finalStr += " et " + convertAll(millimesPart) + " millime" + (millimesPart > 1 ? "s" : "");
  }
  return finalStr.trim();
}

export default function PayrollManager({
  bankAccounts,
  onUpdateBankAccounts,
  bankTransactions,
  onUpdateBankTransactions,
  adminSettings,
  employees,
  onUpdateEmployees: setEmployees,
  contracts,
  onUpdateContracts: setContracts,
  absences,
  onUpdateAbsences: setAbsences,
  payslips,
  onUpdatePayslips: setPayslips,
  companyLocations: initialCompanyLocations,
  onUpdateCompanyLocations,
  missions = []
}: PayrollManagerProps) {
  // Tabs: 'dashboard' | 'employees' | 'contracts' | 'absences' | 'payslips' | 'cnss' | 'calculator' | 'documents' | 'stc' | 'locations' | 'settings'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'employees' | 'contracts' | 'absences' | 'payslips' | 'cnss' | 'calculator' | 'documents' | 'stc' | 'locations' | 'settings'>('dashboard');
  const isDemoEmp = (emp: any) => {
    if (!emp) return false;
    return emp.id?.startsWith('demo-') || emp.is_demo === true || emp.isDemo === true || ['emp_1', 'emp_2', 'emp_3'].includes(emp.id);
  };

  const isDemoContract = (ct: any) => {
    if (!ct) return false;
    return ct.id?.startsWith('demo-') || ct.is_demo === true || ct.isDemo === true || ['ct_1', 'ct_2', 'ct_3'].includes(ct.id) || isDemoEmp({ id: ct.employeeId });
  };

  const isDemoAbsence = (ab: any) => {
    if (!ab) return false;
    return ab.id?.startsWith('demo-') || ab.is_demo === true || ab.isDemo === true || isDemoEmp({ id: ab.employeeId });
  };

  const isDemoPayslip = (ps: any) => {
    if (!ps) return false;
    return ps.id?.startsWith('demo-') || ps.is_demo === true || ps.isDemo === true || isDemoEmp({ id: ps.employeeId });
  };

  const filteredEmployees = employees;
  const filteredContracts = contracts;
  const filteredAbsences = absences;
  const filteredPayslips = payslips;

  // --- Dynamic Paie Parameters ---
  const [cnssEmployeeRate, setCnssEmployeeRate] = useState<number>(() => {
    return Number(localStorage.getItem('carthage_payroll_cnss_employee') || '9.18');
  });
  const [cnssEmployerRate, setCnssEmployerRate] = useState<number>(() => {
    return Number(localStorage.getItem('carthage_payroll_cnss_employer') || '16.57');
  });
  const [cnssAccidentRate, setCnssAccidentRate] = useState<number>(() => {
    return Number(localStorage.getItem('carthage_payroll_cnss_accident') || '0.50');
  });
  const [cssRate, setCssRate] = useState<number>(() => {
    return Number(localStorage.getItem('carthage_payroll_css_rate') || '1.0');
  });
  const [abattementChefFamille, setAbattementChefFamille] = useState<number>(() => {
    return Number(localStorage.getItem('carthage_payroll_abattement_chef') || '300');
  });
  const [abattementEnfant, setAbattementEnfant] = useState<number>(() => {
    return Number(localStorage.getItem('carthage_payroll_abattement_enfant') || '100');
  });
  const [primesList, setPrimesList] = useState<string[]>(() => {
    const saved = localStorage.getItem('carthage_payroll_primes_list');
    return saved ? JSON.parse(saved) : ["Transport", "Présence", "Panier"];
  });

  const updateCnssEmployee = (val: number) => {
    setCnssEmployeeRate(val);
    localStorage.setItem('carthage_payroll_cnss_employee', String(val));
  };
  const updateCnssEmployer = (val: number) => {
    setCnssEmployerRate(val);
    localStorage.setItem('carthage_payroll_cnss_employer', String(val));
  };
  const updateCnssAccident = (val: number) => {
    setCnssAccidentRate(val);
    localStorage.setItem('carthage_payroll_cnss_accident', String(val));
  };
  const updateCssRate = (val: number) => {
    setCssRate(val);
    localStorage.setItem('carthage_payroll_css_rate', String(val));
  };
  const updateAbattementChef = (val: number) => {
    setAbattementChefFamille(val);
    localStorage.setItem('carthage_payroll_abattement_chef', String(val));
  };
  const updateAbattementEnfant = (val: number) => {
    setAbattementEnfant(val);
    localStorage.setItem('carthage_payroll_abattement_enfant', String(val));
  };
  const updatePrimesList = (list: string[]) => {
    setPrimesList(list);
    localStorage.setItem('carthage_payroll_primes_list', JSON.stringify(list));
  };

  // Work contracts are loaded dynamically from props and synchronized to parent company

  // Contract Generation Modal states
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<WorkContract | null>(null);
  const [contractEmployeeId, setContractEmployeeId] = useState('');
  const [contractType, setContractType] = useState<'CDI' | 'CDD' | 'CIVP' | 'Karama'>('CDI');
  const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [contractEndDate, setContractEndDate] = useState('');
  const [contractTrialPeriod, setContractTrialPeriod] = useState<number>(3);
  const [contractBaseSalary, setContractBaseSalary] = useState<number>(1200);
  const [contractDuties, setContractDuties] = useState('');

  // Handle adding a contract
  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === contractEmployeeId);
    if (!emp) {
      alert("Veuillez sélectionner un collaborateur.");
      return;
    }

    if ((contractType === 'CDD' || contractType === 'CIVP') && !contractEndDate) {
      alert("La date de fin est obligatoire pour les contrats CDD et CIVP.");
      return;
    }

    const newContract: WorkContract = {
      id: `ct_${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      contractType,
      startDate: contractStartDate,
      endDate: (contractType === 'CDD' || contractType === 'CIVP') ? contractEndDate : undefined,
      trialPeriodMonths: contractTrialPeriod,
      baseSalary: contractBaseSalary,
      status: 'Draft',
      dutiesDescription: contractDuties || `Exécution rigoureuse des tâches inhérentes au poste de ${emp.jobTitle} conformément aux directives de la direction.`,
      generatedAt: new Date().toISOString().split('T')[0]
    };

    setContracts([newContract, ...contracts]);
    setIsContractModalOpen(false);
    
    // reset form
    setContractEmployeeId('');
    setContractEndDate('');
    setContractDuties('');
    setSelectedContract(newContract); // Auto display on save
  };

  const handleDeleteContract = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce contrat ? Tout historique lié sera perdu.")) {
      setContracts(contracts.filter(c => c.id !== id));
      if (selectedContract?.id === id) {
        setSelectedContract(null);
      }
    }
  };

  const handleSignContract = (id: string) => {
    setContracts(contracts.map(c => c.id === id ? { 
      ...c, 
      status: 'Signed', 
      signedAt: new Date().toISOString().split('T')[0] 
    } : c));
    
    if (selectedContract?.id === id) {
      setSelectedContract({
        ...selectedContract,
        status: 'Signed',
        signedAt: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleTerminateContract = (id: string) => {
    if (window.confirm("Voulez-vous vraiment marquer ce contrat comme résilié financièrement ou administrativement ?")) {
      setContracts(contracts.map(c => c.id === id ? { ...c, status: 'Terminated' } : c));
      if (selectedContract?.id === id) {
        setSelectedContract({
          ...selectedContract,
          status: 'Terminated'
        });
      }
    }
  };

  // Employees, payslips, and absences are loaded dynamically from props and synchronized to parent company

  // Calendar states
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // June is 5 (0-indexed)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>('2026-06-15'); // June 15, 2026 is initial paid leave

  const calendarDays = useMemo(() => {
    const firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    
    const days: Array<{
      day: number;
      month: 'prev' | 'current' | 'next';
      dateStr: string;
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevMonthNum = calendarMonth === 0 ? 11 : calendarMonth - 1;
      const prevYearNum = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
      const prevDay = daysInPrevMonth - i;
      const dateStr = `${prevYearNum}-${String(prevMonthNum + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({ day: prevDay, month: 'prev', dateStr });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, month: 'current', dateStr });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthNum = calendarMonth === 11 ? 0 : calendarMonth + 1;
      const nextYearNum = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
      const dateStr = `${nextYearNum}-${String(nextMonthNum + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, month: 'next', dateStr });
    }

    return days;
  }, [calendarYear, calendarMonth]);

  // Absence modal states
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [absEmployeeId, setAbsEmployeeId] = useState('');
  const [absType, setAbsType] = useState<'PaidLeave' | 'UnpaidAbsence' | 'SickLeave' | 'WorkAccident' | 'Maternity'>('UnpaidAbsence');
  const [absStartDate, setAbsStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [absEndDate, setAbsEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [absDeductible, setAbsDeductible] = useState(true);
  const [absDeductionAmount, setAbsDeductionAmount] = useState<number>(0);
  const [absDescription, setAbsDescription] = useState('');

  // Modals / Forms states
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Employee Form State attributes
  const [empMatricule, setEmpMatricule] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empJob, setEmpJob] = useState('');
  const [empSsn, setEmpSsn] = useState('');
  const [empCin, setEmpCin] = useState('');
  const [empRib, setEmpRib] = useState('');
  const [empBaseSalary, setEmpBaseSalary] = useState<number>(1200);
  const [empTransport, setEmpTransport] = useState<number>(100);
  const [empPresence, setEmpPresence] = useState<number>(80);
  const [empOther, setEmpOther] = useState<number>(0);
  const [empSituation, setEmpSituation] = useState<'Single' | 'Married_0' | 'Married_1' | 'Married_2' | 'Married_3' | 'Married_4_Plus'>('Single');
  const [empChef, setEmpChef] = useState(false);
  const [empStatus, setEmpStatus] = useState<'Active' | 'OnLeave' | 'Terminated'>('Active');
  const [empHiringDate, setEmpHiringDate] = useState('2026-01-01');
  const [empBranchId, setEmpBranchId] = useState('loc-maman');

  // Company Locations list & updater
  const companyLocations = initialCompanyLocations || [
    { id: 'loc-maman', name: 'Siège MAMAN (Connexion Mère)', lat: 36.8065, lng: 10.1815, radius: 150, isMaman: true },
    { id: 'loc-sfax', name: 'Succursale Sfax - Zone Industrielle Poudrière', lat: 34.7405, lng: 10.7603, radius: 150 },
    { id: 'loc-sousse', name: 'Agence Sousse - Boulevard 14 Janvier', lat: 35.8256, lng: 10.6369, radius: 150 }
  ];

  const saveLocations = (newLocs: any[]) => {
    if (onUpdateCompanyLocations) {
      onUpdateCompanyLocations(newLocs);
    } else {
      localStorage.setItem('elyssa_company_locations', JSON.stringify(newLocs));
    }
  };

  // Multi-step payslip state
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [psYear, setPsYear] = useState('2026');
  const [psMonth, setPsMonth] = useState('06');
  const [psEmployeeId, setPsEmployeeId] = useState('');
  const [psPaymentMethod, setPsPaymentMethod] = useState<'Virement' | 'Cheque' | 'Especes'>('Virement');
  const [psBankAccountId, setPsBankAccountId] = useState(bankAccounts[0]?.id || '');

  // Active Payslip to Print / View detail representation
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Interactive Simulator Calculator State attributes
  const [simBaseSalary, setSimBaseSalary] = useState<number>(1500);
  const [simTransportAllowance, setSimTransportAllowance] = useState<number>(150);
  const [simPresenceAllowance, setSimPresenceAllowance] = useState<number>(50);
  const [simOtherAllowances, setSimOtherAllowances] = useState<number>(0);
  const [simSituation, setSimSituation] = useState<'Single' | 'Married_0' | 'Married_1' | 'Married_2' | 'Married_3' | 'Married_4_Plus'>('Single');
  const [simIsChefDeFamille, setSimIsChefDeFamille] = useState(false);
  const [simIsCivpExempt, setSimIsCivpExempt] = useState(false);

  // CNSS Magnetic file / Tunisia Tele-declaration Generator States
  const [selectedCnssQuarterState, setSelectedCnssQuarterState] = useState<string | null>(null);
  const [cnssCompanyAffiliation, setCnssCompanyAffiliation] = useState('10948529-68');
  const [cnssCompanyRegroup, setCnssCompanyRegroup] = useState('000');
  const [cnssCompanyBureau, setCnssCompanyBureau] = useState('01');
  const [copiedCnssFeedback, setCopiedCnssFeedback] = useState(false);

  // HR Document Generator States
  const [docEmployeeId, setDocEmployeeId] = useState<string>('');
  const [docType, setDocType] = useState<'Work' | 'Salary' | 'Withholding'>('Work');
  const [docSalaryType, setDocSalaryType] = useState<'Net' | 'Brut'>('Net');
  const [docNote, setDocNote] = useState('Délivré à la demande de l\'intéressé pour servir et valoir ce que de droit.');
  const [docWithholdingY, setDocWithholdingY] = useState<number>(2026);
  const [copiedDocFeedback, setCopiedDocFeedback] = useState(false);

  // Solde de Tout Compte (STC) & Overtime Simulator States
  const [stcEmployeeId, setStcEmployeeId] = useState<string>('');
  const [stcPreavisDays, setStcPreavisDays] = useState<number>(30);
  const [stcCongesRestants, setStcCongesRestants] = useState<number>(5);
  const [stcReason, setStcReason] = useState<'Demission' | 'Licenciement' | 'FinContrat'>('Licenciement');
  const [stcCustomSeniority, setStcCustomSeniority] = useState<number>(24); // months of seniority
  const [overtimeBaseSalary, setOvertimeBaseSalary] = useState<number>(1200);
  const [overtimeH25, setOvertimeH25] = useState<number>(8);
  const [overtimeH50, setOvertimeH50] = useState<number>(4);
  const [overtimeH75, setOvertimeH75] = useState<number>(0);
  const [overtimeH100, setOvertimeH100] = useState<number>(2);
  const [mealTicketCount, setMealTicketCount] = useState<number>(22);
  const [mealTicketValue, setMealTicketValue] = useState<number>(6.500); // TND
  const [mealTicketEmployerShare, setMealTicketEmployerShare] = useState<number>(60); // 60%
  const [copiedStcFeedback, setCopiedStcFeedback] = useState(false);

  // GED - Archive RH integration state
  const [gedDocs, setGedDocs] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_documents');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Fast upload mini-form states inside payroll doc active tab
  const [isAddingEmpDoc, setIsAddingEmpDoc] = useState(false);
  const [empDocName, setEmpDocName] = useState('');
  const [empDocType, setEmpDocType] = useState<'Invoice' | 'Contract' | 'Report' | 'Other'>('Contract');
  const [isEmpDocForId, setIsEmpDocForId] = useState('');
  const [empDocFile, setEmpDocFile] = useState<{ name: string; size: number; type: string; base64: string } | null>(null);
  const [empDocError, setEmpDocError] = useState<string | null>(null);

  const handleEmpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1.8 * 1024 * 1024) {
        setEmpDocError("La taille de la pièce jointe dépasse 1.8 Mo.");
        return;
      }
      setEmpDocError(null);
      const r = new FileReader();
      r.onload = () => {
        setEmpDocFile({
          name: file.name,
          size: file.size,
          type: file.type,
          base64: r.result as string
        });
        if (!empDocName) {
          setEmpDocName(file.name.split('.').slice(0, -1).join('.'));
        }
      };
      r.readAsDataURL(file);
    }
  };

  const handleAddEmpDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empDocName.trim() || !isEmpDocForId) return;

    let fSize = "150 KB";
    let fBase64 = "data:text/plain;base64,VGVzdCBSSA==";
    let fType = "application/pdf";

    if (empDocFile) {
      const kb = empDocFile.size / 1024;
      fSize = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
      fBase64 = empDocFile.base64;
      fType = empDocFile.type || "application/pdf";
    }

    const linkedEmp = employees.find(emp => emp.id === isEmpDocForId);
    if (!linkedEmp) return;

    let sessionEmail = 'contact@elyssa.pro';
    try {
      const savedSession = localStorage.getItem('carthage_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.email) {
          sessionEmail = parsed.email;
        }
      }
    } catch (e) {}

    const newDoc = {
      id: `doc_${Date.now()}`,
      name: empDocName,
      type: empDocType,
      fileSize: fSize,
      fileType: fType,
      base64Data: fBase64,
      uploadDate: new Date().toISOString().split('T')[0],
      linkedToType: 'Employee',
      linkedToId: linkedEmp.id,
      linkedToName: linkedEmp.name,
      description: `Rattaché via le module RH & Paie de Elyssa S.A.`,
      version: 1,
      uploadedBy: sessionEmail
    };

    const saved = localStorage.getItem('carthage_documents');
    let current: any[] = [];
    if (saved) {
      try { current = JSON.parse(saved); } catch (err) {}
    }
    const updated = [...current, newDoc];
    setGedDocs(updated);
    localStorage.setItem('carthage_documents', JSON.stringify(updated));

    // Reset fields
    setIsAddingEmpDoc(false);
    setEmpDocName('');
    setEmpDocType('Contract');
    setIsEmpDocForId('');
    setEmpDocFile(null);
    setEmpDocError(null);
  };

  const handleDeleteEmpDoc = (id: string) => {
    if (confirm("Voulez-vous détacher et supprimer définitivement ce justificatif du dossier RH ?")) {
      const saved = localStorage.getItem('carthage_documents');
      let current: any[] = [];
      if (saved) {
        try { current = JSON.parse(saved); } catch (err) {}
      }
      const updated = current.filter((d: any) => d.id !== id);
      setGedDocs(updated);
      localStorage.setItem('carthage_documents', JSON.stringify(updated));
    }
  };

  // Auto initialize employee selection for new subtabs
  useEffect(() => {
    if (employees.length > 0) {
      if (!docEmployeeId) setDocEmployeeId(employees[0].id);
      if (!stcEmployeeId) {
        setStcEmployeeId(employees[0].id);
        setOvertimeBaseSalary(employees[0].baseSalary);
      }
    }
  }, [employees]);

  // Sync overtime base salary when STC employee ID changes
  useEffect(() => {
    if (stcEmployeeId) {
      const emp = employees.find(e => e.id === stcEmployeeId);
      if (emp) {
        setOvertimeBaseSalary(emp.baseSalary);
      }
    }
  }, [stcEmployeeId, employees]);

  // HR Document Generator: Selected target employee memo
  const currentDocEmployee = useMemo(() => {
    return employees.find(emp => emp.id === docEmployeeId) || null;
  }, [employees, docEmployeeId]);

  // Withholding tax certificate calculations (Art. 52 Tunis)
  const withholdingValues = useMemo(() => {
    // Filter actual database payslips for selected employee for that year starting with docWithholdingY
    const filteredPayslips = payslips.filter(
      p => p.employeeId === docEmployeeId && p.month.startsWith(docWithholdingY.toString())
    );

    if (filteredPayslips.length > 0) {
      const gross = filteredPayslips.reduce((sum, p) => sum + p.grossSalary, 0);
      const nonTaxable = filteredPayslips.reduce((sum, p) => sum + p.cnssEmployee, 0);
      const taxable = filteredPayslips.reduce((sum, p) => sum + p.taxableIncome, 0);
      const tax = filteredPayslips.reduce((sum, p) => sum + (p.irpp || 0) + (p.css || 0), 0);
      return {
        gross,
        nonTaxable,
        taxable,
        tax,
        count: filteredPayslips.length,
      };
    }

    // Default simulation fallback (e.g. 12 months estimate) when no payslips are generated
    if (currentDocEmployee) {
      const monthlyGross =
        (currentDocEmployee.baseSalary || 1200) +
        (currentDocEmployee.transportAllowance || 100) +
        (currentDocEmployee.presenceAllowance || 80) +
        (currentDocEmployee.otherAllowances || 0);
      const monthlyCnss = monthlyGross * 0.0918;
      
      // Estimated taxable income: Gross - CNSS - 10% standard professional deduction (capped at 2000 TND)
      const monthlyTaxable = Math.max(0, monthlyGross - monthlyCnss - Math.min(2000 / 12, monthlyGross * 0.1));
      
      // Calculate tax using progressive annual scale
      const annualTaxable = monthlyTaxable * 12;
      const annualTax = calculateAnnualTax(annualTaxable);
      const monthlyTax = annualTax / 12;
      const monthlyCss = monthlyTaxable * 0.01; // 1% CSS

      return {
        gross: monthlyGross * 12,
        nonTaxable: monthlyCnss * 12,
        taxable: monthlyTaxable * 12,
        tax: (monthlyTax + monthlyCss) * 12,
        count: 12, // 12-month simulation projection
      };
    }

    return { gross: 0, nonTaxable: 0, taxable: 0, tax: 0, count: 0 };
  }, [currentDocEmployee, docEmployeeId, docWithholdingY, payslips]);

  // STC & Overtime Simulator calculation model
  const stcCalculations = useMemo(() => {
    // 1. Paid Leave indemnity: (overtimeBaseSalary / 26) * stcCongesRestants
    const leaveCompensation = (overtimeBaseSalary / 26) * stcCongesRestants;

    // 2. Indemnity for Notice period (Préavis): (overtimeBaseSalary / 30) * stcPreavisDays
    const preavisCompensation = (overtimeBaseSalary / 30) * stcPreavisDays;

    // 3. Severance pay (Indemnité de Licenciement):
    // In Tunisia, 1 day of salary per month of seniority, capped at 3 months (90 days) of salary, 
    // applying ONLY in case of dismissal (Licenciement)
    const hasSeveranceAllowance = stcReason === 'Licenciement';
    const severanceDays = hasSeveranceAllowance ? Math.min(90, stcCustomSeniority) : 0;
    const severanceCompensation = (overtimeBaseSalary / 30) * severanceDays;

    const totalStcGross = leaveCompensation + preavisCompensation + severanceCompensation;

    // Overtime Calculations based on a standard 40H regime hour rate (173.33 hours monthly divisor)
    const hourlyRate40 = overtimeBaseSalary / 173.33;
    const h25Pay = overtimeH25 * hourlyRate40 * 1.25;
    const h50Pay = overtimeH50 * hourlyRate40 * 1.50;
    const h75Pay = overtimeH75 * hourlyRate40 * 1.75;
    const h100Pay = overtimeH100 * hourlyRate40 * 2.00;
    const totalOvertime = h25Pay + h50Pay + h75Pay + h100Pay;

    // Meal Tickets
    const valueMultiplier = mealTicketEmployerShare / 100;
    const employerTicketShare = mealTicketCount * mealTicketValue * valueMultiplier;
    const employeeTicketShare = mealTicketCount * mealTicketValue * (1 - valueMultiplier);

    return {
      leaveCompensation,
      preavisCompensation,
      severanceCompensation,
      totalStcGross,
      hourlyRate40,
      h25Pay,
      h50Pay,
      h75Pay,
      h100Pay,
      totalOvertime,
      employerTicketShare,
      employeeTicketShare,
    };
  }, [
    overtimeBaseSalary,
    stcCongesRestants,
    stcPreavisDays,
    stcReason,
    stcCustomSeniority,
    overtimeH25,
    overtimeH50,
    overtimeH75,
    overtimeH100,
    mealTicketCount,
    mealTicketValue,
    mealTicketEmployerShare,
  ]);

  // open add/edit employee modal
  const openEmployeeModal = (emp: Employee | null = null) => {
    if (emp) {
      setEditingEmployee(emp);
      setEmpMatricule(emp.matricule || '');
      setEmpName(emp.name);
      setEmpEmail(emp.email);
      setEmpJob(emp.jobTitle);
      setEmpSsn(emp.ssn);
      setEmpCin(emp.cin || '');
      setEmpRib(emp.rib || '');
      setEmpBaseSalary(emp.baseSalary);
      setEmpTransport(emp.transportAllowance);
      setEmpPresence(emp.presenceAllowance);
      setEmpOther(emp.otherAllowances);
      setEmpSituation(emp.familySituation);
      setEmpChef(emp.isChefDeFamille);
      setEmpStatus(emp.status);
      setEmpHiringDate(emp.hiringDate);
      setEmpBranchId(emp.branchId || 'loc-maman');
    } else {
      setEditingEmployee(null);
      setEmpMatricule('');
      setEmpName('');
      setEmpEmail('');
      setEmpJob('');
      setEmpSsn('');
      setEmpCin('');
      setEmpRib('');
      setEmpBaseSalary(1500);
      setEmpTransport(120);
      setEmpPresence(80);
      setEmpOther(150);
      setEmpSituation('Single');
      setEmpChef(false);
      setEmpStatus('Active');
      setEmpHiringDate(new Date().toISOString().split('T')[0]);
      setEmpBranchId('loc-maman');
    }
    setIsEmployeeModalOpen(true);
  };

  const generateAutoMatricule = (list: Employee[]) => {
    let maxNum = 0;
    list.forEach(e => {
      if (e.matricule && e.matricule.startsWith('EMP-')) {
        const numStr = e.matricule.replace('EMP-', '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    if (maxNum === 0) {
      maxNum = list.length;
    }
    return `EMP-${String(maxNum + 1).padStart(4, '0')}`;
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empSsn) {
      alert("Veuillez saisir le nom complet et le numéro CNSS de l'employé.");
      return;
    }

    if (editingEmployee) {
      setEmployees(employees.map(emp => emp.id === editingEmployee.id ? {
        ...emp,
        matricule: empMatricule.trim() || emp.matricule || generateAutoMatricule(employees),
        name: empName,
        email: empEmail,
        jobTitle: empJob,
        ssn: empSsn,
        cin: empCin,
        rib: empRib,
        baseSalary: Number(empBaseSalary),
        transportAllowance: Number(empTransport),
        presenceAllowance: Number(empPresence),
        otherAllowances: Number(empOther),
        familySituation: empSituation,
        isChefDeFamille: empChef,
        status: empStatus,
        hiringDate: empHiringDate,
        branchId: empBranchId
      } : emp));
    } else {
      const finalMatricule = empMatricule.trim() || generateAutoMatricule(employees);
      const newEmp: Employee = {
        id: `emp_${Date.now()}`,
        matricule: finalMatricule,
        name: empName,
        email: empEmail,
        jobTitle: empJob,
        ssn: empSsn,
        cin: empCin,
        rib: empRib,
        baseSalary: Number(empBaseSalary),
        transportAllowance: Number(empTransport),
        presenceAllowance: Number(empPresence),
        otherAllowances: Number(empOther),
        familySituation: empSituation,
        isChefDeFamille: empChef,
        status: empStatus,
        hiringDate: empHiringDate,
        branchId: empBranchId
      };
      setEmployees([...employees, newEmp]);
    }
    setIsEmployeeModalOpen(false);
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la fiche de ${name} ?`)) {
      setEmployees(employees.filter(e => e.id !== id));
      setPayslips(payslips.filter(p => p.employeeId !== id));

      fetch('/api/db/admin/delete-collaborator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(err => console.warn('Error deleting collaborator via API:', err));
    }
  };

  const handleDownloadCsvTemplate = () => {
    let csvContent = "\uFEFF"; // Byte Order Mark for Excel
    csvContent += "Matricule;Nom complet;Email;Poste;CNSS;CIN;RIB;Salaire de Base;Indemnite Transport;Indemnite Presence;Autres Indemnites;Situation Familiale;Chef de Famille;Date Embauche;Statut;Succursale\n";
    csvContent += "EMP-0001;Khaled Ben Amor;k.benamor@carthage.com.tn;Directeur Financier & Recouvrement;14839211-92;08912345;03001010015920038472;2600.000;180.000;80.000;300.000;Married_2;Oui;2023-01-15;Active;loc-maman\n";
    csvContent += "EMP-0002;Ines Dridi;i.dridi@carthage.com.tn;Responsable Rapprochement;20943810-18;07123456;08102030026710048259;1750.000;120.000;80.000;150.000;Single;Non;2024-03-10;Active;loc-maman\n";
    csvContent += "EMP-0003;Mohamed Ali Gharbi;m.gharbi@carthage.com.tn;Chargé Clientèle Extérieure;12554739-44;06543210;12004050037840059341;1400.000;110.000;80.000;100.000;Married_1;Oui;2025-06-18;Active;loc-maman\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modele_collaborateurs_elyssa.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        alert("Le fichier CSV semble vide ou invalide.");
        return;
      }

      const headerLine = lines[0];
      const separator = headerLine.includes(';') ? ';' : ',';
      const headers = headerLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

      const importedEmployees: Employee[] = [];
      let nextMatNum = employees.length;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
        if (cells.length < 2) continue;

        const row: any = {};
        headers.forEach((h, idx) => {
          if (idx < cells.length) {
            row[h] = cells[idx];
          }
        });

        const name = row["Nom complet"] || row["Nom"] || "";
        if (!name) continue;

        let matricule = row["Matricule"] || "";
        if (!matricule) {
          nextMatNum++;
          matricule = `EMP-${String(nextMatNum).padStart(4, '0')}`;
        }

        const email = row["Email"] || "";
        const jobTitle = row["Poste"] || row["Intitule Poste"] || "Agent";
        const ssn = row["CNSS"] || "00000000-00";
        const cin = row["CIN"] || "";
        const rib = row["RIB"] || "";
        const baseSalary = parseFloat(row["Salaire de Base"] || "1200");
        const transportAllowance = parseFloat(row["Indemnite Transport"] || "100");
        const presenceAllowance = parseFloat(row["Indemnite Presence"] || "80");
        const otherAllowances = parseFloat(row["Autres Indemnites"] || "0");

        let familySituation: Employee['familySituation'] = 'Single';
        const sitRaw = (row["Situation Familiale"] || "").toLowerCase();
        if (sitRaw.includes('single') || sitRaw.includes('célibataire') || sitRaw.includes('celibataire')) {
          familySituation = 'Single';
        } else if (sitRaw.includes('married_0') || sitRaw.includes('marié') || sitRaw.includes('marie')) {
          familySituation = 'Married_0';
        } else if (sitRaw.includes('married_1')) {
          familySituation = 'Married_1';
        } else if (sitRaw.includes('married_2')) {
          familySituation = 'Married_2';
        } else if (sitRaw.includes('married_3')) {
          familySituation = 'Married_3';
        } else if (sitRaw.includes('married_4')) {
          familySituation = 'Married_4_Plus';
        }

        const chefRaw = (row["Chef de Famille"] || "").toLowerCase();
        const isChefDeFamille = ['oui', 'yes', 'true', '1'].includes(chefRaw);

        let status: Employee['status'] = 'Active';
        const statusRaw = (row["Statut"] || "").toLowerCase();
        if (statusRaw.includes('active') || statusRaw.includes('actif')) {
          status = 'Active';
        } else if (statusRaw.includes('leave') || statusRaw.includes('congé') || statusRaw.includes('conge')) {
          status = 'OnLeave';
        } else if (statusRaw.includes('terminate') || statusRaw.includes('parti') || statusRaw.includes('licencié')) {
          status = 'Terminated';
        }

        const hiringDate = row["Date Embauche"] || row["Date d'embauche"] || new Date().toISOString().split('T')[0];
        const branchId = row["Succursale"] || "loc-maman";

        importedEmployees.push({
          id: `emp_${Date.now()}_${i}`,
          matricule,
          name,
          email,
          jobTitle,
          ssn,
          cin,
          rib,
          baseSalary: isNaN(baseSalary) ? 1200 : baseSalary,
          transportAllowance: isNaN(transportAllowance) ? 100 : transportAllowance,
          presenceAllowance: isNaN(presenceAllowance) ? 80 : presenceAllowance,
          otherAllowances: isNaN(otherAllowances) ? 0 : otherAllowances,
          familySituation,
          isChefDeFamille,
          status,
          hiringDate,
          branchId
        });
      }

      if (importedEmployees.length > 0) {
        setEmployees(prev => {
          const merged = [...prev];
          importedEmployees.forEach(imported => {
            const idx = merged.findIndex(e => e.matricule && imported.matricule && e.matricule.toLowerCase() === imported.matricule.toLowerCase());
            if (idx > -1) {
              merged[idx] = imported;
            } else {
              merged.push(imported);
            }
          });
          return merged;
        });
        alert(`${importedEmployees.length} collaborateur(s) importé(s) ou mis à jour avec succès !`);
      } else {
        alert("Aucun collaborateur valide trouvé dans le fichier.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleRestoreDemoEmployees = () => {
    const demoList: Employee[] = [
      {
        id: 'emp_1',
        matricule: 'EMP-0001',
        name: 'Khaled Ben Amor',
        email: 'k.benamor@carthage.com.tn',
        jobTitle: 'Directeur Financier & Recouvrement',
        ssn: '14839211-92',
        cin: '08912345',
        rib: '03001010015920038472',
        baseSalary: 2600.000,
        transportAllowance: 180.000,
        presenceAllowance: 80.000,
        otherAllowances: 300.000,
        familySituation: 'Married_2',
        isChefDeFamille: true,
        status: 'Active',
        hiringDate: '2023-01-15',
        branchId: 'loc-maman'
      },
      {
        id: 'emp_2',
        matricule: 'EMP-0002',
        name: 'Ines Dridi',
        email: 'i.dridi@carthage.com.tn',
        jobTitle: 'Responsable Rapprochement',
        ssn: '20943810-18',
        cin: '07123456',
        rib: '08102030026710048259',
        baseSalary: 1750.000,
        transportAllowance: 120.000,
        presenceAllowance: 80.000,
        otherAllowances: 150.000,
        familySituation: 'Single',
        isChefDeFamille: false,
        status: 'Active',
        hiringDate: '2024-03-10',
        branchId: 'loc-maman'
      },
      {
        id: 'emp_3',
        matricule: 'EMP-0003',
        name: 'Mohamed Ali Gharbi',
        email: 'm.gharbi@carthage.com.tn',
        jobTitle: 'Chargé Clientèle Extérieure',
        ssn: '12554739-44',
        cin: '06543210',
        rib: '12004050037840059341',
        baseSalary: 1400.000,
        transportAllowance: 110.000,
        presenceAllowance: 80.000,
        otherAllowances: 100.000,
        familySituation: 'Married_1',
        isChefDeFamille: true,
        status: 'Active',
        hiringDate: '2025-06-18',
        branchId: 'loc-maman'
      },
      {
        id: 'emp_drv_01',
        matricule: 'EMP-0101',
        name: 'Kamel Trad',
        email: 'k.trad@elyssa.tn',
        jobTitle: 'Chauffeur Logistique Poids Lourds',
        ssn: '15839201-12',
        cin: '05891234',
        rib: '03001010015920038101',
        baseSalary: 1650.000,
        transportAllowance: 150.000,
        presenceAllowance: 80.000,
        otherAllowances: 120.000,
        familySituation: 'Married_2',
        isChefDeFamille: true,
        status: 'Active',
        hiringDate: '2023-05-10',
        branchId: 'loc-maman'
      },
      {
        id: 'emp_drv_02',
        matricule: 'EMP-0102',
        name: 'Hamza Ben Salem',
        email: 'h.bensalem@elyssa.tn',
        jobTitle: 'Livreur / Express',
        ssn: '16928301-22',
        cin: '06812345',
        rib: '08102030026710048102',
        baseSalary: 1450.000,
        transportAllowance: 120.000,
        presenceAllowance: 80.000,
        otherAllowances: 100.000,
        familySituation: 'Single',
        isChefDeFamille: false,
        status: 'Active',
        hiringDate: '2024-02-15',
        branchId: 'loc-maman'
      },
      {
        id: 'emp_drv_03',
        matricule: 'EMP-0103',
        name: 'Youssef Chahed',
        email: 'y.chahed@elyssa.tn',
        jobTitle: 'Chauffeur Toupie & Chantier',
        ssn: '17839210-33',
        cin: '07812345',
        rib: '12004050037840059103',
        baseSalary: 1700.000,
        transportAllowance: 160.000,
        presenceAllowance: 80.000,
        otherAllowances: 140.000,
        familySituation: 'Married_1',
        isChefDeFamille: true,
        status: 'Active',
        hiringDate: '2023-09-01',
        branchId: 'loc-maman'
      },
      {
        id: 'emp_drv_04',
        matricule: 'EMP-0104',
        name: 'Nizar Trabelsi',
        email: 'n.trabelsi@elyssa.tn',
        jobTitle: 'Conducteur Utilitaire',
        ssn: '18938201-44',
        cin: '08812345',
        rib: '05201040059283749104',
        baseSalary: 1500.000,
        transportAllowance: 130.000,
        presenceAllowance: 80.000,
        otherAllowances: 110.000,
        familySituation: 'Married_3',
        isChefDeFamille: true,
        status: 'Active',
        hiringDate: '2024-01-20',
        branchId: 'loc-maman'
      }
    ];
    setEmployees(demoList);

    const defaultContracts: WorkContract[] = [
      {
        id: 'ct_1',
        employeeId: 'emp_1',
        employeeName: 'Khaled Ben Amor',
        contractType: 'CDI',
        startDate: '2020-01-15',
        trialPeriodMonths: 3,
        baseSalary: 2600.000,
        status: 'Signed',
        dutiesDescription: 'Superviser l\'ensemble des processus financiers, élaboration du budget annuel, pilotage de la trésorerie et reporting réglementaire de Elyssa S.A. auprès de la Banque Centrale de Tunisie de Tunis.',
        generatedAt: '2020-01-15',
        signedAt: '2020-01-15'
      },
      {
        id: 'ct_2',
        employeeId: 'emp_2',
        employeeName: 'Ines Dridi',
        contractType: 'CDD',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        trialPeriodMonths: 2,
        baseSalary: 1550.000,
        status: 'Signed',
        dutiesDescription: 'Contrôler les opérations de rapprochement bancaire, auditer les pièces comptables de paie et s\'assurer du respect des règles fiscales de retenue à la source en Tunisie.',
        generatedAt: '2025-05-28',
        signedAt: '2025-05-29'
      },
      {
        id: 'ct_3',
        employeeId: 'emp_3',
        employeeName: 'Mohamed Ali Gharbi',
        contractType: 'CIVP',
        startDate: '2026-03-01',
        endDate: '2027-02-28',
        trialPeriodMonths: 1,
        baseSalary: 950.000,
        status: 'Signed',
        dutiesDescription: 'Assister les clients de Elyssa S.A., préparer la documentation de prospection commerciale et de service extérieur pour la zone industrielle de Charguia et Ben Arous.',
        generatedAt: '2026-02-25',
        signedAt: '2026-02-26'
      }
    ];
    setContracts(defaultContracts);

    const defaultAbsences: AbsenceRecord[] = [
      {
        id: 'abs_1',
        employeeId: 'emp_2',
        employeeName: 'Ines Dridi',
        type: 'SickLeave',
        startDate: '2026-06-02',
        endDate: '2026-06-05',
        daysCount: 4,
        isDeductibleFromSalary: true,
        deductionAmount: 240.000,
        status: 'Approved',
        description: 'Grippe saisonnière sévère - Certificat médical transmis'
      },
      {
        id: 'abs_2',
        employeeId: 'emp_3',
        employeeName: 'Mohamed Ali Gharbi',
        type: 'WorkAccident',
        startDate: '2026-06-10',
        endDate: '2026-06-12',
        daysCount: 3,
        isDeductibleFromSalary: false,
        deductionAmount: 0.000,
        status: 'Approved',
        description: "Accident de trajet (visite clientèle) - Notification d'arrêt délivrée par la CNAM"
      },
      {
        id: 'abs_3',
        employeeId: 'emp_1',
        employeeName: 'Khaled Ben Amor',
        type: 'PaidLeave',
        startDate: '2026-06-15',
        endDate: '2026-06-19',
        daysCount: 5,
        isDeductibleFromSalary: false,
        deductionAmount: 0,
        status: 'Approved',
        description: "Congés d'été annuels validés par la Direction"
      }
    ];
    setAbsences(defaultAbsences);
    setPayslips([]);
    alert("Données de démonstration de Elyssa S.A. restaurées avec succès ! (3 collaborateurs, 3 contrats, 3 absences actives)");
  };

  const handleAddAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === absEmployeeId);
    if (!emp) {
      alert("Veuillez sélectionner un collaborateur.");
      return;
    }

    const start = new Date(absStartDate);
    const end = new Date(absEndDate);
    if (end < start) {
      alert("La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newAbsence: AbsenceRecord = {
      id: `abs_${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      type: absType,
      startDate: absStartDate,
      endDate: absEndDate,
      daysCount,
      isDeductibleFromSalary: absDeductible,
      deductionAmount: absDeductible ? Number(absDeductionAmount) : 0,
      status: 'Approved',
      description: absDescription || "Rapport médical ou motif d'absence enregistré"
    };

    setAbsences([newAbsence, ...absences]);
    setIsAbsenceModalOpen(false);
    
    // reset fields
    setAbsEmployeeId('');
    setAbsDescription('');
    setAbsDeductionAmount(0);
  };

  const handleDeleteAbsence = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet enregistrement d'absence ?")) {
      setAbsences(absences.filter(abs => abs.id !== id));
    }
  };

  const handleToggleAbsenceStatus = (id: string, status: 'Approved' | 'Requested' | 'Rejected') => {
    setAbsences(absences.map(abs => abs.id === id ? { ...abs, status } : abs));
  };

  // Detailed breakdown calculator for display and calculation purposes
  const getPayrollCalculations = (emp: Employee, targetMonth?: string) => {
    const base = emp.baseSalary;
    const transport = emp.transportAllowance;
    const presence = emp.presenceAllowance;
    const other = emp.otherAllowances;

    let absencesDeduction = 0;
    let absenceDaysTracked = 0;
    
    if (targetMonth) {
      const targetMonthAbsences = absences.filter(abs => 
        abs.employeeId === emp.id && 
        abs.status === 'Approved' && 
        (abs.startDate.substring(0, 7) === targetMonth || abs.endDate.substring(0, 7) === targetMonth)
      );
      targetMonthAbsences.forEach(abs => {
        if (abs.isDeductibleFromSalary) {
          absencesDeduction += abs.deductionAmount;
        }
        if (abs.type !== 'PaidLeave') {
          absenceDaysTracked += abs.daysCount;
        }
      });
    }

    const gross = Math.max(0, (base + transport + presence + other) - absencesDeduction);
    
    // CNSS Employee Contribution
    const cnssEmployee = gross * (cnssEmployeeRate / 100);

    // CNSS Employer Contribution (ordinary + accident du travail)
    const cnssEmployer = gross * ((cnssEmployerRate + cnssAccidentRate) / 100);

    const netTaxableGross = gross - cnssEmployee;

    // Professional Deductions: 10% of taxable gross, capped at 2000 TND per year (166.667 TND/month)
    const professionalExpensesAnnualLimit = 2000;
    const monthlyProfCeiling = professionalExpensesAnnualLimit / 12; // 166.667
    const professionalExpenses = Math.min(netTaxableGross * 0.10, monthlyProfCeiling);

    // Family Tax Deductions (Deductions IRPP Tunis):
    // Chef de famille and Children charge
    let annualFamilyDeduction = 0;
    if (emp.isChefDeFamille) annualFamilyDeduction += abattementChefFamille;
    
    if (emp.familySituation === 'Married_1') annualFamilyDeduction += abattementEnfant;
    else if (emp.familySituation === 'Married_2') annualFamilyDeduction += (abattementEnfant * 2);
    else if (emp.familySituation === 'Married_3') annualFamilyDeduction += (abattementEnfant * 3);
    else if (emp.familySituation === 'Married_4_Plus') annualFamilyDeduction += (abattementEnfant * 4);

    const monthlyFamilyDeduction = annualFamilyDeduction / 12;

    // Net taxable basis monthly (recalibrated to annual basis to compute tax and dividing by 12)
    const monthlyNetAssiette = netTaxableGross - professionalExpenses - monthlyFamilyDeduction;
    const estimatedAnnualTaxableBasis = Math.max(0, monthlyNetAssiette * 12);

    const annualIRPP = calculateAnnualTax(estimatedAnnualTaxableBasis);
    const irpp = annualIRPP / 12;

    // Social Solidarity tax (Contribution Sociale Solidaire - CSS)
    const css = Math.max(0, monthlyNetAssiette * (cssRate / 100));

    // Calculate non-taxable mission expense reimbursements from Fleet & Missions
    let missionReimbursements = 0;
    const missionDetails: { id: string; destination: string; amount: number }[] = [];

    if (targetMonth && missions && missions.length > 0) {
      const empMissions = missions.filter(m => 
        m.employeeId === emp.id && 
        (m.status === 'Approved' || m.status === 'Completed' || m.status === 'CLOTURE_PAYE') &&
        (m.departureDateTime?.substring(0, 7) === targetMonth || m.returnDateTime?.substring(0, 7) === targetMonth)
      );

      empMissions.forEach(m => {
        const jTotal = (m.expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
        const aAdvance = Number(m.allowancesGranted) || 0;
        const netR = jTotal - aAdvance;

        if (netR !== 0) {
          missionReimbursements += netR;
          missionDetails.push({
            id: m.id,
            destination: m.destination,
            amount: netR
          });
        } else if (jTotal > 0 || aAdvance > 0) {
          missionDetails.push({
            id: m.id,
            destination: `${m.destination} (Équilibré 0 DT)`,
            amount: 0
          });
        }
      });
    }

    const netSalary = (gross - cnssEmployee - irpp - css) + missionReimbursements;

    return {
      grossSalary: gross,
      cnssEmployee,
      cnssEmployer,
      professionalExpenses,
      familyDeduction: monthlyFamilyDeduction,
      taxableIncome: Math.max(0, monthlyNetAssiette),
      irpp,
      css,
      netSalary,
      allowancesPaid: transport + presence + other,
      absencesDeduction,
      absenceDaysTracked,
      missionReimbursements,
      missionDetails
    };
  };

  // Generate a payslip for a month
  const handleGeneratePayslip = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(emp => emp.id === psEmployeeId);
    if (!emp) {
      alert("Veuillez sélectionner un employé.");
      return;
    }

    const targetMonth = `${psYear}-${psMonth}`;

    // Prevent duplicates
    const exist = payslips.find(ps => ps.employeeId === emp.id && ps.month === targetMonth);
    if (exist) {
      alert(`Une fiche de paie existe déjà pour ${emp.name} pour le mois ${targetMonth}.`);
      return;
    }

    const calc = getPayrollCalculations(emp, targetMonth);

    const newPayslip: Payslip = {
      id: `ps_${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      month: targetMonth,
      baseSalary: emp.baseSalary,
      grossSalary: calc.grossSalary,
      cnssEmployee: calc.cnssEmployee,
      cnssEmployer: calc.cnssEmployer,
      professionalExpenses: calc.professionalExpenses,
      familyDeduction: calc.familyDeduction,
      taxableIncome: calc.taxableIncome,
      irpp: calc.irpp,
      css: calc.css,
      netSalary: calc.netSalary,
      allowancesPaid: calc.allowancesPaid,
      absencesDeduction: calc.absencesDeduction,
      absenceDaysTracked: calc.absenceDaysTracked,
      missionReimbursements: calc.missionReimbursements,
      missionDetails: calc.missionDetails,
      status: 'Draft',
      paymentMethod: psPaymentMethod,
      bankAccountId: psPaymentMethod !== 'Especes' ? psBankAccountId : undefined
    };

    setPayslips([newPayslip, ...payslips]);
    setIsPayslipModalOpen(false);
  };

  // Approving a payslip
  const handleApprovePayslip = (id: string) => {
    setPayslips(payslips.map(ps => ps.id === id ? { ...ps, status: 'Approved' } : ps));
  };

  // Paying a payslip (and automatically debiting Elyssa's selected bank account!)
  const handlePayPayslip = (id: string) => {
    const ps = payslips.find(p => p.id === id);
    if (!ps) return;

    if (ps.paymentMethod !== 'Especes' && !ps.bankAccountId) {
      alert("Veuillez configurer un compte bancaire pour cette fiche.");
      return;
    }

    let updatedAccounts = [...bankAccounts];
    let selectedAcc = null;

    if (ps.paymentMethod !== 'Especes') {
      selectedAcc = bankAccounts.find(a => a.id === ps.bankAccountId);
      if (!selectedAcc) {
        alert("Le compte bancaire de règlement n'existe plus.");
        return;
      }

      if (selectedAcc.currentBalance < ps.netSalary) {
        if (!window.confirm(`Le solde du compte ${selectedAcc.bankName} (${selectedAcc.currentBalance.toFixed(3)} TND) est inférieur au montant net à payer (${ps.netSalary.toFixed(3)} TND). Voulez-vous continuer ?`)) {
          return;
        }
      }

      // Debit account
      updatedAccounts = bankAccounts.map(acc => {
        if (acc.id === ps.bankAccountId) {
          return { ...acc, currentBalance: acc.currentBalance - ps.netSalary };
        }
        return acc;
      });
    }

    // Create Bank Transaction
    const newTx: BankTransaction = {
      id: `tx_pay_${Date.now()}`,
      accountId: ps.bankAccountId || 'cash_box',
      accountName: selectedAcc ? selectedAcc.bankName : 'Caisse Espèces de Elyssa',
      date: new Date().toISOString().split('T')[0],
      type: 'Out',
      amount: ps.netSalary,
      method: ps.paymentMethod === 'Virement' ? 'Virement' : ps.paymentMethod === 'Cheque' ? 'Cheque' : 'Especes',
      reference: `PAIE-${ps.month}-${ps.employeeName.split(' ')[0].toUpperCase()}`,
      beneficiaryOrIssuer: ps.employeeName,
      category: 'Salaire',
      description: `Règlement salaire Net de ${ps.employeeName} pour ${ps.month} (${ps.paymentMethod})`,
      status: 'Cleared'
    };

    onUpdateBankAccounts(updatedAccounts);
    onUpdateBankTransactions([newTx, ...bankTransactions]);

    setPayslips(payslips.map(p => p.id === id ? { 
      ...p, 
      status: 'Paid',
      paidDate: new Date().toISOString().split('T')[0]
    } : p));

    // Keep active selected popup updated
    if (selectedPayslip && selectedPayslip.id === id) {
      setSelectedPayslip({
        ...selectedPayslip,
        status: 'Paid',
        paidDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleDeletePayslip = (id: string, month: string, name: string) => {
    if (window.confirm(`Supprimer la fiche de paie de ${name} (${month}) ?`)) {
      setPayslips(payslips.filter(p => p.id !== id));
      if (selectedPayslip && selectedPayslip.id === id) {
        setSelectedPayslip(null);
      }
    }
  };

  // CNSS Declaration statistics calculated dynamically
  const cnssDeclarations = useMemo(() => {
    // Group payslips by Quarter (e.g., Q1-2026, Q2-2026)
    const quarterlyCNSS: { [key: string]: {
      quarter: string;
      year: number;
      label: string;
      employeesCount: number;
      totalBrut: number;
      cnssOuvriere: number;
      cnssPatronale: number;
      totalcnss: number;
      stagedPayslipIds: string[];
    }} = {};

    payslips.forEach(ps => {
      // month format: "YYYY-MM"
      const [yearStr, monthStr] = ps.month.split('-');
      const year = Number(yearStr);
      const m = Number(monthStr);
      let q = 'Q1';
      if (m >= 4 && m <= 6) q = 'Q2';
      else if (m >= 7 && m <= 9) q = 'Q3';
      else if (m >= 10 && m <= 12) q = 'Q4';

      const key = `${q}-${year}`;
      const calcEmploye = ps.grossSalary * 0.0918;
      const calcEmployer = ps.grossSalary * 0.1707;

      if (!quarterlyCNSS[key]) {
        quarterlyCNSS[key] = {
          quarter: q,
          year,
          label: `${q} ${year}`,
          employeesCount: 0,
          totalBrut: 0,
          cnssOuvriere: 0,
          cnssPatronale: 0,
          totalcnss: 0,
          stagedPayslipIds: []
        };
      }

      quarterlyCNSS[key].totalBrut += ps.grossSalary;
      quarterlyCNSS[key].cnssOuvriere += calcEmploye;
      quarterlyCNSS[key].cnssPatronale += calcEmployer;
      quarterlyCNSS[key].totalcnss += (calcEmploye + calcEmployer);
      quarterlyCNSS[key].stagedPayslipIds.push(ps.id);
    });

    // Populate employees count in each quarter
    Object.keys(quarterlyCNSS).forEach(key => {
      const pIds = quarterlyCNSS[key].stagedPayslipIds;
      const scopedEmpIds = new Set(payslips.filter(ps => pIds.includes(ps.id)).map(ps => ps.employeeId));
      quarterlyCNSS[key].employeesCount = scopedEmpIds.size;
    });

    return Object.values(quarterlyCNSS).sort((a, b) => b.year - a.year || b.quarter.localeCompare(a.quarter));
  }, [payslips]);

  const selectedQuarterDetail = useMemo(() => {
    if (!selectedCnssQuarterState) return null;
    const [quarter, yearStr] = selectedCnssQuarterState.split('-');
    const year = Number(yearStr);
    
    // Determine target months
    let months: string[] = [];
    if (quarter === 'Q1') months = ['01', '02', '03'];
    else if (quarter === 'Q2') months = ['04', '05', '06'];
    else if (quarter === 'Q3') months = ['07', '08', '09'];
    else if (quarter === 'Q4') months = ['10', '11', '12'];

    const formattedMonths = months.map(m => `${year}-${m}`);

    // Find all payslips for these months
    const quarterPayslips = payslips.filter(ps => formattedMonths.includes(ps.month));

    // Group payslips by employee
    const employeeDetails: {
      [empId: string]: {
        employeeId: string;
        employeeName: string;
        ssn: string; // CNSS N°
        monthTotals: [number, number, number]; // gross salaries for each of the 3 months
        totalBrut: number;
        cnssOuvriere: number;
        cnssPatronale: number;
        totalCnss: number;
      }
    } = {};

    quarterPayslips.forEach(ps => {
      const psMonthStr = ps.month.split('-')[2] || ps.month.split('-')[1]; // get '01', etc.
      const monthIdx = months.indexOf(psMonthStr);
      if (monthIdx === -1) return;

      if (!employeeDetails[ps.employeeId]) {
        // Find employee in listing to read their latest details or default
        const empEntity = employees.find(e => e.id === ps.employeeId);
        
        employeeDetails[ps.employeeId] = {
          employeeId: ps.employeeId,
          employeeName: ps.employeeName,
          ssn: empEntity?.ssn || 'Non renseigné',
          monthTotals: [0, 0, 0],
          totalBrut: 0,
          cnssOuvriere: 0,
          cnssPatronale: 0,
          totalCnss: 0
        };
      }

      employeeDetails[ps.employeeId].monthTotals[monthIdx] = ps.grossSalary;
      employeeDetails[ps.employeeId].totalBrut += ps.grossSalary;
      employeeDetails[ps.employeeId].cnssOuvriere += ps.grossSalary * 0.0918;
      employeeDetails[ps.employeeId].cnssPatronale += ps.grossSalary * 0.1707;
      employeeDetails[ps.employeeId].totalCnss += (ps.grossSalary * 0.0918 + ps.grossSalary * 0.1707);
    });

    const listing = Object.values(employeeDetails);
    const sumBrut = listing.reduce((sum, item) => sum + item.totalBrut, 0);
    const sumOuvriere = listing.reduce((sum, item) => sum + item.cnssOuvriere, 0);
    const sumPatronale = listing.reduce((sum, item) => sum + item.cnssPatronale, 0);
    const sumTotalCnss = listing.reduce((sum, item) => sum + item.totalCnss, 0);

    return {
      quarter,
      year,
      months,
      listing,
      totals: {
        brut: sumBrut,
        ouvriere: sumOuvriere,
        patronale: sumPatronale,
        totalCnss: sumTotalCnss,
        employeesCount: listing.length
      }
    };
  }, [selectedCnssQuarterState, payslips, employees]);

  const rawMagneticFileString = useMemo(() => {
    if (!selectedQuarterDetail) return "";
    
    // Clean affiliate num to 10 characters (digits only)
    const affiliateClean = cnssCompanyAffiliation.replace(/[^0-9]/g, '').padEnd(10, '0').substring(0, 10);
    const codeRegroupClean = cnssCompanyRegroup.padEnd(3, '0').substring(0, 3);
    const codeBureauClean = cnssCompanyBureau.padEnd(2, '0').substring(0, 2);
    const companyNameClean = "ELYSSA SA".padEnd(30, ' ').substring(0, 30);
    const yearStr = selectedQuarterDetail.year.toString();
    const qNum = selectedQuarterDetail.quarter.replace('Q', ''); // e.g. "2"

    let fileContent = "";

    // 1. ENTESTE RECORD (Type 1)
    const header = `1${affiliateClean}${codeBureauClean}${codeRegroupClean}${yearStr}${qNum}${companyNameClean}`.padEnd(100, ' ') + "\r\n";
    fileContent += header;

    // 2. DETAIL RECORDS (Type 2 - one per employee)
    selectedQuarterDetail.listing.forEach((emp: any, index: number) => {
      const ssnClean = emp.ssn.replace(/[^0-9]/g, '').padEnd(8, '0').substring(0, 8);
      const cinPseudo = (90000000 + index).toString().substring(0, 8);
      const empNameClean = emp.employeeName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().padEnd(30, ' ').substring(0, 30);
      
      const m1Val = Math.round(emp.monthTotals[0] * 1000).toString().padStart(10, '0');
      const m2Val = Math.round(emp.monthTotals[1] * 1000).toString().padStart(10, '0');
      const m3Val = Math.round(emp.monthTotals[2] * 1000).toString().padStart(10, '0');
      const totVal = Math.round(emp.totalBrut * 1000).toString().padStart(10, '0');

      const record = `2${ssnClean}${cinPseudo}${empNameClean}${m1Val}${m2Val}${m3Val}${totVal}`.padEnd(100, ' ') + "\r\n";
      fileContent += record;
    });

    // 3. TOTAL RECORD (Type 3)
    const empCountStr = selectedQuarterDetail.listing.length.toString().padStart(5, '0');
    const totSumBrutMillimes = Math.round(selectedQuarterDetail.totals.brut * 1000).toString().padStart(15, '0');
    const totContribMillimes = Math.round(selectedQuarterDetail.totals.totalCnss * 1000).toString().padStart(15, '0');

    const totalRecord = `3${empCountStr}${totSumBrutMillimes}${totContribMillimes}`.padEnd(100, ' ');
    fileContent += totalRecord;

    return fileContent;
  }, [selectedQuarterDetail, cnssCompanyAffiliation, cnssCompanyRegroup, cnssCompanyBureau]);

  const handleDownloadCnssTxt = () => {
    if (!selectedCnssQuarterState || !rawMagneticFileString) return;
    const element = document.createElement("a");
    const file = new Blob([rawMagneticFileString], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `CNSS_DEC_${selectedCnssQuarterState}_ELYSSA.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadCnssCsv = () => {
    if (!selectedQuarterDetail) return;
    let csvContent = "\uFEFF"; // Byte Order Mark for Excel
    csvContent += "Matricule CNSS;Nom et Prénom;Mois 1 Brut (TND);Mois 2 Brut (TND);Mois 3 Brut (TND);Total Brut (TND);Cotisation Ouvrière (9.18%);Cotisation Patronale (17.07%);Total Contributions (26.25%)\n";

    selectedQuarterDetail.listing.forEach((emp: any) => {
      csvContent += `"${emp.ssn}";"${emp.employeeName}";${emp.monthTotals[0].toFixed(3)};${emp.monthTotals[1].toFixed(3)};${emp.monthTotals[2].toFixed(3)};${emp.totalBrut.toFixed(3)};${emp.cnssOuvriere.toFixed(3)};${emp.cnssPatronale.toFixed(3)};${emp.totalCnss.toFixed(3)}\n`;
    });

    // Totals row
    csvContent += `;"TOTALES CONSOLIDEES";;;;${selectedQuarterDetail.totals.brut.toFixed(3)};${selectedQuarterDetail.totals.ouvriere.toFixed(3)};${selectedQuarterDetail.totals.patronale.toFixed(3)};${selectedQuarterDetail.totals.totalCnss.toFixed(3)}\n`;

    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `CNSS_RECAP_${selectedCnssQuarterState}_ELYSSA.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyCnssToClipboard = () => {
    if (!rawMagneticFileString) return;
    navigator.clipboard.writeText(rawMagneticFileString);
    setCopiedCnssFeedback(true);
    setTimeout(() => setCopiedCnssFeedback(false), 2000);
  };

  // Dashboard calculations
  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const totalMonthlyBaseSalarial = employees.reduce((sum, e) => sum + e.baseSalary, 0);
  const totalMonthlyAllowances = employees.reduce((sum, e) => sum + e.transportAllowance + e.presenceAllowance + e.otherAllowances, 0);
  const totalEmployerChargeSociale = employees.reduce((sum, e) => sum + (e.baseSalary + e.transportAllowance + e.presenceAllowance + e.otherAllowances) * 0.1707, 0);

  const payslipsCount = payslips.length;
  const pendingPaymentPayslips = payslips.filter(p => p.status !== 'Paid');
  const paidPayslipsSumCurrentQuarter = useMemo(() => {
    return payslips.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.netSalary, 0);
  }, [payslips]);

  const simCalculation = useMemo(() => {
    const gross = Math.max(0, simBaseSalary + simTransportAllowance + simPresenceAllowance + simOtherAllowances);
    
    // CNSS Employee Contribution: 9.18%
    const cnssEmployee = simIsCivpExempt ? 0 : gross * 0.0918;

    // CNSS Employer Contribution: 16.57% (ordinary) + 0.5% (accident du travail) = 17.07%
    const cnssEmployer = simIsCivpExempt ? 0 : gross * 0.1707;

    const netTaxableGross = gross - cnssEmployee;

    // Professional Deductions: 10% of taxable gross, capped at 2000 TND per year (166.667 TND/month)
    const professionalExpensesAnnualLimit = 2000;
    const monthlyProfCeiling = professionalExpensesAnnualLimit / 12; // 166.667
    const professionalExpenses = Math.min(netTaxableGross * 0.10, monthlyProfCeiling);

    // Family Tax Deductions (Deductions IRPP Tunis):
    // Chef de famille: 300 TND / year (25 TND / month)
    // Children charge: 100 TND / child / year (8.33 TND each, up to 4 children)
    let annualFamilyDeduction = 0;
    if (simIsChefDeFamille) annualFamilyDeduction += 300;
    
    if (simSituation === 'Married_1') annualFamilyDeduction += 100;
    else if (simSituation === 'Married_2') annualFamilyDeduction += 200;
    else if (simSituation === 'Married_3') annualFamilyDeduction += 300;
    else if (simSituation === 'Married_4_Plus') annualFamilyDeduction += 400;

    const monthlyFamilyDeduction = annualFamilyDeduction / 12;

    // Net taxable basis monthly (recalibrated to annual basis to compute tax and dividing by 12)
    const monthlyNetAssiette = netTaxableGross - professionalExpenses - monthlyFamilyDeduction;
    const estimatedAnnualTaxableBasis = Math.max(0, monthlyNetAssiette * 12);

    const annualIRPP = calculateAnnualTax(estimatedAnnualTaxableBasis);
    const irpp = annualIRPP / 12;

    // Social Solidarity tax (Contribution Sociale Solidaire - CSS)
    const css = Math.max(0, monthlyNetAssiette * 0.01);

    const netSalary = gross - cnssEmployee - irpp - css;

    return {
      gross,
      cnssEmployee,
      cnssEmployer,
      professionalExpenses,
      familyDeduction: monthlyFamilyDeduction,
      taxableIncome: Math.max(0, monthlyNetAssiette),
      estimatedAnnualTaxableBasis,
      annualIRPP,
      irpp,
      css,
      netSalary
    };
  }, [
    simBaseSalary,
    simTransportAllowance,
    simPresenceAllowance,
    simOtherAllowances,
    simSituation,
    simIsChefDeFamille,
    simIsCivpExempt
  ]);

  return (
    <div className="space-y-6" id="payroll-manager">
      {/* Header section */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-3xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-930 tracking-tight font-display">Gestion RH & Module de Paie</h2>
          </div>
          <p className="text-slate-500 text-xs font-medium">
            Calculateur IRPP de la loi de finances en vigueur, cotisations CNSS, indemnités de transport et fiches de paie.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              if (employees.length === 0) {
                alert("Commencez d'abord par ajouter un collaborateur.");
                return;
              }
              setPsEmployeeId(employees[0].id);
              setIsPayslipModalOpen(true);
            }}
            className="p-2.5 px-3.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-indigo-700/80 shadow-xs"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculer une Fiche</span>
          </button>
          <button
            onClick={() => openEmployeeModal()}
            className="p-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Personnel</span>
          </button>
        </div>
      </div>

      {/* Nav Sub Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'dashboard' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analyses & Dashboard RH</span>
        </button>
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'employees' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Fiches Collaborateurs ({employees.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'contracts' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Contrats de Travail ({contracts.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('absences')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'absences' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Absences & Congés ({absences.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('payslips')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'payslips' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Fiches de Paie Générées ({payslips.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('calculator')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'calculator' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Moteur de Calcul & Simulateur IRPP</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cnss')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'cnss' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Déclarations CNSS Trimestrielles</span>
        </button>
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'documents' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Documents & Attestations RH</span>
        </button>
        <button
          onClick={() => setActiveSubTab('stc')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'stc' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>STC & Heures Sup / Avantages</span>
        </button>
        <button
          onClick={() => setActiveSubTab('locations')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'locations' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building className="w-4 h-4 text-indigo-600" />
          <span>Dépôts, Succursales & Agences ({companyLocations.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-3 text-xs font-extrabold border-b-2 transition flex items-center space-x-1.5 ${
            activeSubTab === 'settings' 
              ? 'border-indigo-600 text-indigo-700' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Configuration RH</span>
        </button>
      </div>



      {/* Content View Controller */}
      <div className="min-h-[400px]">
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex flex-col justify-between shadow-3xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Effectif Actif</span>
                <span className="text-2xl font-black text-slate-900 font-display">{activeCount} salariés <span className="text-xs text-slate-400 font-normal">/ {totalEmployees} totaux</span></span>
                <span className="text-[10px] text-slate-400 font-mono mt-2.5 block">Elyssa S.A. Personnel déclaré</span>
              </div>
              <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex flex-col justify-between shadow-3xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Masse brute mensuelle récurrente</span>
                <span className="text-2xl font-black text-slate-800 font-mono">{(totalMonthlyBaseSalarial + totalMonthlyAllowances).toLocaleString('fr-TN')} <span className="text-xs">TND</span></span>
                <span className="text-[10px] text-indigo-650 bg-indigo-50/50 p-1 rounded font-bold mt-2.5 block text-center truncate">Base: {totalMonthlyBaseSalarial.toLocaleString('fr-TN')} TND | Primes: {totalMonthlyAllowances.toLocaleString('fr-TN')} TND</span>
              </div>
              <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex flex-col justify-between shadow-3xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Charges Patronales CNSS (Mensuel)</span>
                <span className="text-2xl font-black text-emerald-750 font-mono">{totalEmployerChargeSociale.toLocaleString('fr-TN', { maximumFractionDigits: 3 })} <span className="text-xs font-mono">TND</span></span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50/50 p-1 rounded font-bold mt-2.5 block text-center">Taux Standard Tunisie: 16.57% + 0.5% AT</span>
              </div>
              <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex flex-col justify-between shadow-3xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Total Net Versé (Historique)</span>
                <span className="text-2xl font-black text-indigo-850 font-mono">{paidPayslipsSumCurrentQuarter.toLocaleString('fr-TN', { maximumFractionDigits: 3 })} <span className="text-xs font-mono">TND</span></span>
                <span className="text-[10px] text-slate-400 font-mono mt-2.5 block">Basé sur {payslips.filter(p => p.status === 'Paid').length} virements dénoués</span>
              </div>
            </div>

            {/* Quick overview grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Salaires Bruts vs Nets preview list */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs lg:col-span-2 space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b pb-2.5">Distribution de la Rémunération</h3>
                <div className="space-y-3">
                  {employees.map(emp => {
                    const calc = getPayrollCalculations(emp);
                    return (
                      <div key={emp.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition flex justify-between items-center gap-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800">{emp.name}</h4>
                          <span className="text-[9.5px] text-slate-400 font-medium">{emp.jobTitle}</span>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-bold">BRUT</span>
                            <span className="text-xs text-slate-705 font-mono">{calc.grossSalary.toLocaleString('fr-TN')} TND</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-bold">COTISATIONS</span>
                            <span className="text-xs text-rose-500 font-mono">{(calc.cnssEmployee + calc.irpp).toLocaleString('fr-TN', { maximumFractionDigits: 3 })} TND</span>
                          </div>
                          <div className="text-right bg-indigo-50/50 border border-indigo-100 p-1.5 px-3 rounded-lg">
                            <span className="text-[9px] text-indigo-400 block font-bold">NET À PAYER</span>
                            <span className="text-xs font-extrabold text-indigo-800 font-mono">{calc.netSalary.toLocaleString('fr-TN', { maximumFractionDigits: 3 })} TND</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payroll Information Alert panel */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <Building className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider">Elyssa Spécificités CNSS & IRPP</h3>
                  </div>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed font-medium">
                    Ce module calcule automatiquement les fiches de paie selon le code du travail et la loi de Finances de l'État Tunisien :
                  </p>
                  <ul className="space-y-2 text-[10.5px] text-slate-400 font-semibold pl-1.5">
                    <li className="flex items-start gap-1">
                      <span className="text-indigo-400 mr-1">•</span>
                      <span>CNSS Ouvrière à charge du salarié à hauteur de <strong>9,18%</strong> déductible du brut.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-indigo-400 mr-1">•</span>
                      <span>CNSS Patronale payée par Elyssa à hauteur de <strong>16,57% + 0,5%</strong> d'accidents du travail.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-indigo-400 mr-1">•</span>
                      <span>L'assiette imposable est calculée après déduction de la CNSS, des frais professionnels (10% plafonnés à 2000 TND/an) et abattements de charges de famille.</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-indigo-400 mr-1">•</span>
                      <span>Le barème d'IRPP comporte 5 tranches d'impositions progressives de 0% à 35%.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/50 p-3 rounded-xl space-y-1 mt-4">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Échéancier fiscal</span>
                  <p className="text-[10px] text-slate-300">La déclaration trimestrielle CNSS est due avant le 15 du mois suivant chaque trimestre (Avril, Juillet, Octobre, Janvier).</p>
                </div>
              </div>
            </div>

            {/* Visual RH Summary Section: Presence, Work Accidents & Paid Leaves Calendar */}
            <div className="p-5.5 bg-slate-50/65 border border-slate-150 rounded-2xl space-y-5.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-full text-[9.5px] font-black uppercase tracking-wider text-indigo-700 font-mono">
                      Visualisation RH & Santé
                    </span>
                    <h3 className="text-sm font-black text-slate-900">Tableau de Surveillance des Présences & Congés</h3>
                  </div>
                  <p className="text-[11px] text-slate-400">Suivi en temps réel des arrêts de travail CNAM, des périodes de congé de Elyssa S.A. et de la disponibilité opérationnelle.</p>
                </div>
                
                <div className="flex items-center space-x-1.5 text-[10.5px]">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                    <span className="text-slate-500 font-bold">Congé Payé</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                    <span className="text-slate-500 font-bold">Maladie Sévère</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                    <span className="text-slate-500 font-bold">Accident Travail</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side Column: Ongoing absences & work accident stats / list */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Stat Card 1: Absences en cours */}
                    <div className="bg-white border border-slate-150 p-4.5 rounded-xl shadow-3xs flex flex-col justify-between hover:shadow-2xs transition">
                      <div className="flex justify-between items-start">
                        <span className="text-[9.5px] font-extrabold uppercase text-indigo-700 tracking-wider">Absences Aujourd&apos;hui</span>
                        <div className="p-1 bg-indigo-50 text-indigo-600 rounded">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="mt-3.5 space-y-1">
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          const ongoing = absences.filter(a => today >= a.startDate && today <= a.endDate && a.status === 'Approved');
                          return (
                            <>
                              <span className="text-2xl font-black text-slate-900 block">{ongoing.length} en cours</span>
                              <p className="text-[10px] text-slate-450 leading-normal">
                                {ongoing.length > 0 
                                  ? `${ongoing.length} collaborateur(s) en arrêt ou congé` 
                                  : "Effectif à 100% disponible"
                                }
                              </p>
                              {ongoing.length > 0 && (
                                <div className="mt-2 text-[9px] text-indigo-850 bg-indigo-50/50 p-1.5 rounded space-y-1">
                                  {ongoing.map(o => (
                                    <div key={o.id} className="truncate font-semibold">
                                      • {o.employeeName} ({o.type === 'PaidLeave' ? 'Congé' : 'Arrêt'})
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Stat Card 2: Accidents de travail */}
                    <div className="bg-rose-50/30 border border-rose-150 p-4.5 rounded-xl shadow-3xs flex flex-col justify-between hover:shadow-2xs transition">
                      <div className="flex justify-between items-start">
                        <span className="text-[9.5px] font-extrabold uppercase text-rose-700 tracking-wider">Accidents Déclarés</span>
                        <div className="p-1 bg-rose-100 text-rose-700 rounded-lg animate-pulse">
                          <HeartPulse className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="mt-3.5 space-y-1">
                        {(() => {
                          const accidents = absences.filter(a => a.type === 'WorkAccident' && a.status === 'Approved');
                          return (
                            <>
                              <span className="text-2xl font-black text-rose-800 block">{accidents.length} arrêt{accidents.length > 1 ? 's' : ''} AT</span>
                              <p className="text-[10px] text-rose-500 font-semibold leading-normal">Bénéficiant d&apos;indemnités CNAM</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Declared Work Accidents detailed log */}
                  <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-3xs">
                    <div className="p-3 bg-slate-50/80 border-b flex justify-between items-center">
                      <div className="flex items-center space-x-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Registre des Accidents de Travail</h4>
                      </div>
                      <span className="text-[8.5px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">Prise en Charge CNAM</span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[190px] overflow-y-auto">
                      {absences.filter(a => a.type === 'WorkAccident').length === 0 ? (
                        <div className="p-6 text-center text-slate-400 space-y-1">
                          <p className="text-[10px] font-bold">Aucun accident recensé pour Elyssa S.A.</p>
                          <p className="text-[9px] text-slate-400">Le rapport de sécurité est vierge !</p>
                        </div>
                      ) : (
                        absences.filter(a => a.type === 'WorkAccident').map(acc => (
                          <div key={acc.id} className="p-3 text-left space-y-1 hover:bg-slate-50/40 transition">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-xs font-black text-slate-805">{acc.employeeName}</span>
                              <span className="text-[9.5px] bg-rose-50 border border-rose-150 text-rose-700 font-bold px-1.5 py-0.5 rounded-sm">
                                Arrêt de {acc.daysCount} Jrs
                              </span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 font-medium">Période : Du {acc.startDate} au {acc.endDate}</p>
                            <div className="text-[9.5px] bg-rose-50/10 border-l border-rose-300 pl-2 text-slate-550 leading-relaxed italic">
                              &quot;{acc.description}&quot;
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[8.5px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">CNAM Réf: #AT-{acc.id}</span>
                              <span className="text-[8.5px] text-emerald-700 font-bold">✓ Formulaire F1 Envoyé</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side Column: PAID LEAVES CALENDAR */}
                <div className="lg:col-span-7 bg-white border border-slate-150 rounded-xl p-4.5 shadow-3xs space-y-4">
                  {/* Calendar controller */}
                  <div className="flex justify-between items-center border-b pb-3">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-indigo-650" />
                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Planning des Congés Payés & Arrêts</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200/60 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (calendarMonth === 0) {
                            setCalendarMonth(11);
                            setCalendarYear(y => y - 1);
                          } else {
                            setCalendarMonth(m => m - 1);
                          }
                        }}
                        className="p-1 hover:bg-white rounded transition text-slate-650 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-extrabold font-sans text-slate-800 px-2.5 min-w-[100px] text-center uppercase tracking-wider">
                        {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"][calendarMonth]} {calendarYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (calendarMonth === 11) {
                            setCalendarMonth(0);
                            setCalendarYear(y => y + 1);
                          } else {
                            setCalendarMonth(m => m + 1);
                          }
                        }}
                        className="p-1 hover:bg-white rounded transition text-slate-650 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {/* Week headers */}
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => (
                      <span key={day} className="text-[10px] font-black uppercase tracking-wider text-slate-450 py-1">
                        {day}
                      </span>
                    ))}

                    {/* Day cells map */}
                    {calendarDays.map((cell, idx) => {
                      const isCurrentMonth = cell.month === 'current';
                      const dayStr = cell.dateStr;
                      const isSelected = selectedCalendarDay === dayStr;

                      // Filter absences on this date
                      const dayPaidLeaves = absences.filter(a => a.type === 'PaidLeave' && dayStr >= a.startDate && dayStr <= a.endDate && a.status === 'Approved');
                      const daySickLeaves = absences.filter(a => a.type === 'SickLeave' && dayStr >= a.startDate && dayStr <= a.endDate && a.status === 'Approved');
                      const dayWorkAccidents = absences.filter(a => a.type === 'WorkAccident' && dayStr >= a.startDate && dayStr <= a.endDate && a.status === 'Approved');
                      const dayOtherAbs = absences.filter(a => a.type !== 'PaidLeave' && a.type !== 'SickLeave' && a.type !== 'WorkAccident' && dayStr >= a.startDate && dayStr <= a.endDate && a.status === 'Approved');

                      const hasPaidLeave = dayPaidLeaves.length > 0;
                      const hasSickLeave = daySickLeaves.length > 0;
                      const hasWorkAccident = dayWorkAccidents.length > 0;
                      const hasOtherAbs = dayOtherAbs.length > 0;

                      let cellBg = 'bg-white hover:bg-slate-50 border-slate-100';
                      let textStyle = isCurrentMonth ? 'text-slate-800' : 'text-slate-350';
                      
                      if (hasPaidLeave) {
                        cellBg = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                        textStyle = 'text-emerald-950 font-black';
                      } else if (hasSickLeave) {
                        cellBg = 'bg-rose-50 text-rose-900 border-rose-150';
                        textStyle = 'text-rose-950 font-black';
                      } else if (hasWorkAccident) {
                        cellBg = 'bg-amber-50 text-amber-900 border-amber-200';
                        textStyle = 'text-amber-950 font-black';
                      } else if (hasOtherAbs) {
                        cellBg = 'bg-slate-100 text-slate-700 border-slate-200';
                        textStyle = 'text-slate-900 font-bold';
                      }

                      if (isSelected) {
                        cellBg += ' ring-2 ring-indigo-600 ring-offset-1';
                      }

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedCalendarDay(dayStr)}
                          className={`aspect-square p-1 rounded-xl border flex flex-col justify-between items-center transition cursor-pointer relative shadow-3xs ${cellBg}`}
                        >
                          <span className={`text-[10.5px] font-sans font-semibold ml-0.5 mt-0.5 self-start ${textStyle}`}>
                            {cell.day}
                          </span>

                          {/* Quick small indicator bar or dots */}
                          <div className="flex space-x-0.5 justify-center mb-1 overflow-hidden w-full max-w-[90%]">
                            {dayPaidLeaves.map((pl, i) => (
                              <span key={i} className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                            ))}
                            {daySickLeaves.map((sl, i) => (
                              <span key={i} className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block animate-pulse" />
                            ))}
                            {dayWorkAccidents.map((wa, i) => (
                              <span key={i} className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block" />
                            ))}
                            {dayOtherAbs.map((oa, i) => (
                              <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full inline-block" />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Inspector Card Details */}
                  {selectedCalendarDay && (() => {
                    const dayStr = selectedCalendarDay;
                    const dayAllAbs = absences.filter(abs => dayStr >= abs.startDate && dayStr <= abs.endDate && abs.status === 'Approved');
                    const formatted = new Date(dayStr).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                    return (
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-left transition animate-fade-in-up">
                        <div className="flex justify-between items-center border-b pb-1.5 border-dashed">
                          <span className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider font-mono">Dossier du jour :</span>
                          <span className="text-[10px] font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">{formatted}</span>
                        </div>

                        {dayAllAbs.length === 0 ? (
                          <div className="flex items-center space-x-1.5 text-emerald-700 py-1">
                            <span className="text-xs font-black">✓ Effectif au complet</span>
                            <span className="text-[10px] text-slate-450">— Aucun collaborateur n&apos;est enregistré en congé ou arrêt ce jour.</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {dayAllAbs.map(abs => (
                              <div key={abs.id} className="p-2 bg-white border border-slate-100 rounded-lg flex justify-between items-center shadow-3xs">
                                <div>
                                  <span className="text-xs font-black text-slate-800">{abs.employeeName}</span>
                                  <span className="text-[9.5px] text-slate-400 block font-medium leading-relaxed italic">&quot;{abs.description}&quot;</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                                  abs.type === 'PaidLeave' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
                                  abs.type === 'SickLeave' ? 'bg-rose-50 text-rose-800 border-rose-150' :
                                  abs.type === 'WorkAccident' ? 'bg-amber-50 text-amber-805 border-amber-150' :
                                  'bg-slate-50 text-slate-700 border-slate-150'
                                }`}>
                                  {abs.type === 'PaidLeave' ? '🌴 Congé Payé' :
                                   abs.type === 'SickLeave' ? '🩺 Maladie' :
                                   abs.type === 'WorkAccident' ? '⚠️ Accident' :
                                   'Absence'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Impayés warning banner / state ledger */}
            {pendingPaymentPayslips.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-3">
                  <span className="p-2.5 bg-amber-100 rounded-lg text-amber-800 self-start">
                    <Info className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950">Avis d'ordonnancement de salaires en attente</h4>
                    <p className="text-[11px] text-amber-805 mt-0.5">Il y a actuellement {pendingPaymentPayslips.length} fiches de paie générées non payées. Procédez au dénouement de règlement bancaire pour inscrire automatiquement les opérations comptables de Karthage.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('payslips')}
                  className="p-2 px-3 text-[10.5px] font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                >
                  Voir les fiches de paie
                </button>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-slate-505 font-mono">Registre du Personnel de Elyssa S.A.</span>
                <p className="text-[11px] text-slate-500">Gérez vos collaborateurs, attribuez-leur des matricules ou procédez par import/export de fichiers types.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input 
                  type="file" 
                  id="csv-employee-import-input" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleImportCsv}
                />
                
                <button
                  onClick={handleDownloadCsvTemplate}
                  className="p-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-3xs cursor-pointer"
                  title="Télécharger le modèle de fichier CSV type à remplir"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Modèle CSV</span>
                </button>

                <button
                  onClick={() => document.getElementById('csv-employee-import-input')?.click()}
                  className="p-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-3xs cursor-pointer"
                  title="Importer vos collaborateurs depuis un fichier CSV"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Importer CSV</span>
                </button>

                <button
                  onClick={() => openEmployeeModal()}
                  className="p-2 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau Salarié</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-100">
                      <th className="p-4 w-24 whitespace-normal leading-tight">Matricule</th>
                      <th className="p-4 whitespace-normal leading-tight">Salarié</th>
                      <th className="p-4 whitespace-normal leading-tight">SSN CNSS</th>
                      <th className="p-4 whitespace-normal leading-tight">Poste Occupé</th>
                      <th className="p-4 whitespace-normal leading-tight">Base Salariale</th>
                      <th className="p-4 whitespace-normal leading-tight max-w-[180px]">Indemnités Fixes (Trans.+Pres.+Alt)</th>
                      <th className="p-4 whitespace-normal leading-tight">Brut Mensuel</th>
                      <th className="p-4 text-center whitespace-normal leading-tight">Situation</th>
                      <th className="p-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-slate-500 bg-slate-50/50">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Users className="w-10 h-10 text-slate-300 animate-pulse-slow" />
                            <h4 className="text-sm font-black text-slate-800">Aucun collaborateur enregistré</h4>
                            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                              Le registre des collaborateurs est actuellement vide ou aucun collaborateur ne correspond au filtre actif.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map(emp => {
                        const brut = emp.baseSalary + emp.transportAllowance + emp.presenceAllowance + emp.otherAllowances;
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-4 whitespace-nowrap">
                              <span className="p-1 px-2.5 bg-indigo-50 text-indigo-950 border border-indigo-105 rounded-md font-mono text-[10.5px] font-bold block w-fit">
                                {emp.matricule || 'EMP-XXXX'}
                              </span>
                            </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-[9px] border shadow-3xs">
                                {emp.name.split(' ').map(n=>n[0]).join('')}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <strong className="text-slate-800 font-extrabold block text-xs whitespace-nowrap">{emp.name}</strong>
                                  {isDemoEmp(emp) ? (
                                    <span className="text-[7.5px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Démo</span>
                                  ) : (
                                    <span className="text-[7.5px] bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Propre</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block font-mono whitespace-nowrap">{emp.email || "non-rensigné"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="font-mono text-slate-650 font-bold block whitespace-nowrap">{emp.ssn}</span>
                            {emp.rib ? (
                              <span 
                                className="text-[10px] font-mono block mt-0.5 p-1 px-1.5 rounded border w-fit whitespace-nowrap" 
                                style={{ 
                                  backgroundColor: '#0c192c', 
                                  color: '#38bdf8', 
                                  borderColor: '#1e3a8a' 
                                }} 
                                title="RIB Tunisien Renseigné"
                              >
                                RIB: {emp.rib}
                              </span>
                            ) : (
                              <span 
                                className="text-[10px] font-mono block mt-0.5 p-1 px-1.5 rounded border w-fit whitespace-nowrap" 
                                style={{ 
                                  backgroundColor: '#1c1310', 
                                  color: '#fb923c', 
                                  borderColor: '#7c2512' 
                                }} 
                                title="RIB non renseigné"
                              >
                                RIB non renseigné
                              </span>
                            )}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="p-1 px-2.5 bg-slate-50 text-slate-700 border rounded-full text-[10.5px] font-bold whitespace-nowrap">
                              {emp.jobTitle}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-slate-820 font-black whitespace-nowrap">{(emp.baseSalary || 1800).toFixed(3)} TND</td>
                          <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                            {((emp.transportAllowance || 0) + (emp.presenceAllowance || 0) + (emp.otherAllowances || 0)).toFixed(3)} TND
                          </td>
                          <td className="p-4 font-mono font-black text-indigo-750 whitespace-nowrap">
                            {(brut || 0).toFixed(3)} TND
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span className="p-1 px-2.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-750 font-extrabold text-[10px] whitespace-nowrap">
                              {emp.familySituation === 'Single' ? 'Célibataire' : 
                               emp.familySituation === 'Married_0' ? 'Marié(e)' : 
                               emp.familySituation === 'Married_1' ? 'Marié(e) + 1' : 
                               emp.familySituation === 'Married_2' ? 'Marié(e) + 2' :
                               emp.familySituation === 'Married_3' ? 'Marié(e) + 3' : 'Marié(e) + 4+'}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => openEmployeeModal(emp)}
                                className="p-1.5 hover:bg-slate-100 border text-slate-500 rounded-lg transition shrink-0"
                                title="Modifier la fiche"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                className="p-1.5 hover:bg-red-50 border hover:border-red-150 text-red-500 rounded-lg transition shrink-0"
                                title="Supprimer le salarié"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'contracts' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Header section with actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-black uppercase text-indigo-700 font-mono tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">Module Juridique & RH Elyssa</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Générateur & Registre des Contrats de Travail</h3>
                <p className="text-xs text-slate-500">Création, archivage et édition de contrats personnalisés CDI, CDD, CIVP et Dignité régis par le Code du Travail Tunisien.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (employees.length === 0) {
                    alert("Configurez d'abord des collaborateurs pour produire leurs contrats.");
                    return;
                  }
                  setContractEmployeeId(employees[0].id);
                  setContractType('CDI');
                  setContractStartDate(new Date().toISOString().split('T')[0]);
                  setContractEndDate('');
                  setContractTrialPeriod(3);
                  setContractBaseSalary(employees[0].baseSalary);
                  setContractDuties('');
                  setIsContractModalOpen(true);
                }}
                className="p-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Contrat</span>
              </button>
            </div>

            {/* Quick KPI stats specifically for contracts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Contrats Actifs</span>
                  <Briefcase className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-xl font-black text-slate-900 block mt-2">{contracts.filter(c => c.status === 'Signed').length} Contrats</span>
                <span className="text-[10px] text-slate-400 block mt-1">Signés & exécutoires</span>
              </div>
              <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">CDI Actifs</span>
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-xl font-black text-emerald-800 block mt-2">
                  {contracts.filter(c => c.contractType === 'CDI' && c.status === 'Signed').length} CDI
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">À durée indéterminée</span>
              </div>
              <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Filière CIVP (Ex-SIVP)</span>
                  <PenTool className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xl font-black text-amber-800 block mt-2">
                  {contracts.filter(c => c.contractType === 'CIVP').length} Stagiaires
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Soutiens ANETI actifs</span>
              </div>
              <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider">Brouillons / En Attente</span>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xl font-black text-blue-800 block mt-2">
                  {contracts.filter(c => c.status === 'Draft').length} Brouillons
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Prêts pour validation</span>
              </div>
            </div>

            {/* Main view grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Contract List Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Liste des dossiers</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Total: {filteredContracts.length}</span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {filteredContracts.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-450">Aucun contrat répertorié.</p>
                        <p className="text-[10px] text-slate-400">Cliquez sur &quot;Nouveau Contrat&quot; pour en générer un.</p>
                      </div>
                    ) : (
                      filteredContracts.map(cnt => {
                        const isSel = selectedContract?.id === cnt.id;
                        return (
                          <div 
                            key={cnt.id}
                            onClick={() => setSelectedContract(cnt)}
                            className={`p-4 transition cursor-pointer text-left ${
                              isSel ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 block text-xs">{cnt.employeeName}</span>
                                  {isDemoContract(cnt) ? (
                                    <span className="text-[7.5px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Démo</span>
                                  ) : (
                                    <span className="text-[7.5px] bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Propre</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Base: {cnt.baseSalary.toFixed(3)} DT</span>
                              </div>
                              <div className="flex flex-col items-end space-y-1.5">
                                <span className={`p-1 px-2 rounded-full font-bold text-[9px] ${
                                  cnt.contractType === 'CDI' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' :
                                  cnt.contractType === 'CDD' ? 'bg-purple-50 text-purple-800 border border-purple-150' :
                                  cnt.contractType === 'CIVP' ? 'bg-orange-50 text-orange-800 border border-orange-150' :
                                  'bg-blue-50 text-blue-800 border border-blue-150'
                                }`}>
                                  {cnt.contractType}
                                </span>
                                <span className={`text-[9px] font-bold p-0.5 px-1.5 rounded ${
                                  cnt.status === 'Signed' ? 'bg-emerald-100/70 text-emerald-800' :
                                  cnt.status === 'Terminated' ? 'bg-rose-100/70 text-rose-800' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {cnt.status === 'Signed' ? 'Actif / Signé' :
                                   cnt.status === 'Terminated' ? 'Résilié' : 'Brouillon'}
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-dashed border-slate-200">
                              <span className="text-[9.5px] font-mono text-slate-400">Embauche: {cnt.startDate}</span>
                              <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                                {cnt.status === 'Draft' && (
                                  <button
                                    onClick={() => handleSignContract(cnt.id)}
                                    className="p-1 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded text-[9.5px] font-bold transition flex items-center space-x-0.5 cursor-pointer"
                                    title="Activer et signer le contrat"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Signer</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteContract(cnt.id)}
                                  className="p-1 px-2 bg-rose-55 hover:bg-rose-100 border border-rose-200 text-rose-650 rounded transition cursor-pointer"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Legal notes widget */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-slate-650 space-y-2.5">
                  <div className="flex items-center space-x-1.5 text-slate-800">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-black uppercase">Types de Contrats en Tunisie</h5>
                  </div>
                  <ul className="text-[10.5px] space-y-1.5 leading-relaxed list-disc list-inside text-slate-500">
                    <li><strong className="text-slate-700">CDI :</strong> Forme normale de travail, aucune limite de durée, rupture soumise au conseil de discipline de la firme.</li>
                    <li><strong className="text-slate-700">CDD :</strong> Durée max de 4 ans renouvelable. Au-delà, requalifié d&apos;office en CDI (Art. 6-4 Code du Travail).</li>
                    <li><strong className="text-slate-700">CIVP :</strong> Stage de 1 an renouvelable, exonération de cotisations CNSS et de TFP pour Elyssa S.A. Indemnité de l&apos;État de 150/200DT.</li>
                    <li><strong className="text-slate-700">Karama :</strong> Pris en charge CNSS et subvention de 400DT (ANETI) sur 2 ans.</li>
                  </ul>
                </div>
              </div>

              {/* Contract Interactive Preview Column */}
              <div className="lg:col-span-7">
                {selectedContract ? (
                  <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                    {/* Tool Bar inside preview */}
                    <div className="p-3 bg-slate-50 border-b flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`p-1 px-2.5 rounded font-bold text-[10px] ${
                          selectedContract.status === 'Signed' ? 'bg-emerald-100 text-emerald-800' :
                          selectedContract.status === 'Terminated' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-150 text-slate-700 animate-pulse'
                        }`}>
                          {selectedContract.status === 'Signed' ? 'CONTRAT ACTIF — SIGNÉ' :
                           selectedContract.status === 'Terminated' ? 'CONTRAT RÉSILIÉ' : 'BROUILLON (EN ATTENTE)'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (!printWindow) {
                              alert("Veuillez autoriser les fenêtres pop-up");
                              return;
                            }
                            const tpl = document.getElementById(`contract-doc-${selectedContract.id}`);
                            if (!tpl) return;
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Contrat de Travail - ${selectedContract.employeeName}</title>
                                  <script src="https://cdn.tailwindcss.com"></script>
                                  <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
                                    
                                    body { 
                                      font-family: 'Inter', sans-serif; 
                                      background-color: white !important; 
                                      color: #0f172a !important; 
                                      -webkit-print-color-adjust: exact; 
                                      print-color-adjust: exact;
                                      margin: 0;
                                      padding: 0;
                                    }
                                    @page {
                                      size: A4 portrait;
                                      margin: 0.6cm 1cm;
                                    }
                                    .print-container {
                                      max-width: 100%;
                                      margin: 0 auto;
                                      background: white;
                                    }
                                    .print-container > div {
                                      padding: 1.25rem !important;
                                      border: none !important;
                                      box-shadow: none !important;
                                      max-width: 100% !important;
                                    }
                                    .font-sans { font-family: 'Inter', sans-serif !important; }
                                    .font-display { font-family: 'Space Grotesk', sans-serif !important; }
                                    .font-mono { font-family: 'JetBrains Mono', monospace !important; }
                                  </style>
                                </head>
                                <body class="p-0 font-sans">
                                  <div class="print-container">
                                    ${tpl.innerHTML}
                                  </div>
                                  <script>
                                    window.onload = function() {
                                      setTimeout(function() {
                                        window.print();
                                      }, 800);
                                    };
                                  </script>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }}
                          className="p-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-205 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer / PDF</span>
                        </button>
                        <button
                          onClick={() => {
                            const tpl = document.getElementById(`contract-doc-${selectedContract.id}`);
                            if (tpl) {
                              navigator.clipboard.writeText(tpl.innerText)
                                .then(() => alert("Le texte officiel du contrat a été copié dans votre presse-papiers."))
                                .catch(err => console.error("Erreur de copie", err));
                            }
                          }}
                          className="p-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-205 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Copier le texte</span>
                        </button>
                        {selectedContract.status === 'Draft' && (
                          <button
                            onClick={() => handleSignContract(selectedContract.id)}
                            className="p-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Signer</span>
                          </button>
                        )}
                        {selectedContract.status === 'Signed' && (
                          <button
                            onClick={() => handleTerminateContract(selectedContract.id)}
                            className="p-1.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Résilier</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Paper Document Container */}
                    <div className="p-4 sm:p-6 bg-slate-50 flex justify-center flex-1 max-h-[800px] overflow-y-auto">
                      <div 
                        id={`contract-doc-${selectedContract.id}`}
                        className="bg-white border border-slate-200 shadow-md max-w-[650px] w-full p-4 sm:p-5 text-slate-900 font-serif leading-tight text-left text-[9.5px] bg-no-repeat bg-center"
                        style={{
                          backgroundImage: selectedContract.status === 'Signed' ? "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='100px' width='400px'><text x='20' y='65' fill='rgba(16, 185, 129, 0.05)' font-size='38' font-family='sans-serif' font-weight='black' transform='rotate(-12, 10,65)'>APPROUVÉ & SIGNÉ</text></svg>\")" : "none"
                        }}
                      >
                        {/* Corporate Branding Header */}
                        <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-1.5 mb-2 font-sans">
                          <div className="flex items-center gap-2">
                            <ElyssaLogo className="w-9 h-9 bg-slate-900 rounded-xl p-1.5 shrink-0 border border-slate-800" />
                            <div className="space-y-0">
                              <h3 className="font-extrabold text-[9.5px] text-slate-900 tracking-wide">SOCIÉTÉ TUNISIENNE ELYSSA S.A.</h3>
                              <p className="text-[7.5px] text-slate-500 font-bold">Solutions de Gestion Intégrée ERP & FinTech</p>
                              <p className="text-[7px] text-slate-400 font-medium leading-none">Capital Social : 500 000 DT • RNE : 1832049Z • M.F. : 1548301/A/M/000</p>
                            </div>
                          </div>
                          <div className="text-right space-y-0 text-[7.5px] text-slate-500">
                            <p className="font-black tracking-wider text-slate-800">RÉPUBLIQUE TUNISIENNE</p>
                            <p className="font-bold text-indigo-700">Direction des Ressources Humaines</p>
                            <p className="font-mono text-[7px] text-slate-400 mt-0.5">Réf: {selectedContract.id} • Date: {selectedContract.generatedAt}</p>
                          </div>
                        </div>

                        {/* Document Title Act Block */}
                        <div className="text-center mb-2 py-1 bg-slate-50 rounded-lg border border-slate-200/75 space-y-0 font-sans">
                          <h4 className="text-[10px] font-black uppercase text-indigo-950 tracking-widest">
                            CONTRAT DE TRAVAIL
                          </h4>
                          <p className="text-[8.5px] font-extrabold text-indigo-700 uppercase tracking-wider font-mono">
                            Régime : {selectedContract.contractType === 'CDI' ? 'Durée Indéterminée (CDI)' :
                                      selectedContract.contractType === 'CDD' ? 'Durée Déterminée (CDD)' :
                                      selectedContract.contractType === 'CIVP' ? 'Initiation Professionnelle (CIVP)' :
                                      'Karama / Dignité'}
                          </p>
                        </div>

                        {/* Article Content */}
                        <div className="space-y-2 text-[9px] leading-relaxed text-justify">
                          <div>
                            <p className="font-black text-slate-950 uppercase text-[8px] tracking-wider border-b border-slate-200 pb-0.5 flex items-center gap-1.5 font-sans">
                              <span className="w-1 h-1 rounded-full bg-indigo-700"></span>
                              Préambule : Les Parties Contractantes
                            </p>
                            <div className="mt-0.5 text-[8.5px] p-2 bg-slate-50 border border-slate-150 rounded-md font-sans space-y-0.5 text-slate-700 leading-tight">
                              <p className="leading-tight">
                                <strong>L&apos;Employeur :</strong> <strong className="text-slate-900">{adminSettings?.companyName || "Inter-Affaires"}</strong>
                                {adminSettings?.legalForm ? ` — ${adminSettings.legalForm}` : " — SARL"} 
                                {adminSettings?.shareCapital ? ` (${adminSettings.shareCapital.toLocaleString('fr-FR')} TND)` : ""} 
                                {adminSettings?.companyAddress ? `, sise à ${adminSettings.companyAddress}` : ""}
                                {adminSettings?.rneNumber ? `, RNE ${adminSettings.rneNumber}` : ""}
                                , représentée par {adminSettings?.legalRepresentative ? `M./Mme ${adminSettings.legalRepresentative}` : "sa Direction Générale"}.
                              </p>
                              <p className="leading-tight"><strong>Le Collaborateur :</strong> Monsieur/Madame <strong className="text-slate-900">{selectedContract.employeeName}</strong>, titulaire du RIB Tunisien n° <code className="bg-white px-1 border border-slate-200 text-indigo-700 rounded text-[8px] font-mono">{employees.find(e => e.id === selectedContract.employeeId)?.rib || '———'}</code>, rattaché à l&apos;entreprise <strong className="text-slate-900">{adminSettings?.companyName || "Inter-Affaires"}</strong>.</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 mt-1.5 font-serif">
                            <div>
                              <p className="font-black text-slate-950 text-[8px] uppercase tracking-wider font-sans border-b border-slate-100 pb-0.5">Article 1 — Nature et Type du Contrat</p>
                              <p className="mt-0.5 text-slate-800 leading-relaxed">
                                Le présent contrat de type <strong className="text-indigo-950">{selectedContract.contractType === 'CDI' ? 'Durée Indéterminée (CDI)' : selectedContract.contractType === 'CDD' ? 'Durée Déterminée (CDD)' : selectedContract.contractType === 'CIVP' ? 'CIVP' : 'Karama'}</strong> est régi par le Code du Travail Tunisien.
                                {selectedContract.endDate && (
                                  <span className="ml-1 font-sans text-[8.5px] text-indigo-800 font-bold bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100">
                                    Période : du {selectedContract.startDate} au {selectedContract.endDate}.
                                  </span>
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="font-black text-slate-950 text-[8px] uppercase tracking-wider font-sans border-b border-slate-100 pb-0.5">Article 2 — Période d&apos;Essai</p>
                              <p className="mt-0.5 text-slate-800 leading-relaxed">
                                Le salarié est soumis à une période d&apos;essai de <strong>{selectedContract.trialPeriodMonths} mois</strong> débutant le {selectedContract.startDate}, résiliable librement sans indemnité.
                              </p>
                            </div>

                            <div>
                              <p className="font-black text-slate-950 text-[8px] uppercase tracking-wider font-sans border-b border-slate-100 pb-0.5">Article 3 — Fonctions & Attributions</p>
                              <p className="mt-0.5 text-slate-800 leading-relaxed">
                                Le collaborateur exercera ses fonctions en qualité d&apos;agent ou cadre au poste de : <strong className="text-slate-950">{employees.find(e => e.id === selectedContract.employeeId)?.jobTitle || 'Mandataire'}</strong>.
                              </p>
                              <p className="mt-0.5 italic font-sans text-slate-600 bg-slate-50/75 p-1 px-1.5 border-l-2 border-indigo-500 rounded text-[8px] leading-tight line-clamp-1">
                                « {selectedContract.dutiesDescription} »
                              </p>
                            </div>

                            <div>
                              <p className="font-black text-slate-950 text-[8px] uppercase tracking-wider font-sans border-b border-slate-100 pb-0.5">Article 4 — Rémunération & Taux de Paie</p>
                              <p className="mt-0.5 text-slate-800 leading-relaxed">
                                Le collaborateur percevra un salaire de base mensuel forfaitaire de <strong className="text-indigo-900 font-mono text-[9px]">{selectedContract.baseSalary.toFixed(3)} DT (Dinars Tunisiens)</strong>, auquel s&apos;ajouteront les primes et indemnités réglementaires (transport, présence). Les cotisations CNSS (9,18%), CSS (1%) et l&apos;IRPP selon le barème progressif seront prélevés à la source.
                              </p>
                            </div>

                            <div>
                              <p className="font-black text-slate-950 text-[8px] uppercase tracking-wider font-sans border-b border-slate-100 pb-0.5">Article 5 — Confidentialité & Discrétion</p>
                              <p className="mt-0.5 text-slate-800 leading-relaxed">
                                Le salarié s&apos;engage à observer la plus stricte discrétion sur l&apos;ensemble des processus techniques, informations financières et données de l&apos;employeur sous peine de poursuites.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Signatures Panel */}
                        <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex justify-between text-[8px] font-sans">
                          <div>
                            <p className="font-black text-slate-800 mb-0.5 font-sans">
                              Fait à Tunis, le {selectedContract.generatedAt}
                            </p>
                            <p className="font-bold text-slate-400 uppercase text-[6.5px] tracking-wider">L&apos;Employeur ({adminSettings?.companyName || "Inter-Affaires"})</p>
                            <div className="mt-1 h-8 flex items-center">
                              <span className="p-0.5 px-2 border border-indigo-700 bg-indigo-50/50 text-indigo-750 rounded rotate-[-2deg] text-[7px] font-black tracking-widest font-mono uppercase">
                                CACHET {(adminSettings?.companyName || "Inter-Affaires").toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-800 mb-0.5 font-sans">Visa & Signature du Collaborateur</p>
                            <p className="font-bold text-slate-400 uppercase text-[6.5px] tracking-wider">{selectedContract.employeeName}</p>
                            <div className="mt-1 h-8 flex items-center justify-end">
                              {selectedContract.status === 'Signed' ? (
                                <div className="p-0.5 px-2 border border-emerald-600 bg-emerald-50 text-emerald-800 rounded font-mono font-black text-[7.5px] rotate-[3deg] text-center leading-tight">
                                  APPROUVÉ ET SIGNÉ<br />
                                  <span className="font-normal font-sans text-[6.5px] text-slate-500">Le {selectedContract.signedAt || selectedContract.generatedAt}</span>
                                </div>
                              ) : (
                                <span className="text-[8px] text-slate-400 italic font-sans font-medium">Brouillon — En attente</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Corporate Premium Footer */}
                        <div className="border-t border-slate-200 pt-1 mt-3 flex justify-between items-center text-[7.5px] text-slate-400 font-sans tracking-wide">
                          <span>Document Contractuel Officiel • Elyssa ERP Suite</span>
                          <span className="font-medium text-slate-400">{(adminSettings?.companyName || "Inter-Affaires").toUpperCase()} — {adminSettings?.companyAddress || "Les Berges du Lac, Tunis"}</span>
                          <span className="font-mono text-[7px]">Page 1 / 1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-205 border-dashed rounded-2xl p-12 text-center flex flex-col justify-center items-center h-full min-h-[500px] space-y-4">
                    <PenTool className="w-12 h-12 text-slate-350 stroke-[1.5]" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-700">Aucun contrat sélectionné</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">Choisissez un dossier de la liste de gauche pour visualiser ses clauses juridiques, l&apos;imprimer, ou générez un nouveau contrat.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (employees.length === 0) return;
                        setContractEmployeeId(employees[0].id);
                        setContractType('CDI');
                        setContractStartDate(new Date().toISOString().split('T')[0]);
                        setContractEndDate('');
                        setContractTrialPeriod(3);
                        setContractBaseSalary(employees[0].baseSalary);
                        setContractDuties('');
                        setIsContractModalOpen(true);
                      }}
                      className="p-2 px-4 bg-white hover:bg-slate-50 border border-slate-250 text-slate-755 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Rédiger un contrat de travail</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'absences' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Header section with actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-black uppercase text-indigo-700 font-mono tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">Intégration Paie & CNSS Elyssa</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Registre des Absences, Maladies & Accidents</h3>
                <p className="text-xs text-slate-500">Maintien de salaire, déclaration d&apos;accident du travail & congés maladies régis par le Code du Travail Tunisien.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (employees.length === 0) {
                    alert("Veuillez configurer au moins un collaborateur pour attribuer des congés.");
                    return;
                  }
                  setAbsEmployeeId(employees[0].id);
                  setAbsType('UnpaidAbsence');
                  setAbsStartDate(new Date().toISOString().split('T')[0]);
                  setAbsEndDate(new Date().toISOString().split('T')[0]);
                  setAbsDeductible(true);
                  const base = employees[0].baseSalary;
                  setAbsDeductionAmount(Math.round((base / 26) * 1000) / 1000);
                  setAbsDescription('');
                  setIsAbsenceModalOpen(true);
                }}
                className="p-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer une absence</span>
              </button>
            </div>

            {/* Quick KPI stats specifically for absences */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Évènements</span>
                  <ClipboardList className="w-4 h-5 text-slate-400" />
                </div>
                <span className="text-xl font-black text-slate-900 block mt-2">{absences.length} dossiers</span>
                <span className="text-[10px] text-slate-400 block mt-1">Actifs & approuvés</span>
              </div>
              <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">Congés Annuels Payés</span>
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-xl font-black text-emerald-800 block mt-2">
                  {absences.filter(a => a.type === 'PaidLeave').reduce((sum, a) => sum + a.daysCount, 0)} Jours
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Salaire 100% maintenu</span>
              </div>
              <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Arrêts de Maladie</span>
                  <HeartPulse className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xl font-black text-amber-800 block mt-2">
                  {absences.filter(a => a.type === 'SickLeave').reduce((sum, a) => sum + a.daysCount, 0)} Jours
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Carence 3 jours, CNSS ouvrant droit
                </span>
              </div>
              <div className="bg-white border border-rose-150 p-4 rounded-xl shadow-3xs bg-rose-50/20">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wider">Accidents du Travail</span>
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-xl font-black text-rose-900 block mt-2">
                  {absences.filter(a => a.type === 'WorkAccident').reduce((sum, a) => sum + a.daysCount, 0)} Jours
                </span>
                <span className="text-[10px] text-rose-600 block mt-1">Prise en charge CNAM dès j+1</span>
              </div>
            </div>

            {/* Main grid with lists and Tunisian guidelines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Absences table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Registre des Absences Actives</h4>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Mis à jour automatiquement</span>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredAbsences.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-450">Aucun évènement enregistré au registre.</p>
                        <p className="text-[10px] text-slate-400">Cliquez sur &quot;Enregistrer une absence&quot; pour ajouter un congé ou arrêt médical.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-450 uppercase text-[9.5px] font-mono border-b">
                            <th className="p-4 font-bold">Collaborateur</th>
                            <th className="p-4 font-bold">Type</th>
                            <th className="p-4 font-bold">Dates / Jours</th>
                            <th className="p-4 font-bold">Effet Salarial</th>
                            <th className="p-4 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAbsences.map(abs => {
                            const emp = employees.find(e => e.id === abs.employeeId);
                            return (
                              <tr key={abs.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-800 block text-xs">{abs.employeeName}</span>
                                    {isDemoAbsence(abs) ? (
                                      <span className="text-[7.5px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Démo</span>
                                    ) : (
                                      <span className="text-[7.5px] bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Propre</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block">{emp ? emp.jobTitle : 'Collaborateur'}</span>
                                </td>
                                <td className="p-4">
                                  {abs.type === 'PaidLeave' && (
                                    <span className="inline-flex items-center space-x-1 p-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-full font-bold text-[10px]">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                      <span>Congé Payé</span>
                                    </span>
                                  )}
                                  {abs.type === 'UnpaidAbsence' && (
                                    <span className="inline-flex items-center space-x-1 p-1 px-2.5 bg-slate-50 text-slate-700 border border-slate-150 rounded-full font-bold text-[10px]">
                                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                      <span>Absence Non Payée</span>
                                    </span>
                                  )}
                                  {abs.type === 'SickLeave' && (
                                    <span className="inline-flex items-center space-x-1 p-1 px-2.5 bg-amber-50 text-amber-800 border border-amber-150 rounded-full font-bold text-[10px]">
                                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                      <span>Arrêt Maladie</span>
                                    </span>
                                  )}
                                  {abs.type === 'WorkAccident' && (
                                    <span className="inline-flex items-center space-x-1 p-1 px-2.5 bg-red-50 text-red-800 border border-red-150 rounded-full font-bold text-[10px]">
                                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                      <span>Accident Travail</span>
                                    </span>
                                  )}
                                  {abs.type === 'Maternity' && (
                                    <span className="inline-flex items-center space-x-1 p-1 px-2.5 bg-purple-50 text-purple-800 border border-purple-150 rounded-full font-bold text-[10px]">
                                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                      <span>Maternité</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className="font-mono text-slate-700 block text-[11px]">Du {abs.startDate} au {abs.endDate}</span>
                                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{abs.daysCount} jour{abs.daysCount > 1 ? 's' : ''} d&apos;absence</span>
                                </td>
                                <td className="p-4">
                                  {abs.isDeductibleFromSalary ? (
                                    <div className="space-y-0.5">
                                      <span className="p-1 px-2 bg-rose-50 text-rose-800 border border-rose-100 rounded text-[9px] font-bold block w-fit">Retenue Activée</span>
                                      <span className="font-mono text-xs font-black text-rose-600 block mt-0.5">-{abs.deductionAmount.toFixed(3)} TND</span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="p-1 px-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[9px] font-bold block w-fit">Maintien de Salaire</span>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">0.000 TND</span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex justify-end space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAbsence(abs.id)}
                                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 hover:border-rose-300 transition shrink-0 cursor-pointer"
                                      title="Supprimer la fiche d'absence"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* Tunisian Legal Regulations Column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center space-x-2">
                    <Info className="w-5 h-5 text-indigo-300 animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300">Réglementation Tunisienne</h4>
                  </div>
                  <h5 className="text-sm font-black">Législation & Barèmes Paie</h5>
                  
                  <div className="space-y-3.5 text-xs text-indigo-100/90 leading-relaxed font-sans">
                    <div className="border-l-2 border-indigo-400 pl-3">
                      <p className="font-bold text-white text-[11px]">Calcul de Retenue Standard</p>
                      <p className="text-[10.5px] mt-0.5">En Tunisie, la journée d&apos;absence non payée est calculée sur un taux journalier de division par <strong>26 jours ouvrables</strong> standard (Règle d&apos;équivalence de paie: <code className="bg-indigo-950 px-1 rounded text-indigo-300 font-mono text-[9px]">Salaire de Base / 26</code>).</p>
                    </div>

                    <div className="border-l-2 border-amber-400 pl-3">
                      <p className="font-bold text-white text-[11px]">Arrêt Maladie & Clic de Carence</p>
                      <p className="text-[10.5px] mt-0.5">La CNSS indemnise les arrêts maladie à partir du <strong>4ème jour</strong> (délai de carence légal de 3 jours). Les taux d&apos;indemnités journalières CNSS s&apos;élèvent à 2/3 (66.67%) du salaire de référence.</p>
                    </div>

                    <div className="border-l-2 border-rose-400 pl-3">
                      <p className="font-bold text-white text-[11px]">Accidents de Travail (Loi 94-28)</p>
                      <p className="text-[10.5px] mt-0.5">Le premier jour de l&apos;accident est <strong>intégralement dû par l&apos;employeur</strong> (Elyssa). Ensuite, la CNAM prend en charge les indemnités journalières et soins médicaux du salarié à hauteur de 2/3 du salaire.</p>
                    </div>

                    <div className="border-l-2 border-purple-400 pl-3">
                      <p className="font-bold text-white text-[11px]">Congé de Maternité</p>
                      <p className="text-[10.5px] mt-0.5">La loi accorde un congé maternité réglementé de 30 jours, extensible par certificats, payé à 66.7% par la CNSS pour les salariées du secteur privé déclaré.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'payslips' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-xs font-black uppercase text-slate-500 font-mono">Fiches de Paie & Ordonnancement</span>
              <button
                onClick={() => {
                  if (employees.length === 0) {
                    alert("Veuillez d'abord déclarer un employé.");
                    return;
                  }
                  setPsEmployeeId(employees[0].id);
                  setIsPayslipModalOpen(true);
                }}
                className="p-2 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculer Fiche</span>
              </button>
            </div>

            {filteredPayslips.length === 0 ? (
              <div className="bg-white border text-center p-12 rounded-2xl space-y-3 shadow-3xs">
                <Calculator className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-500">Aucune fiche de paie n'a encore été générée ou ne correspond au filtre actif.</p>
                <p className="text-[10px] text-slate-400">Cliquez sur "Calculer Fiche" pour commencer la simulation de salaire mensuelle d'un collaborateur.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List pane */}
                <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {filteredPayslips.map(ps => {
                    const isSel = selectedPayslip?.id === ps.id;
                    return (
                      <div
                        key={ps.id}
                        onClick={() => setSelectedPayslip(ps)}
                        className={`p-4 rounded-xl border transition cursor-pointer text-left space-y-3 relative ${
                          isSel 
                            ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' 
                            : 'border-slate-150 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block">{ps.month}</span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <strong className="text-xs text-slate-800 font-black truncate block">{ps.employeeName}</strong>
                              {isDemoPayslip(ps) ? (
                                <span className="text-[7.5px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Démo</span>
                              ) : (
                                <span className="text-[7.5px] bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-black px-1.5 py-0.2 rounded uppercase leading-none shrink-0">Propre</span>
                              )}
                            </div>
                          </div>
                          <span className={`p-1 px-2 rounded-md font-black text-[8px] tracking-wider uppercase border ${
                            ps.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                            ps.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                            'bg-slate-50 text-slate-500 border-slate-150'
                          }`}>
                            {ps.status === 'Paid' ? 'Réglé' : ps.status === 'Approved' ? 'Certifié' : 'Brouillon'}
                          </span>
                        </div>

                        <div className="flex justify-between items-end border-t border-dashed pt-2">
                          <div className="text-left">
                            <span className="text-[8px] text-slate-400 block font-bold uppercase">Net à Payer</span>
                            <span className="text-sm font-black font-mono text-slate-800">{ps.netSalary.toFixed(3)} TND</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePayslip(ps.id, ps.month, ps.employeeName);
                            }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded border transition"
                            title="Supprimer la fiche"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payslip view pane */}
                <div className="lg:col-span-2">
                  {selectedPayslip ? (
                    <div className="bg-white border rounded-2xl p-6 shadow-3xs space-y-6">
                      {/* Top Action buttons */}
                      <div className="flex justify-between items-center flex-wrap gap-2.5 bg-slate-50/50 border p-3 rounded-xl">
                        <div className="flex gap-2">
                          {selectedPayslip.status === 'Draft' && (
                            <button
                              onClick={() => handleApprovePayslip(selectedPayslip.id)}
                              className="p-2 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Valider la Fiche</span>
                            </button>
                          )}
                          {selectedPayslip.status !== 'Paid' && (
                            <button
                              onClick={() => handlePayPayslip(selectedPayslip.id)}
                              className="p-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-650 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Verser le Salaire</span>
                            </button>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              const printUrl = `${window.location.origin}${window.location.pathname}?print=true&printTarget=printable-payslip-paper&tab=finance`;
                              const printWindow = window.open(printUrl, '_blank');
                              if (printWindow) printWindow.focus();
                              else alert("Veuillez autoriser les popups pour l'impression.");
                            }}
                            className="p-2 hover:bg-slate-100 text-slate-500 border rounded-lg transition text-xs font-bold flex items-center gap-1.5"
                            title="Prêt pour impression format A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer A4</span>
                          </button>
                        </div>
                      </div>

                      {/* Printable Real Payslip visual frame */}
                      <div id="printable-payslip-paper" className="p-8 border border-slate-200 rounded-xl bg-white space-y-6 text-slate-800 font-sans print:m-0 print:border-none print:p-0">
                        {/* Company and Slip Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                          <div className="flex items-center gap-4">
                            <ElyssaLogo className="w-14 h-14 rounded-xl bg-slate-900 p-2 shrink-0 border border-slate-800" />
                            <div className="space-y-0.5">
                              <h2 className="text-sm font-black text-slate-900 tracking-wider">ELYSSA SOLUTIONS ENTREPRISES S.A.</h2>
                              <p className="text-[9.5px] text-slate-500 font-medium">9 Avenue Habib Bourguiba, Tunis 1000</p>
                              <p className="text-[9.5px] text-slate-500 font-medium leading-none">MF: 1548301/A/M/000 – RC: B1495922023</p>
                              <p className="text-[9.5px] text-indigo-700 font-bold font-mono">DÉCLARATION CNSS EMPLOYEUR : 194830-49</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="p-1 px-3 bg-slate-900 text-white text-[10px] font-black tracking-widest uppercase rounded font-sans">BULLETIN DE PAIE</span>
                            <p className="text-[11px] font-mono text-slate-805 mt-1">Période : <strong className="font-extrabold">{selectedPayslip.month}</strong></p>
                            <p className="text-[9.5px] text-slate-400 font-mono">ID de pièce: {selectedPayslip.id}</p>
                          </div>
                        </div>

                        {/* Coll details */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-[10.5px] font-medium border border-slate-150">
                          <div className="space-y-1 border-r pr-4">
                            <span className="text-[8.5px] text-slate-400 block uppercase font-bold">Salarié</span>
                            <strong className="text-xs font-black text-slate-900">{selectedPayslip.employeeName}</strong>
                            <p className="text-slate-550 mt-1">Poste : <strong className="font-semibold text-slate-850">{employees.find(e => e.id === selectedPayslip.employeeId)?.jobTitle || 'Mandataire'}</strong></p>
                            <p className="text-slate-550 font-mono">Matricule CNSS : <strong className="font-mono text-slate-800">{employees.find(e => e.id === selectedPayslip.employeeId)?.ssn || '———'}</strong></p>
                            <p className="text-slate-550 font-mono">RIB Salarié : <strong className="font-mono text-indigo-850">{employees.find(e => e.id === selectedPayslip.employeeId)?.rib || '———'}</strong></p>
                          </div>
                          <div className="space-y-1 pl-2">
                            <span className="text-[8.5px] text-slate-400 block uppercase font-bold">Conditions de règlement</span>
                            <p className="capitalize">Mode de versement: <strong className="font-bold text-slate-800">{selectedPayslip.paymentMethod === 'Cheque' ? 'Chèque Bancaire' : selectedPayslip.paymentMethod === 'Especes' ? 'Espèces' : 'Virement Bancaire'}</strong></p>
                            {selectedPayslip.bankAccountId && (
                              <p className="truncate">Débit de banque: <strong className="font-mono text-[9px] text-slate-700">{bankAccounts.find(a => a.id === selectedPayslip.bankAccountId)?.bankName || 'Bancaire'}</strong></p>
                            )}
                            <p className="mt-1 flex items-center gap-1.5">
                              Status : 
                              <span className={`p-0.5 px-1.5 rounded text-[8.5px] font-bold ${
                                selectedPayslip.status === 'Paid' ? 'bg-emerald-150 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {selectedPayslip.status === 'Paid' ? 'PAYÉ — ACCORDÉ' : 'EN ATTENTE DE TRANSFERT'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Calculations Breakdown table */}
                        <table className="w-full text-left text-[10.5px] font-medium border-collapse border-y">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 font-black uppercase text-[8.5px] border-b">
                              <th className="p-2 py-3">Rubrique de paie</th>
                              <th className="p-2 py-3 text-right">Base / Brut</th>
                              <th className="p-2 py-3 text-right">Part Salariale</th>
                              <th className="p-2 py-3 text-right">Part Patronale</th>
                              <th className="p-2 py-3 text-right">Net d'impôt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-2 font-bold text-slate-800">Salaire de Base de Karthage</td>
                              <td className="p-2 text-right font-mono">{selectedPayslip.baseSalary.toFixed(3)}</td>
                              <td className="p-2 text-right font-mono">—</td>
                              <td className="p-2 text-right font-mono">—</td>
                              <td className="p-2 text-right font-mono">—</td>
                            </tr>
                            {selectedPayslip.allowancesPaid > 0 && (
                              <tr>
                                <td className="p-2">Indemnités fixes (Transport, Présence, Primes)</td>
                                <td className="p-2 text-right font-mono">{selectedPayslip.allowancesPaid.toFixed(3)}</td>
                                <td className="p-2 text-right font-mono">—</td>
                                <td className="p-2 text-right font-mono">—</td>
                                <td className="p-2 text-right font-mono">—</td>
                              </tr>
                            )}
                            {selectedPayslip.absencesDeduction !== undefined && selectedPayslip.absencesDeduction > 0 && (
                              <tr className="bg-red-50/40 text-red-900">
                                <td className="p-2 font-medium">Déduction Absence / Maladie ({selectedPayslip.absenceDaysTracked} jrs)</td>
                                <td className="p-2 text-right font-mono text-red-600 font-bold">-{selectedPayslip.absencesDeduction.toFixed(3)}</td>
                                <td className="p-2 text-right font-mono">—</td>
                                <td className="p-2 text-right font-mono">—</td>
                                <td className="p-2 text-right font-mono">—</td>
                              </tr>
                            )}
                            <tr>
                              <td className="p-2 bg-slate-50/50">CNSS Ouvrière Tunisie (9,18%)</td>
                              <td className="p-2 text-right font-mono bg-slate-50/50">—</td>
                              <td className="p-2 text-right font-mono bg-slate-50/50 text-rose-500 font-bold">{selectedPayslip.cnssEmployee.toFixed(3)}</td>
                              <td className="p-2 text-right font-mono bg-slate-50/50">—</td>
                              <td className="p-2 text-right font-mono bg-slate-50/50">—</td>
                            </tr>
                            <tr>
                              <td className="p-2 bg-slate-50/50">CNSS Patronale Tunisie (16.57% + 0.5%)</td>
                              <td className="p-2 text-right font-mono bg-slate-50/50">—</td>
                              <td className="p-2 text-right font-mono bg-slate-50/50">—</td>
                              <td className="p-2 text-right font-mono bg-slate-50/50 text-slate-500">{selectedPayslip.cnssEmployer.toFixed(3)}</td>
                              <td className="p-2 text-right font-mono bg-slate-50/50">—</td>
                            </tr>
                            <tr>
                              <td className="p-2 text-slate-450 italic">Abattements professionnels (10% de déduction de base)</td>
                              <td className="p-2 text-right font-mono">—</td>
                              <td className="p-2 text-right font-mono text-slate-400">({selectedPayslip.professionalExpenses.toFixed(3)})</td>
                              <td className="p-2 text-right font-mono">—</td>
                              <td className="p-2 text-right font-mono">—</td>
                            </tr>
                            {selectedPayslip.familyDeduction > 0 && (
                              <tr>
                                <td className="p-2 text-slate-450 italic">Abattement de situation familiale (Chef de Famille / Enfants)</td>
                                <td className="p-2 text-right font-mono">—</td>
                                <td className="p-2 text-right font-mono text-slate-400">({selectedPayslip.familyDeduction.toFixed(3)})</td>
                                <td className="p-2 text-right font-mono">—</td>
                                <td className="p-2 text-right font-mono">—</td>
                              </tr>
                            )}
                            <tr>
                              <td className="p-2 font-bold text-slate-700">IRPP Retenu à la source (Impôt sur le Revenu)</td>
                              <td className="p-2 text-right font-mono">—</td>
                              <td className="p-2 text-right font-mono text-red-600 font-bold">{selectedPayslip.irpp.toFixed(3)}</td>
                              <td className="p-2 text-right font-mono">—</td>
                              <td className="p-2 text-right font-mono">—</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-slate-700">Contribution Sociale Solidaire Tunisie (CSS 1%)</td>
                              <td className="p-2 text-right font-mono">—</td>
                              <td className="p-2 text-right font-mono text-amber-600 font-bold">{selectedPayslip.css.toFixed(3)}</td>
                              <td className="p-2 text-right font-mono">—</td>
                              <td className="p-2 text-right font-mono">—</td>
                            </tr>
                            {selectedPayslip.missionReimbursements !== undefined && selectedPayslip.missionReimbursements > 0 && (
                              <tr className="bg-indigo-50/70 text-indigo-950 font-medium border-t border-indigo-200">
                                <td className="p-2 font-bold text-indigo-950">
                                  🚗 Remboursements & Frais Ordres de Mission (Flotte & RH)
                                  {selectedPayslip.missionDetails && selectedPayslip.missionDetails.length > 0 && (
                                    <span className="block text-[9.5px] font-normal text-indigo-800 mt-0.5">
                                      Missions : {selectedPayslip.missionDetails.map(d => `${d.destination} (${d.amount.toFixed(3)} DT)`).join(', ')}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-right font-mono text-emerald-700 font-extrabold">+{selectedPayslip.missionReimbursements.toFixed(3)}</td>
                                <td className="p-2 text-right font-mono text-slate-400">—</td>
                                <td className="p-2 text-right font-mono text-slate-400">—</td>
                                <td className="p-2 text-right font-mono text-indigo-900 font-bold">(Exonéré CNSS & IRPP)</td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* Net Salary visual box */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 pt-4 border-t-2 border-slate-900 text-slate-805">
                          <div className="text-[10px] space-y-1 max-w-sm">
                            <p className="font-bold">Déclarations administratives :</p>
                            <p className="text-slate-500 font-medium leading-relaxed">
                              Le net imposable de la période s'élève à <strong>{selectedPayslip.taxableIncome.toFixed(3)} TND</strong>. Ce bulletin tient lieu de certificat de travail et reçu pour solde de tout compte pour la durée spécifiée.
                            </p>
                          </div>
                          
                          <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col justify-between text-right shrink-0 min-w-[200px] border border-slate-950">
                            <span className="text-[8.5px] font-black tracking-widest text-indigo-300 uppercase block mb-1">NET À TRANFERER</span>
                            <span className="text-xl font-black font-mono text-emerald-400 block leading-none">
                              {selectedPayslip.netSalary.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                            </span>
                            <span className="text-[8.5px] text-slate-450 block font-bold font-mono mt-2">DEVISE : DINAR TUNISIEN (TND)</span>
                          </div>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-4 pt-12 text-[10.5px]">
                          <div className="text-left space-y-12">
                            <span className="font-bold underline block">Signature du Collaborateur</span>
                            <p className="text-slate-400 italic text-[9.5px]">"Mention manuscrite Bon pour accord"</p>
                          </div>
                          <div className="text-right space-y-12">
                            <span className="font-bold underline block">Pour {adminSettings?.companyName || "Inter-Affaires"}</span>
                            <div className="flex justify-end">
                              <span className="p-2 px-3 border border-indigo-200 border-dashed text-[8px] font-black tracking-widest text-indigo-700 bg-indigo-50/50 uppercase rounded">
                                CACHET DE L'ENTREPRISE {(adminSettings?.companyName || "Inter-Affaires").toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Corporate Premium Footer */}
                        <div className="border-t border-slate-200 pt-3 mt-6 text-center text-[8.5px] text-slate-400 font-sans space-y-1 tracking-wide">
                          <p className="font-bold">Elyssa ERP Suite • Bulletin de Paie Officiel Édité Électriquement</p>
                          <p>
                            {adminSettings?.companyName || "Inter-Affaires"} 
                            {adminSettings?.legalForm ? ` (${adminSettings.legalForm})` : ""} 
                            {adminSettings?.shareCapital ? ` au capital de ${adminSettings.shareCapital.toLocaleString('fr-FR')} TND` : ""} 
                            {adminSettings?.rneNumber ? ` - RNE ${adminSettings.rneNumber}` : ""} 
                            {adminSettings?.companyMF ? ` - MF ${adminSettings.companyMF}` : ""} 
                            {adminSettings?.companyAddress ? ` - ${adminSettings.companyAddress}` : ""} 
                            {adminSettings?.cityZipCode ? ` ${adminSettings.cityZipCode}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border text-center p-20 rounded-2xl space-y-3 shadow-3xs">
                      <FileText className="w-10 h-10 text-slate-350 mx-auto" />
                      <p className="text-xs font-bold text-slate-500">Sélectionnez une fiche de paie à gauche pour charger sa récapitulation</p>
                      <p className="text-[10px] text-slate-400">Le format de bulletin généré respecte parfaitement l'ordonnancement administratif de l'administration du travail et de la CNSS en Tunisie.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'calculator' && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Header / Intro Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 space-y-2 border border-slate-950 shadow-md">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300 font-display">
                  Moteur de Calcul & Simulateur de Paie Tunisienne
                </h3>
              </div>
              <p className="text-slate-300 text-xs font-medium max-w-3xl">
                Simulateur instantané des cotisations sociales et retenues à la source (IRPP/CSS) selon la législation fiscale tunisienne et les barèmes de la <strong className="text-white">Loi de Finances</strong> en vigueur. Ajustez les curseurs ou saisissez les montants pour analyser les coûts en temps réel.
              </p>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b pb-2.5">
                    Éléments de Rémunération
                  </h4>
                  
                  {/* Base Salary Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650 flex justify-between">
                      <span>Salaire de Base</span>
                      <span className="text-indigo-600 font-mono">{simBaseSalary.toLocaleString('fr-TN')} TND</span>
                    </label>
                    <div className="relative rounded-lg shadow-3xs">
                      <input 
                        type="number" 
                        min="0"
                        step="50"
                        value={simBaseSalary}
                        onChange={e => setSimBaseSalary(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs p-2.5 pl-3 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-[10px] font-bold">DT / Mois</span>
                      </div>
                    </div>
                    {/* Range slider for rapid interactive tuning */}
                    <input 
                      type="range"
                      min="300"
                      max="10000"
                      step="50"
                      value={simBaseSalary}
                      onChange={e => setSimBaseSalary(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-1"
                    />
                  </div>

                  {/* Transport Allowance Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650 flex justify-between">
                      <span>Indemnité de Transport (Mois)</span>
                      <span className="text-slate-600 font-mono">{simTransportAllowance.toLocaleString('fr-TN')} TND</span>
                    </label>
                    <div className="relative rounded-lg shadow-3xs">
                      <input 
                        type="number" 
                        min="0"
                        step="5"
                        value={simTransportAllowance}
                        onChange={e => setSimTransportAllowance(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-[10px] font-bold">DT</span>
                      </div>
                    </div>
                  </div>

                  {/* Presence Allowance Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650 flex justify-between">
                      <span>Indemnité de Présence</span>
                      <span className="text-slate-600 font-mono">{simPresenceAllowance.toLocaleString('fr-TN')} TND</span>
                    </label>
                    <div className="relative rounded-lg shadow-3xs">
                      <input 
                        type="number" 
                        min="0"
                        step="5"
                        value={simPresenceAllowance}
                        onChange={e => setSimPresenceAllowance(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-[10px] font-bold">DT</span>
                      </div>
                    </div>
                  </div>

                  {/* Other Allowances Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650 flex justify-between">
                      <span>Autres Primes & Avantages Imposables</span>
                      <span className="text-slate-600 font-mono">{simOtherAllowances.toLocaleString('fr-TN')} TND</span>
                    </label>
                    <div className="relative rounded-lg shadow-3xs">
                      <input 
                        type="number" 
                        min="0"
                        step="10"
                        value={simOtherAllowances}
                        onChange={e => setSimOtherAllowances(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-[10px] font-bold">DT</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Situation Familiale Controls */}
                <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b pb-2.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Situation Familiale & Déductions</span>
                  </h4>

                  {/* Chef de famille check */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl">
                    <div className="space-y-0.5 pr-2 text-left">
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <span>Chef de Famille</span>
                        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">+300 DT / an</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-normal">Bénéficier de l'abattement fiscal forfaitaire de 300 DT par an.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={simIsChefDeFamille}
                        onChange={e => setSimIsChefDeFamille(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Situation Select */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-extrabold text-slate-655 mb-1">Situation & Enfants à charge</label>
                    <select
                      value={simSituation}
                      onChange={e => setSimSituation(e.target.value as any)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white font-bold text-slate-800"
                    >
                      <option value="Single">Célibataire / Pas d'enfant à charge (0 DT / an)</option>
                      <option value="Married_0">Marié(e) sans enfant (0 DT / an)</option>
                      <option value="Married_1">Marié(e) avec 1 enfant à charge (100 DT / an)</option>
                      <option value="Married_2">Marié(e) avec 2 enfants à charge (200 DT / an)</option>
                      <option value="Married_3">Marié(e) avec 3 enfants à charge (300 DT / an)</option>
                      <option value="Married_4_Plus">Marié(e) avec 4 enfants & plus (400 DT / an)</option>
                    </select>
                  </div>

                  {/* Exclusivité / Dispositif Spécial (CIVP) */}
                  <div className="flex items-center justify-between p-2.5 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                    <div className="space-y-0.5 pr-2 text-left">
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <span>Exonération CNSS (CIVP / Karama)</span>
                        <span className="text-[9px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded-full">Exonéré 100%</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Contrats d'insertion exonérés des charges CNSS Salariales et Patronales.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={simIsCivpExempt}
                        onChange={e => setSimIsCivpExempt(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Calculations & Payslip Simulator Output */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Result Block Card */}
                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs text-left">
                  <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-left">
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-bold uppercase text-indigo-400 tracking-wider font-mono">
                        Bulletin de paie simulé actif (Mensuel)
                      </span>
                      <h4 className="text-xs font-extrabold font-display">Calcul de la Rémunération Nette</h4>
                    </div>
                    <span className="bg-indigo-900 border border-indigo-800 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      {simIsCivpExempt ? "Contrat CIVP Exonéré" : "Régime CNSS Standard"}
                    </span>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* The main Net Result Display */}
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left shadow-3xs">
                      <div className="text-left">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                          Salaire Net À Payer
                        </span>
                        <span className="text-2xl font-black text-indigo-950 font-mono tracking-tight block mt-1">
                          {simCalculation.netSalary.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} <span className="text-base font-bold font-sans">TND</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold italic block mt-0.5">
                          Prélèvements à la source déduits de { (simCalculation.cnssEmployee + simCalculation.irpp + simCalculation.css).toLocaleString('fr-TN', { minimumFractionDigits: 3 }) } DT ({( ((simCalculation.cnssEmployee + simCalculation.irpp + simCalculation.css) / simCalculation.gross) * 100 || 0 ).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-5 flex flex-col justify-center min-w-[120px] text-center">
                        <span className="text-[9px] font-extrabold text-slate-450 uppercase">Salaire Brut</span>
                        <span className="text-lg font-black text-slate-800 font-mono mt-1">
                          {simCalculation.gross.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} <span className="text-xs font-semibold font-sans">DT</span>
                        </span>
                        <span className="text-[9.5px] font-bold text-indigo-600 block mt-1 bg-indigo-50 px-2 py-0.5 rounded-full text-center">
                          Base: {simBaseSalary.toLocaleString('fr-TN')} DT
                        </span>
                      </div>
                    </div>

                    {/* Step by step Breakdown */}
                    <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                      {/* 1. Brutes allowances */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-slate-800">1. Salaire Brut de Travail (Brut Global)</p>
                          <p className="text-[10px] text-slate-400 font-medium">Somme de la base ({simBaseSalary} DT) + Primes ({simTransportAllowance + simPresenceAllowance + simOtherAllowances} DT)</p>
                        </div>
                        <span className="font-mono text-slate-700 font-bold">
                          {simCalculation.gross.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>

                      {/* 2. CNSS employee contribution */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-slate-800">2. Retenue CNSS Part Salariale (9,18%)</p>
                          <p className="text-[10px] text-slate-400 font-medium font-semibold">Cotisation sociale ouvrière prélevée directement sur le brut.</p>
                        </div>
                        <span className="font-mono text-red-600 font-bold">
                          {simIsCivpExempt ? "0.000 TND" : `-${simCalculation.cnssEmployee.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`}
                        </span>
                      </div>

                      {/* 3. Net Taxable */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-slate-800">3. Brut Imposable (Net de CNSS)</p>
                          <p className="text-[10px] text-slate-400 font-medium">Assiette de base pour calculer l'impôt sur le revenu (IRPP).</p>
                        </div>
                        <span className="font-mono text-slate-800 font-bold bg-slate-50 px-1 rounded">
                          {simCalculation.gross - simCalculation.cnssEmployee < 0 ? "0.000" : (simCalculation.gross - simCalculation.cnssEmployee).toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>

                      {/* 4. Abattement frais pro */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-slate-800">4. Déduction Frais Professionnels (10%)</p>
                          <p className="text-[10px] text-slate-400 font-medium">Abattement de 10% plafonné à 166,667 DT / mois (2 000 DT / an).</p>
                        </div>
                        <span className="font-mono text-indigo-700 font-bold">
                          -{simCalculation.professionalExpenses.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>

                      {/* 5. Abattement famille */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-slate-800">5. Abattement Situation Familiale</p>
                          <p className="text-[10px] text-slate-400 font-medium">Chef de famille ({simIsChefDeFamille ? "300 DT/an" : "0 DT/an"}) + Enfants à charge.</p>
                        </div>
                        <span className="font-mono text-indigo-700 font-bold">
                          -{simCalculation.familyDeduction.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>

                      {/* 6. Assiette annuelle estimée */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-slate-800">6. Assiette Réelle Imposable Annuelle</p>
                          <p className="text-[10px] text-slate-400 font-medium">Rémunération annuelle nette soumise au barème progressif tunisien.</p>
                        </div>
                        <span className="font-mono text-slate-900 font-extrabold">
                          {simCalculation.estimatedAnnualTaxableBasis.toLocaleString('fr-TN', { maximumFractionDigits: 0 })} TND / an
                        </span>
                      </div>

                      {/* 7. Monthly IRPP Tax */}
                      <div className="flex justify-between items-center border-b pb-2 bg-rose-50/10 p-1.5 rounded-lg border border-red-500/10">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-rose-950">7. Impôt IRPP Retenu à la Source (Mensuel)</p>
                          <p className="text-[10px] text-rose-600 font-medium">Calculé selon le barème de l'impôt progressif ({simCalculation.annualIRPP.toLocaleString('fr-TN', { maximumFractionDigits: 0 })} DT annuel).</p>
                        </div>
                        <span className="font-mono text-red-600 font-bold bg-white p-1 rounded border shadow-3xs">
                          -{simCalculation.irpp.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>

                      {/* 8. Monthly CSS */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-slate-800">8. Contribution Sociale Solidaire (CSS - 1%)</p>
                          <p className="text-[10px] text-slate-400 font-medium">Redevance de 1% de l'assiette imposable nette pour le soutien budgétaire.</p>
                        </div>
                        <span className="font-mono text-red-500 font-bold">
                          -{simCalculation.css.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>

                      {/* 9. Charge Patronale Additionnelle */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex justify-between items-center mt-2 text-[10.5px]">
                        <div className="text-left space-y-0.5 max-w-[70%]">
                          <strong className="text-slate-800 font-black flex items-center gap-1">
                            <span>Contributions Patronales CNSS (17.07%)</span>
                            <span className="text-[9px] font-sans font-medium text-slate-400">À la charge de Elyssa S.A.</span>
                          </strong>
                          <p className="text-[9.5px] text-slate-400 font-medium leading-tight">Comprend la participation CNSS standard de 16,57% et les accidents de travail de 0,5%.</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-slate-600 font-bold block">
                            {simIsCivpExempt ? "0.000 TND" : `${simCalculation.cnssEmployer.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND`}
                          </span>
                          <span className="text-[9.5px] text-slate-400 italic block mt-0.5">Coût Entreprise: {simIsCivpExempt ? simCalculation.gross.toLocaleString('fr-TN') : (simCalculation.gross + simCalculation.cnssEmployer).toLocaleString('fr-TN')} DT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tunisian Law Legal/Tax Guidelines card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5.5 space-y-4 shadow-3xs text-left">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Barème d'IRPP & Cotisations Tunisiennes
                    </h4>
                  </div>
                  
                  <p className="text-[11px] text-slate-450 leading-relaxed font-semibold">
                    Le barème d'impôt sur le revenu des personnes physiques (IRPP) est ordonné par tranche de revenus annuels imposables nets de cotisations de sécurité sociale (CNSS 9.18%) et de déductions pour frais d'exploitation de fonction (10% limitées à 2000 DT/an).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono text-slate-800 bg-white p-3.5 border rounded-xl shadow-4xs">
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-450 uppercase border-b pb-0.5">Tranches de Revenu Annuel (IRPP)</p>
                      <p>• De 0 à 5 000 DT <span className="text-indigo-600 font-bold">(0%)</span></p>
                      <p>• De 5 000 à 20 000 DT <span className="text-indigo-600 font-bold">(26%)</span></p>
                      <p>• De 20 000 à 30 000 DT <span className="text-indigo-600 font-bold">(28%)</span></p>
                      <p>• De 30 000 à 50 000 DT <span className="text-indigo-600 font-bold">(32%)</span></p>
                      <p>• Au-delà de 50 000 DT <span className="text-indigo-600 font-bold">(35%)</span></p>
                    </div>

                    <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-4 pt-3.5 sm:pt-0">
                      <p className="font-extrabold text-slate-450 uppercase border-b pb-0.5">Cotisations Sociales</p>
                      <p className="font-bold font-sans">Part Employée (Retenue):</p>
                      <p>• 9.18% sur le brut.</p>
                      <p className="font-bold font-sans">Part Patronale (Charge):</p>
                      <p>• 16.57% (Cotisation) + 0.5% (Accident) = 17.07%.</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-indigo-150 bg-indigo-50/15 p-3 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-450 font-semibold leading-normal">
                      <strong className="text-slate-850">Note relative au CIVP :</strong> Les contrats CIVP (Contrat d'Initiation à la Vie Professionnelle) bénéficient d'une dispense d'assujettissement aux charges de sécurité sociale CNSS sur l'indemnité perçue, permettant au collaborateur de toucher l'intégralité du traitement brut comme salaire net.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'cnss' && (
          <div className="space-y-6 text-left animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-black uppercase text-slate-500 font-mono">Assujettissement des Déclarations CNSS (Filing assistance)</span>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">Télé-déclarations & Fichiers de Déclaration Trimestriels</h3>
              </div>
              <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold font-mono text-[10px] p-1 px-3 rounded-full flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                <span>Code Bureau CNSS Tunis : {cnssCompanyBureau}</span>
              </span>
            </div>

            {cnssDeclarations.length === 0 ? (
              <div className="bg-white border text-center p-12 rounded-2xl space-y-3 shadow-3xs">
                <Scale className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Aucun calcul trimestriel CNSS n'est encore consolidé.</p>
                <p className="text-[10px] text-slate-400 font-semibold">Dès que vous validez ou générez des fiches de paie pour n'importe quel mois, les contributions CNSS seront indexées automatiquement par trimestre civil.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Standard Quarters Summary Table */}
                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs">
                  <div className="p-4 bg-slate-50 border-b flex justify-between items-center flex-wrap gap-2.5">
                    <div>
                      <h3 className="text-xs font-black text-slate-800">Recapitulatif Trimestriel à des fins de déclaration (Formulaire CNSS)</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Taux consolidé Elyssa: part salariale 9.18% + part patronale 17.07% = 26.25% de la masse salariale brute.</p>
                    </div>
                    <span className="bg-slate-900 text-white rounded font-mono font-bold text-[9px] px-2 py-1">Affiliation CNSS : {cnssCompanyAffiliation}</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-medium">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[9px] border-b">
                          <th className="p-4">Trimestre / Période Civile</th>
                          <th className="p-4">Collaborateurs Uniques</th>
                          <th className="p-4 text-right">Salaire Brut Déclarant</th>
                          <th className="p-4 text-right">Retenue Salariale (9.18%)</th>
                          <th className="p-4 text-right">Cotisation Patronale (17.07%)</th>
                          <th className="p-4 text-right">Montant Total Trimestriel</th>
                          <th className="p-4 text-center">Génération & Télédéclaration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cnssDeclarations.map(decl => {
                          const isSelected = selectedCnssQuarterState === (decl.quarter + '-' + decl.year);
                          return (
                            <tr key={decl.quarter + '-' + decl.year} className={`hover:bg-slate-50/50 transition ${isSelected ? 'bg-indigo-50/20' : ''}`}>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-indigo-600" />
                                  <strong className="text-slate-850 font-extrabold">{decl.label}</strong>
                                </div>
                              </td>
                              <td className="p-4 text-slate-705 font-bold">{decl.employeesCount} salariés déclarés</td>
                              <td className="p-4 text-right font-mono text-slate-800 font-bold">{decl.totalBrut.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</td>
                              <td className="p-4 text-right font-mono text-rose-600">({decl.cnssOuvriere.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND)</td>
                              <td className="p-4 text-right font-mono text-slate-500">({decl.cnssPatronale.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND)</td>
                              <td className="p-4 text-right font-mono text-indigo-850 font-black bg-indigo-50/10">
                                {decl.totalcnss.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center items-center gap-1.5">
                                  <button
                                    onClick={() => setSelectedCnssQuarterState(isSelected ? null : decl.quarter + '-' + decl.year)}
                                    className={`p-1.5 px-3 rounded text-[9.5px] font-black uppercase flex items-center gap-1 transition ${
                                      isSelected
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 shadow-3xs'
                                    }`}
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{isSelected ? 'Fermer l\'outil' : 'Générer DSN'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Interactive CNSS Generator Panel */}
                {selectedCnssQuarterState && selectedQuarterDetail && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in text-left">
                    {/* Left Column: Employer & Affiliation Credentials */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                        <div className="flex items-center gap-2 border-b pb-3">
                          <Building className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Données de l'Affilié (Elyssa)
                          </h4>
                        </div>

                        {/* N° Affiliation CNSS */}
                        <div className="space-y-1">
                          <label className="block text-[10.5px] font-extrabold text-slate-655">№ Affiliation CNSS (8+2 chiffres)</label>
                          <input 
                            type="text" 
                            value={cnssCompanyAffiliation}
                            onChange={e => setCnssCompanyAffiliation(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800 font-bold"
                            placeholder="Ex: 10948529-68"
                          />
                          <p className="text-[9px] text-slate-400 font-semibold leading-normal">Numéro unique assigné par la caisse nationale de sécurité sociale tunisienne.</p>
                        </div>

                        {/* Code Bureau */}
                        <div className="space-y-1">
                          <label className="block text-[10.5px] font-extrabold text-slate-655">Code Bureau Régional (CNSS)</label>
                          <select
                            value={cnssCompanyBureau}
                            onChange={e => setCnssCompanyBureau(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-slate-800 bg-white"
                          >
                            <option value="01">01 - Tunis (Carthage-La Fayette)</option>
                            <option value="02">02 - Sousse</option>
                            <option value="03">03 - Sfax</option>
                            <option value="04">04 - Nabeul</option>
                            <option value="05">05 - Bizerte</option>
                            <option value="06">06 - Gabès</option>
                            <option value="50">50 - Ariana</option>
                          </select>
                        </div>

                        {/* Code Regroupement */}
                        <div className="space-y-1">
                          <label className="block text-[10.5px] font-extrabold text-slate-655">Code de Regroupement</label>
                          <input 
                            type="text" 
                            maxLength={3}
                            value={cnssCompanyRegroup}
                            onChange={e => setCnssCompanyRegroup(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono text-slate-800 font-bold"
                            placeholder="Ex: 000"
                          />
                        </div>

                        <div className="bg-indigo-50/40 p-3 rounded-lg border border-indigo-100 flex items-start gap-2 text-[10px] text-slate-450 font-semibold">
                          <Info className="w-3.5 h-3.5 text-indigo-650 shrink-0 mt-0.5" />
                          <p className="leading-tight">
                            Ces paramètres structurent la première ligne (enregistrement type 1) du fichier conforme de déclaration à soumettre sur support magnétique ou portail télédéclaration.
                          </p>
                        </div>
                      </div>

                      {/* Official Instructions */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Instructions de Télé-déclaration</span>
                        </h4>
                        <ol className="text-[10px] text-slate-450 space-y-2 list-decimal pl-4 font-semibold leading-normal">
                          <li>Vérifiez la table des salaires mensuels bruts individuels consolidés ci-contre.</li>
                          <li>Cliquez sur <strong className="text-slate-800">"Télécharger le DSN (.TXT)"</strong> pour obtenir le fichier conforme au format réglementaire de la CNSS tunisienne.</li>
                          <li>Connectez-vous sur votre espace sécurisé du portail <a href="https://tassrih.cnss.tn" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Tassrih CNSS Tunis</a>.</li>
                          <li>Importez le fichier généré dans l'onglet "Déclaration par Support Magnétique". Le système de la CNSS validera l'intégrité de la structure et calculera les contributions correspondantes.</li>
                        </ol>
                      </div>
                    </div>

                    {/* Right Column: Calculations Listing Detail + Raw String Preview */}
                    <div className="lg:col-span-8 space-y-4">
                      {/* Employer Wages detail Month 1, 2, 3 */}
                      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="text-[9.5px] font-bold uppercase text-indigo-400 tracking-wider font-mono">
                              Consolidation Individuelle Mensuelle
                            </span>
                            <h4 className="text-xs font-extrabold font-display">Salaires Bruts par Collaborateur pour le trimestre</h4>
                          </div>
                          <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                            {selectedQuarterDetail.listing.length} Salariés de Elyssa S.A.
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[9px] border-b">
                                <th className="p-3 pl-4">Salarié / N° CNSS</th>
                                <th className="p-3 text-right">Mois 1 Brut</th>
                                <th className="p-3 text-right">Mois 2 Brut</th>
                                <th className="p-3 text-right">Mois 3 Brut</th>
                                <th className="p-3 text-right">Total Brut (DT)</th>
                                <th className="p-3 text-right">Total CNSS (26.25%)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {selectedQuarterDetail.listing.map((emp: any) => (
                                <tr key={emp.employeeId} className="hover:bg-slate-50/30 transition">
                                  <td className="p-3 pl-4 text-left">
                                    <div className="space-y-0.5">
                                      <p className="font-extrabold text-slate-800 text-[11px]">{emp.employeeName}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">CNSS: {emp.ssn}</p>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right font-mono text-[11px] text-slate-700">{emp.monthTotals[0].toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                                  <td className="p-3 text-right font-mono text-[11px] text-slate-700">{emp.monthTotals[1].toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                                  <td className="p-3 text-right font-mono text-[11px] text-slate-700">{emp.monthTotals[2].toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                                  <td className="p-3 text-right font-mono font-bold text-indigo-900 text-[11px]">{emp.totalBrut.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                                  <td className="p-3 text-right font-mono font-bold text-rose-600 text-[11px]">{emp.totalCnss.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</td>
                                </tr>
                              ))}
                              {/* Total Rows summary layout */}
                              <tr className="bg-slate-50/50 font-black border-t text-slate-900">
                                <td className="p-3 pl-4 text-[10.5px]">Totaux Trimestriels</td>
                                <td className="p-3 text-right font-mono text-[10px] text-slate-500">—</td>
                                <td className="p-3 text-right font-mono text-[10px] text-slate-500">—</td>
                                <td className="p-3 text-right font-mono text-[10px] text-slate-500">—</td>
                                <td className="p-3 text-right font-mono text-indigo-950 text-[11px]">{selectedQuarterDetail.totals.brut.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</td>
                                <td className="p-3 text-right font-mono text-rose-700 text-[11px]">{selectedQuarterDetail.totals.totalCnss.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* File Preview and Download tools */}
                      <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3.5">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-indigo-650" />
                              <span>Fichier de Support Magnétique CNSS (.TXT)</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold">Générateur d'enregistrement fixe normalisé CNSS Tunisie au format brut.</p>
                          </div>
                          
                          {/* Top downloads bar */}
                          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                            <button
                              onClick={handleCopyCnssToClipboard}
                              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1 transition"
                              title="Copier le contenu Brut"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedCnssFeedback ? "Copié !" : "Copier"}</span>
                            </button>
                            <button
                              onClick={handleDownloadCnssCsv}
                              className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <Download className="w-3 h-3" />
                              <span>Rapport CSV</span>
                            </button>
                            <button
                              onClick={handleDownloadCnssTxt}
                              className="p-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black uppercase flex items-center gap-1 transition shadow-3xs"
                            >
                              <Download className="w-3 h-3" />
                              <span>Télécharger .TXT</span>
                            </button>
                          </div>
                        </div>

                        {/* Text representation preview code box */}
                        <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl relative overflow-hidden font-mono text-[10px] leading-relaxed text-indigo-150">
                          <div className="absolute top-2 right-2 flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                          </div>
                          
                          <div className="overflow-x-auto whitespace-pre max-h-48 text-left">
                            {rawMagneticFileString ? (
                              rawMagneticFileString
                            ) : (
                              <span className="text-slate-500 italic">Aucune donnée structurelle disponible.</span>
                            )}
                          </div>
                        </div>

                        <div className="text-[9.5px] text-slate-400 font-semibold flex items-center justify-between">
                          <span>Structure: Type 1 (Entête) • Type 2 (Salarial) • Type 3 (Totalisation)</span>
                          <span className="font-mono">{rawMagneticFileString.split('\n').length - 1} lignes générées</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ----------------- SUB TAB : DOCUMENTS ----------------- */}
        {activeSubTab === 'documents' && (
          <div className="space-y-6 text-left animate-fade-in">
            {/* Intro Header */}
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-black uppercase text-slate-500 font-mono">Modèles Réglementaires & Générateur d'actes</span>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">Éditeur d'Attestations de Travail, Salaire & Retenues Fiscales</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Conforme aux attentes des banques tunisiennes et à l'Administration Fiscale (Art. 52 du code de l'IRPP/IS).</p>
              </div>
              <button
                onClick={() => {
                  window.print();
                }}
                className="p-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l'Attestation</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Settings */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <h4 className="text-xs font-black uppercase text-slate-800 border-b pb-2.5">Paramètres du Document</h4>
                  
                  {/* Select Employee */}
                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-extrabold text-slate-655">Salarié Destinataire</label>
                    <select
                      value={docEmployeeId}
                      onChange={e => setDocEmployeeId(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-slate-800 bg-white"
                    >
                      <option value="">-- Choisir un collaborateur --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.jobTitle})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Doc Type */}
                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-extrabold text-slate-655">Type de Document</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => setDocType('Work')}
                        className={`p-2.5 text-left rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                          docType === 'Work' 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650'
                        }`}
                      >
                        <FileText className="w-4 h-4 shrink-0 text-indigo-650" />
                        <div className="text-left leading-normal">
                          <p>Attestation de Travail</p>
                          <p className="text-[9px] text-slate-400 font-semibold font-mono">Preuve de fonction & d'activité</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDocType('Salary')}
                        className={`p-2.5 text-left rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                          docType === 'Salary' 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650'
                        }`}
                      >
                        <Calculator className="w-4 h-4 shrink-0 text-indigo-650" />
                        <div className="text-left leading-normal">
                          <p>Attestation de Salaire (Crédit)</p>
                          <p className="text-[9px] text-slate-400 font-semibold font-mono">Pour financements bancaires</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDocType('Withholding');
                          setDocWithholdingY(2026);
                        }}
                        className={`p-2.5 text-left rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                          docType === 'Withholding' 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650'
                        }`}
                      >
                        <Scale className="w-4 h-4 shrink-0 text-indigo-650" />
                        <div className="text-left leading-normal">
                          <p>Certificat de Retenue (Art. 52)</p>
                          <p className="text-[9px] text-slate-400 font-semibold font-mono text-indigo-650">Bilan Annuel d'Impôts administratifs</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Conditions Spécifiques */}
                  {docType === 'Salary' && (
                    <div className="space-y-2 pt-2 border-t text-left">
                      <label className="block text-[10.5px] font-extrabold text-slate-655">Base d'affichage du Salaire</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDocSalaryType('Net')}
                          className={`p-1.5 text-center rounded-lg text-xs font-bold border transition ${
                            docSalaryType === 'Net' ? 'bg-slate-900 text-white border-slate-900 font-black' : 'bg-white text-slate-605'
                          }`}
                        >
                          Net de charges
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocSalaryType('Brut')}
                          className={`p-1.5 text-center rounded-lg text-xs font-bold border transition ${
                            docSalaryType === 'Brut' ? 'bg-slate-900 text-white border-slate-900 font-black' : 'bg-white text-slate-605'
                          }`}
                        >
                          Brut global
                        </button>
                      </div>
                    </div>
                  )}

                  {docType === 'Withholding' && (
                    <div className="space-y-2 pt-2 border-t">
                      <label className="block text-[10.5px] font-extrabold text-slate-655">Année fiscale de la déclaration</label>
                      <select
                        value={docWithholdingY}
                        onChange={e => setDocWithholdingY(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white font-mono font-bold text-slate-805"
                      >
                        <option value="2026">2026 (Exercice fiscal en cours)</option>
                        <option value="2025">2025 (Exercice fiscal précédent)</option>
                        <option value="2024">2024</option>
                      </select>
                    </div>
                  )}

                  {/* Note Libre */}
                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-extrabold text-slate-655">Mention complémentaire (Note)</label>
                    <textarea
                      rows={3}
                      value={docNote}
                      onChange={e => setDocNote(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-705 focus:outline-none"
                      placeholder="Note libre de clôture..."
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-2 text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Calcul Intellisense :</strong> Le certificat de l'Art. 52 compile automatiquement l'ensemble des cotisations de bulletins de l'exercice fiscal {docWithholdingY}.
                  </p>
                </div>

                {/* GED INTEGREE - DOSSIER JUSTIFICATIFS SALARIES */}
                <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-indigo-650" />
                      <span>GED RH & Justificatifs</span>
                    </h4>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddingEmpDoc(!isAddingEmpDoc);
                        // Refresh state from localStorage
                        const saved = localStorage.getItem('carthage_documents');
                        if (saved) {
                          try { setGedDocs(JSON.parse(saved)); } catch (e) {}
                        }
                      }}
                      className="p-1 px-2 border border-indigo-100 text-indigo-600 rounded hover:bg-indigo-50 text-[10px] font-bold cursor-pointer"
                    >
                      {isAddingEmpDoc ? "Fermer" : "+ Ajouter"}
                    </button>
                  </div>

                  {isAddingEmpDoc && (
                    <form onSubmit={handleAddEmpDocSubmit} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Collaborateur cible *</label>
                        <select
                          required
                          value={isEmpDocForId}
                          onChange={e => setIsEmpDocForId(e.target.value)}
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none"
                        >
                          <option value="">-- Choisir --</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Fichier justificatif *</label>
                        <input 
                          type="file" 
                          required
                          onChange={handleEmpFileChange}
                          accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                          className="w-full p-1 border border-slate-200 rounded bg-white text-xs cursor-pointer"
                        />
                        {empDocError && <p className="text-[9px] text-rose-600 font-extrabold mt-1">{empDocError}</p>}
                        {empDocFile && (
                          <p className="text-[9px] text-emerald-700 font-bold mt-1">✓ {empDocFile.name} ({(empDocFile.size / 1024).toFixed(0)} KB)</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nom du fichier *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Contrat CDD paraphé"
                            value={empDocName}
                            onChange={e => setEmpDocName(e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-slate-705 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Type de Document *</label>
                          <select
                            value={empDocType}
                            onChange={(e: any) => setEmpDocType(e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded bg-white cursor-pointer"
                          >
                            <option value="Contract">Contrat Juridique</option>
                            <option value="Invoice">RIB / Décharge / Administratif</option>
                            <option value="Report">Certificat Médical / Absence</option>
                            <option value="Other">Autre Pièce Justificative</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1.5 border-t">
                        <button 
                          type="button" 
                          onClick={() => setIsAddingEmpDoc(false)}
                          className="p-1 px-2 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit" 
                          className="p-1 px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Enregistrer GED
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of employee documents */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {gedDocs.filter(d => d.linkedToType === 'Employee').length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                        Aucun justificatif n'est archivé pour le personnel dans la GED.
                      </p>
                    ) : (
                      gedDocs
                        .filter(d => d.linkedToType === 'Employee')
                        .map(doc => {
                           const downloadDoc = (curr: any) => {
                             const anchor = document.createElement('a');
                             let hrefToUse = curr.base64Data;
                             if (!hrefToUse || hrefToUse.startsWith('data:text/plain')) {
                               hrefToUse = getValidMockBase64(curr);
                             }
                             anchor.href = hrefToUse;
                             anchor.download = curr.name.includes('.') ? curr.name : `${curr.name}.${curr.fileType.split('/')[1] || 'pdf'}`;
                             document.body.appendChild(anchor);
                             anchor.click();
                             document.body.removeChild(anchor);
                           };

                          return (
                            <div 
                              key={doc.id}
                              className="p-2 border border-slate-100 rounded-lg flex items-center justify-between text-xs bg-slate-50/50 hover:bg-slate-50 transition"
                            >
                              <div className="truncate pr-2">
                                <span className="font-extrabold text-slate-800 truncate block text-[11px]">{doc.name}</span>
                                <span className="text-[9.5px] text-indigo-700 font-bold block truncate">
                                  {doc.linkedToName}
                                </span>
                                <span className="text-[9.5px] text-slate-400 font-mono block">
                                  {doc.uploadDate} • {doc.fileSize}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => downloadDoc(doc)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                  title="Télécharger"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmpDoc(doc.id)}
                                  className="p-1 text-slate-305 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Physical Paper View Preview */}
              <div className="lg:col-span-8 space-y-4">
                {!currentDocEmployee ? (
                  <div className="bg-white border text-center p-16 rounded-2xl space-y-3 shadow-3xs">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Aucun salarié sélectionné.</p>
                    <p className="text-[10px] text-slate-400">Veuillez choisir un destinataire dans le formulaire de gauche.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-205 rounded-2xl shadow-md overflow-hidden relative">
                    {/* Header bar */}
                    <div className="bg-slate-50 p-3.5 border-b flex justify-between items-center px-5">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 font-mono">Prévisualisation d'Acte RH Officiel Elyssa</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      </div>
                    </div>

                    {/* Paper Area for print */}
                    <div className="p-8 md:p-12 bg-white text-slate-900 border-b min-h-[700px] font-serif text-left space-y-8" id="printable-rh-doc">
                      {/* Top Employer Header */}
                      <div className="flex justify-between items-start border-b pb-4.5 font-sans leading-tight text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <ElyssaLogo className="w-14 h-14 rounded-xl bg-slate-900 p-2 shrink-0 border border-slate-800" />
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black uppercase text-indigo-950 font-display tracking-wide">ELYSSA S.A.</h4>
                            <p className="font-semibold text-slate-500">Services Technologiques FinTech & ERP</p>
                            <p className="text-slate-500">Capital Social : 500 000 DT • M.F. : 1094852/N/A/M/000 (Tunis)</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1 font-mono font-bold text-[10px]">
                          <p>Affiliation CNSS : {cnssCompanyAffiliation}</p>
                          <p>Siège : Boulevard du Lac, Les Berges du Lac, 1053 Tunis</p>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="text-center py-6">
                        <h2 className="text-xl font-extrabold uppercase tracking-wider underline underline-offset-8 decoration-indigo-800 text-slate-950 font-sans">
                          {docType === 'Work' && "Attestation de Travail"}
                          {docType === 'Salary' && "Attestation de Salaire"}
                          {docType === 'Withholding' && "Certificat de Retenue d'Impôt à la Source sur Salaire"}
                        </h2>
                        {docType === 'Withholding' && (
                          <p className="font-mono text-[11px] text-slate-500 font-semibold mt-2">(En application de l'Article 52 du Code de l'IRPP et de l'IS — Exercice Fiscal {docWithholdingY})</p>
                        )}
                      </div>

                      {/* Content body dependent on document type */}
                      {(() => {
                        const docEmpName = currentDocEmployee.name || "Collaborateur";
                        const docEmpSsn = currentDocEmployee.ssn || "14839211-92";
                        const docEmpCin = currentDocEmployee.cin || (currentDocEmployee.ssn ? currentDocEmployee.ssn.replace(/[^0-9]/g, '').substring(0, 8) : "09848521");
                        const docEmpJob = currentDocEmployee.jobTitle || currentDocEmployee.role || "Collaborateur RH";
                        const rawHiringDate = currentDocEmployee.hiringDate || currentDocEmployee.hireDate || "2024-01-15";
                        const docEmpHiringDateFormatted = (() => {
                          try {
                            const d = new Date(rawHiringDate);
                            return isNaN(d.getTime()) ? "15/01/2024" : d.toLocaleDateString('fr-TN');
                          } catch {
                            return "15/01/2024";
                          }
                        })();
                        const docEmpBase = Number(currentDocEmployee.baseSalary) || 1800;
                        const docEmpTrans = Number(currentDocEmployee.transportAllowance) || 150;
                        const docEmpPres = Number(currentDocEmployee.presenceAllowance) || 80;
                        const docEmpTotalBrut = docEmpBase + docEmpTrans + docEmpPres;

                        return (
                          <>
                            {docType === 'Work' && (
                              <div className="space-y-6 leading-relaxed text-sm">
                                <p>
                                  Nous soussignés, la société <strong>ELYSSA S.A.</strong>, établie à Tunis, certifions par la présente que :
                                </p>
                                <div className="pl-6 border-l-2 border-slate-300 space-y-2.5">
                                  <p>Monsieur/Madame <strong>{docEmpName}</strong>,</p>
                                  <p>Titulaire du passeport ou C.I.N N° <strong>{docEmpCin}</strong>,</p>
                                  <p>Immatriculé(e) à la Sécurité Sociale sous le N° <strong>CNSS {docEmpSsn}</strong>.</p>
                                </div>
                                <p>
                                  Est employé(e) au sein de notre entreprise depuis le <strong>{docEmpHiringDateFormatted}</strong> en qualité de <strong>{docEmpJob}</strong> sous régime permanent.
                                </p>
                                <p>
                                  La présente attestation est délivrée à l'intéressé(e) pour faire valoir ce que de droit, l'employé(e) demeurant actif et libre de tout engagement envers Elyssa S.A. à la date de signature des présentes.
                                </p>
                              </div>
                            )}

                            {docType === 'Salary' && (
                              <div className="space-y-6 leading-relaxed text-sm">
                                <p>
                                  La direction des Ressources Humaines de la société <strong>ELYSSA S.A.</strong> certifie par la présente que :
                                </p>
                                <div className="pl-6 border-l-2 border-slate-300 space-y-2.5 font-sans text-xs">
                                  <p>Salarié destinataire : <strong>{docEmpName}</strong></p>
                                  <p>Fonction exercée : <strong>{docEmpJob}</strong></p>
                                  <p>Date de recrutement légal : <strong>{docEmpHiringDateFormatted}</strong></p>
                                  <p>№ Registre CNSS : <strong>{docEmpSsn}</strong></p>
                                </div>
                                <p>
                                  Perçoit à ce titre une rémunération brute globale évaluée comme suit au titre des fiches de paie courantes :
                                </p>
                                <div className="bg-slate-50 p-4 border rounded-xl font-mono text-xs max-w-md mx-auto space-y-1.5 shadow-3xs">
                                  <div className="flex justify-between border-b pb-1">
                                    <span className="font-sans font-bold text-slate-550">Salaire Mensuel Brut :</span>
                                    <span className="font-extrabold text-slate-800">
                                      {docEmpTotalBrut.toFixed(3)} TND
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-b pb-1">
                                    <span className="font-sans font-bold text-slate-550">Retenues CNSS Salariales (9.18%) :</span>
                                    <span className="text-rose-700 font-bold">
                                      {(-(docEmpTotalBrut * 0.0918)).toFixed(3)} TND
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-black text-indigo-900 pt-0.5 text-sm">
                                    <span className="font-sans">Montant Estimé à l'affichage ({docSalaryType}) :</span>
                                    <span>
                                      {docSalaryType === 'Net' 
                                        ? (docEmpBase * 0.825).toFixed(3) // reasonable estimate
                                        : docEmpTotalBrut.toFixed(3)
                                      } TND
                                    </span>
                                  </div>
                                </div>
                                <p className="italic text-xs text-indigo-900 text-center font-semibold font-sans pt-1">
                                  Soit en toutes lettres : {FrenchNumberToWords(
                                    docSalaryType === 'Net' 
                                      ? Number((docEmpBase * 0.825).toFixed(3)) 
                                      : Number(docEmpTotalBrut.toFixed(3))
                                  )}
                                </p>
                                <p>
                                  Cette attestation d'acompte de salaire est fournie à la demande de l'employé pour le montage de dossiers de financement bancaire.
                                </p>
                              </div>
                            )}

                            {docType === 'Withholding' && (
                              <div className="space-y-5 leading-normal text-xs text-slate-800">
                                {/* Part A: Debiteur details */}
                                <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg bg-slate-50/50">
                                  <div className="space-y-1">
                                    <p className="font-bold uppercase text-[9px] text-slate-400 font-sans">A. Débiteur d'Impôts (Employeur)</p>
                                    <p className="font-bold text-slate-800">ELYSSA S.A.</p>
                                    <p>Adresse : Boulevard du Lac, Les Berges du Lac, Tunis</p>
                                    <p className="font-mono">M.F. : 1094852/N/A/M/000 • CNSS : {cnssCompanyAffiliation}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-bold uppercase text-[9px] text-slate-400 font-sans">B. Bénéficiaire de revenu (Salarié)</p>
                                    <p className="font-bold text-slate-800">{docEmpName}</p>
                                    <p>Qualité : {docEmpJob}</p>
                                    <p className="font-mono">CIN : {docEmpCin} • CNSS : {docEmpSsn}</p>
                                  </div>
                                </div>

                                {/* Table of Withholding figures */}
                                <div className="border rounded-lg overflow-hidden font-sans">
                                  <div className="p-2.5 bg-slate-100 font-bold text-[10px] uppercase text-slate-500 text-center border-b">
                                    Cotisations d’Impôt Retenues à la Source (Annuel)
                                  </div>
                                  <table className="w-full text-left text-[11px] border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 border-b text-[9.5px] uppercase font-extrabold text-slate-500">
                                        <th className="p-2 border-r">Rémunération de paie</th>
                                        <th className="p-2 text-right border-r">Montant Brut (DT)</th>
                                        <th className="p-2 text-right border-r">Regs Exonérés (CNSS)</th>
                                        <th className="p-2 text-right border-r">Net imposable (DT)</th>
                                        <th className="p-2 text-right">Impôt Retenu (IRPP+CSS)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="hover:bg-slate-50">
                                        <td className="p-2 border-r font-bold">Salaires Elyssa S.A.</td>
                                        <td className="p-2 text-right border-r font-mono">{withholdingValues.gross.toFixed(3)}</td>
                                        <td className="p-2 text-right border-r font-mono text-red-700">({withholdingValues.nonTaxable.toFixed(3)})</td>
                                        <td className="p-2 text-right border-r font-mono">{withholdingValues.taxable.toFixed(3)}</td>
                                        <td className="p-2 text-right font-mono font-bold text-indigo-900">{withholdingValues.tax.toFixed(3)}</td>
                                      </tr>
                                      <tr className="bg-slate-100 font-black border-t text-[11px]">
                                        <td className="p-2 border-r uppercase text-[9.5px]">Totaux d'actes</td>
                                        <td className="p-2 text-right border-r font-mono">{withholdingValues.gross.toFixed(3)}</td>
                                        <td className="p-2 text-right border-r font-mono">({withholdingValues.nonTaxable.toFixed(3)})</td>
                                        <td className="p-2 text-right border-r font-mono">{withholdingValues.taxable.toFixed(3)}</td>
                                        <td className="p-2 text-right font-mono text-indigo-950 bg-indigo-50/40">{withholdingValues.tax.toFixed(3)}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                <div className="bg-emerald-50/50 p-2.5 border border-emerald-100 rounded text-[10px] text-slate-655 flex justify-between items-center font-sans font-medium">
                                  <span>Indexation : <strong>{withholdingValues.count} fiches réels comptabilisées</strong> pour {docWithholdingY}.</span>
                                </div>

                                <p className="leading-relaxed mt-1 font-sans text-slate-500">
                                  Nous certifions que le montant total d’impôt retenu à la source ci-dessus a été reversé intégralement à la recette des finances correspondante selon la recette de l'Art. 52.
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {/* Notes Section details */}
                      {docNote && (
                        <p className="text-xs text-slate-500 italic border-l-2 p-1.5 pl-4 font-sans leading-normal">
                          « {docNote} »
                        </p>
                      )}

                      {/* Sign-off footer block with mock stamp */}
                      <div className="flex justify-between items-end pt-12 text-xs font-sans">
                        <div className="text-left font-medium space-y-1">
                          <p>Fait à <strong>Tunis</strong>, le <strong>{new Date().toLocaleDateString('fr-TN')}</strong></p>
                          <p className="text-slate-400 font-bold">Direction des Ressources Humaines</p>
                        </div>
                        
                        {/* Company Stamp and Signature block */}
                        <div className="text-center relative mr-12 h-20 w-36 border border-dotted border-slate-300 rounded flex items-center justify-center bg-slate-50/20 shadow-4xs overflow-hidden">
                          <span className="text-[10px] text-slate-300 italic">Signature & Cachet</span>
                          <div className="absolute inset-0 flex items-center justify-center opacity-45 select-none pointer-events-none scale-90">
                            <div className="border border-indigo-650 rounded-full h-16 w-16 flex items-center justify-center font-black text-[8px] uppercase tracking-tighter text-indigo-655 leading-tight border-double text-center rotate-12 bg-white">
                              {(adminSettings?.companyName || "Inter-Affaires").toUpperCase()}<br/>{(adminSettings?.legalRepresentative || "LE DIRECTEUR").toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Corporate Premium Footer */}
                      <div className="border-t border-slate-200 pt-3 mt-10 text-center text-[8.5px] text-slate-400 font-sans space-y-1 tracking-wide">
                        <p className="font-bold">Elyssa ERP Suite • Document Administratif Officiel Édité Électriquement</p>
                        <p>
                          {adminSettings?.companyName || "Inter-Affaires"} 
                          {adminSettings?.legalForm ? ` (${adminSettings.legalForm})` : ""} 
                          {adminSettings?.shareCapital ? ` au capital de ${adminSettings.shareCapital.toLocaleString('fr-FR')} TND` : ""} 
                          {adminSettings?.rneNumber ? ` - RNE ${adminSettings.rneNumber}` : ""} 
                          {adminSettings?.companyMF ? ` - MF ${adminSettings.companyMF}` : ""} 
                          {adminSettings?.companyAddress ? ` - ${adminSettings.companyAddress}` : ""} 
                          {adminSettings?.cityZipCode ? ` ${adminSettings.cityZipCode}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- SUB TAB : OUTILS ADV / SOLDE DE TOUT COMPTE ----------------- */}
        {activeSubTab === 'stc' && (
          <div className="space-y-6 text-left animate-fade-in">
            {/* Header intro widget */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-slate-950 shadow-md">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300 font-display">
                  Solde de Tout Compte (STC), Heures Supplémentaires & Avantages (Titres Resto)
                </h3>
              </div>
              <p className="text-slate-300 text-xs font-medium max-w-3xl">
                Outils de conformité avancés spécifiques au <strong className="text-white">Code du Travail Tunisien</strong> pour clore les comptes de départs, rémunérer les heures supplémentaires et rationaliser les investissements de tickets-repas.
              </p>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form setting controls */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <h4 className="text-xs font-black uppercase text-slate-800 border-b pb-2.5 flex items-center justify-between">
                    <span>Paramètres d'Ajustement</span>
                    <span className="text-[9px] bg-slate-100 p-1 rounded font-mono text-slate-600 font-bold">Simulations</span>
                  </h4>

                  {/* STC Employee selection */}
                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-extrabold text-slate-655">Salarié Concerné</label>
                    <select
                      value={stcEmployeeId}
                      onChange={e => setStcEmployeeId(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-bold"
                    >
                      <option value="">-- Choisir un collaborateur --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} (Salaire: {(emp.baseSalary || 1800).toFixed(3)} DT)</option>
                      ))}
                    </select>
                  </div>

                  {/* Manual salary adjustment overrides */}
                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-extrabold text-slate-655 flex justify-between">
                      <span>Rémunération de Référence (DT)</span>
                      <span className="font-mono text-indigo-650 font-bold">{overtimeBaseSalary.toFixed(3)} DT</span>
                    </label>
                    <input
                      type="number"
                      value={overtimeBaseSalary}
                      onChange={e => setOvertimeBaseSalary(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 font-bold"
                    />
                  </div>

                  {/* HEURES SUPPLEMENTAIRES */}
                  <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 bg-slate-50/50">
                    <span className="text-[9.5px] font-black font-mono uppercase bg-indigo-50 text-indigo-700 p-1 px-2 rounded">
                      Heures Supplémentaires (Mensuel)
                    </span>
                    
                    <div className="grid grid-cols-2 gap-3 pt-1.5 font-mono">
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-500 font-bold font-sans">Heures à 125%</label>
                        <input
                          type="number"
                          min="0"
                          value={overtimeH25}
                          onChange={e => setOvertimeH25(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs p-2 border rounded-lg focus:outline-none font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-500 font-bold font-sans">Heures à 150%</label>
                        <input
                          type="number"
                          min="0"
                          value={overtimeH50}
                          onChange={e => setOvertimeH50(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs p-2 border rounded-lg focus:outline-none font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-500 font-bold font-sans">Heures à 175%</label>
                        <input
                          type="number"
                          min="0"
                          value={overtimeH75}
                          onChange={e => setOvertimeH75(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs p-2 border rounded-lg focus:outline-none font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-slate-500 font-bold font-sans">Heures à 200%</label>
                        <input
                          type="number"
                          min="0"
                          value={overtimeH100}
                          onChange={e => setOvertimeH100(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs p-2 border rounded-lg focus:outline-none font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SOLDE DE TOUT COMPTE */}
                  <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 bg-rose-50/10">
                    <span className="text-[9.5px] font-black font-mono uppercase bg-rose-50 text-rose-700 p-1 px-2 rounded">
                      Rupture de Contrat (Solde STC)
                    </span>
                    
                    {/* Reason */}
                    <div className="space-y-1 pt-1.5">
                      <label className="block text-[10.5px] font-extrabold text-slate-655">Motif de Clôture</label>
                      <select
                        value={stcReason}
                        onChange={e => setStcReason(e.target.value as any)}
                        className="w-full text-xs p-2.5 border rounded-lg bg-white font-bold text-slate-800"
                      >
                        <option value="Licenciement">Licenciement (Art. 22 Code du Travail)</option>
                        <option value="Demission">Démission volontaire</option>
                        <option value="FinContrat">Fin de CDD réglementaire</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Notice */}
                      <div className="space-y-1 font-mono">
                        <label className="block text-[9.5px] font-bold text-slate-500 font-sans">Préavis Dû (Jours)</label>
                        <input
                          type="number"
                          min="0"
                          value={stcPreavisDays}
                          onChange={e => setStcPreavisDays(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs p-2 border rounded-lg font-bold text-slate-800"
                        />
                      </div>

                      {/* Leaves remaining */}
                      <div className="space-y-1 font-mono">
                        <label className="block text-[9.5px] font-bold text-slate-500 font-sans">Congés payés résiduels</label>
                        <input
                          type="number"
                          min="0"
                          value={stcCongesRestants}
                          onChange={e => setStcCongesRestants(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs p-2 border rounded-lg font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Seniority for Severance (in months) */}
                    {stcReason === 'Licenciement' && (
                      <div className="space-y-1 pt-1">
                        <label className="block text-[9.5px] font-extrabold text-slate-655 flex justify-between">
                          <span>Ancienneté Consolidée</span>
                          <span className="font-mono text-rose-700 font-extrabold">{stcCustomSeniority} mois</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="120"
                          value={stcCustomSeniority}
                          onChange={e => setStcCustomSeniority(Number(e.target.value))}
                          className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-650"
                        />
                        <p className="text-[8.5px] text-slate-400 font-semibold leading-relaxed font-sans">
                          1 jour par mois de travail effectif, avec un plafond réglementaire de 3 mois (90 jours).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* TICKETS RESTAURANT */}
                  <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 bg-emerald-50/10">
                    <span className="text-[9.5px] font-black font-mono uppercase bg-emerald-50 text-emerald-700 p-1 px-2 rounded">
                      Tickets Restaurants d'Établissement
                    </span>
                    
                    <div className="grid grid-cols-3 gap-2 pt-1.5 font-mono">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-semibold text-slate-500 font-sans font-sans">Vouchers</label>
                        <input
                          type="number"
                          min="0"
                          value={mealTicketCount}
                          onChange={e => setMealTicketCount(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs p-1.5 border rounded-lg font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-semibold text-slate-500 font-sans font-sans">Valeur (DT)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={mealTicketValue}
                          onChange={e => setMealTicketValue(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs p-1.5 border rounded-lg font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-semibold text-slate-500 font-sans font-sans">Part Pat. (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={mealTicketEmployerShare}
                          onChange={e => setMealTicketEmployerShare(Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-full text-xs p-1.5 border rounded-lg font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Display Calculations Outcome */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. STC Final Outcome Card */}
                <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs font-medium">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Briefcase className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-black uppercase text-slate-800">
                      Rapport Fiscal - Indemnités de Solde de Tout Compte (STC)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Item A */}
                    <div className="border border-slate-100 p-3 rounded-xl bg-slate-50 text-left leading-tight">
                      <p className="text-[9.5px] font-bold text-slate-400 font-sans">Congés non-pris</p>
                      <p className="text-sm font-black font-mono text-slate-800 mt-1">{stcCalculations.leaveCompensation.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</p>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">{stcCongesRestants} jours restants, calcule de diviseur commercial 26.</p>
                    </div>

                    {/* Item B */}
                    <div className="border border-slate-100 p-3 rounded-xl bg-slate-50 text-left leading-tight">
                      <p className="text-[9.5px] font-bold text-slate-400 font-sans">Indemnité de Préavis</p>
                      <p className="text-sm font-black font-mono text-slate-800 mt-1">{stcCalculations.preavisCompensation.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</p>
                      <p className="text-[9px] text-slate-400 mt-1 font-semibold">{stcPreavisDays} jours de dédommagement base 30.</p>
                    </div>

                    {/* Item C */}
                    <div className="border border-slate-100 p-3 rounded-xl bg-slate-50 text-left leading-tight">
                      <p className="text-[9.5px] font-bold text-slate-400 font-sans">Indemnité d'Ancienneté</p>
                      <p className="text-sm font-black font-mono text-rose-600 mt-1">{stcCalculations.severanceCompensation.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT</p>
                      {stcReason === 'Licenciement' ? (
                        <p className="text-[9px] text-slate-400 mt-1 font-semibold">{Math.min(90, stcCustomSeniority)} jours d'ancienneté reconnus.</p>
                      ) : (
                        <p className="text-[9px] text-slate-400 mt-1 italic font-semibold">Inapplicable pour CDD / Démission.</p>
                      )}
                    </div>
                  </div>

                  {/* Total STC gross value block */}
                  <div className="border-t border-slate-150 pt-4 flex flex-col sm:flex-row justify-between items-center bg-slate-50 -mx-5 -mb-5 p-5 shrink-0 rounded-b-2xl">
                    <div className="text-left space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-405 font-sans">NET À PAYER GLOBAL DE LIQUIDATION (STC BRUT)</span>
                      <p className="text-[9px] text-slate-450 font-semibold">Taxes IRPP et cotisation CNSS classiques sont déduites lors d'un calcul définitif de bulletin.</p>
                    </div>
                    
                    <span className="text-xl font-mono font-black text-rose-700 bg-rose-50 border border-rose-150 rounded-lg p-1.5 px-4 block">
                      {stcCalculations.totalStcGross.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                    </span>
                  </div>
                </div>

                {/* 2. Overtime Calculations Table Card */}
                <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs font-medium">
                  <div className="flex items-center gap-2 border-b pb-3 justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-650" />
                      <h4 className="text-xs font-black uppercase text-slate-800">
                        Valorisation des Heures Supplémentaires Réduites
                      </h4>
                    </div>
                    <span className="text-[9.5px] bg-indigo-50 font-mono text-indigo-700 font-bold p-0.5 px-2 rounded">
                      Régime standard 40H (Taux horaire: {stcCalculations.hourlyRate40.toFixed(3)} DT)
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[9px] border-b">
                        <th className="p-2 pl-3">Majoration Réglementaire</th>
                        <th className="p-2 text-center">Nombre d'heures</th>
                        <th className="p-2 text-right">Taux majoré de base (DT)</th>
                        <th className="p-2 text-right pr-3">Versement Brut (DT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 pl-3">Majoration standard de 125%</td>
                        <td className="p-2 text-center font-mono font-bold text-slate-655">{overtimeH25} h</td>
                        <td className="p-2 text-right font-mono">{(stcCalculations.hourlyRate40 * 1.25).toFixed(3)}</td>
                        <td className="p-2 text-right font-mono pr-3">{stcCalculations.h25Pay.toFixed(3)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 pl-3">Majoration normale de 150%</td>
                        <td className="p-2 text-center font-mono font-bold text-slate-655">{overtimeH50} h</td>
                        <td className="p-2 text-right font-mono">{(stcCalculations.hourlyRate40 * 1.50).toFixed(3)}</td>
                        <td className="p-2 text-right font-mono pr-3">{stcCalculations.h50Pay.toFixed(3)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 pl-3">Majoration exceptionnelle de 175%</td>
                        <td className="p-2 text-center font-mono font-bold text-slate-655">{overtimeH75} h</td>
                        <td className="p-2 text-right font-mono">{(stcCalculations.hourlyRate40 * 1.75).toFixed(3)}</td>
                        <td className="p-2 text-right font-mono pr-3">{stcCalculations.h75Pay.toFixed(3)}</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 pl-3">Majoration Jours Fériés / Nuits (+100%)</td>
                        <td className="p-2 text-center font-mono font-bold text-indigo-855">{overtimeH100} h</td>
                        <td className="p-2 text-right font-mono">{(stcCalculations.hourlyRate40 * 2.0).toFixed(3)}</td>
                        <td className="p-2 text-right font-mono pr-3 text-indigo-700">{stcCalculations.h100Pay.toFixed(3)}</td>
                      </tr>
                      <tr className="bg-slate-50 font-black border-t text-slate-900 border-t">
                        <td className="p-2.5 pl-3">Cumulus des heures sup de paie</td>
                        <td className="p-2.5 text-center font-mono text-indigo-650 font-black">{overtimeH25 + overtimeH50 + overtimeH75 + overtimeH100} h</td>
                        <td className="p-2.5 text-right font-mono text-slate-400">—</td>
                        <td className="p-2.5 text-right font-mono pr-3 text-indigo-900 bg-indigo-50/20">{stcCalculations.totalOvertime.toFixed(3)} DT</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. Tickets Restaurant breakdown card */}
                <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4 shadow-3xs font-medium">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black uppercase text-slate-800">
                      Rapport d'Exonérations Fiscales de Titres-Prêts Repas
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border">
                      <p className="text-[9px] font-bold text-slate-405 uppercase tracking-wide">Charge Elyssa S.A. ({mealTicketEmployerShare}%)</p>
                      <p className="text-sm font-black font-mono text-emerald-700 mt-1">{stcCalculations.employerTicketShare.toFixed(3)} DT</p>
                      <p className="text-[8.5px] text-slate-550 border-t pt-1 mt-1 font-semibold leading-normal">Exonéré de charges & d'IRPP.</p>
                    </div>
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border">
                      <p className="text-[9px] font-bold text-slate-405 uppercase tracking-wide">Part Salariale Retenue ({100 - mealTicketEmployerShare}%)</p>
                      <p className="text-sm font-black font-mono text-indigo-950 mt-1">{stcCalculations.employeeTicketShare.toFixed(3)} DT</p>
                      <p className="text-[8.5px] text-slate-550 border-t pt-1 mt-1 font-semibold leading-normal">Retenu direct du bulletin de paie.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-150 flex items-start gap-2 text-[10px] text-slate-705 leading-relaxed font-semibold">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p>
                      <strong>Optimisation Légale Tunisienne :</strong> La part Elyssa de <strong>{stcCalculations.employerTicketShare.toFixed(3)} DT</strong> respecte scrupuleusement le plafond d'exemption tunisien de 6.000 DT d'avantage employeur par repas d'affaire.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 10: SETTINGS */}
        {activeSubTab === 'settings' && (
          <motion.div
            key="payroll-settings-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* CNSS & CSS Rates */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-3xs">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Scale className="w-4 h-4 text-indigo-650" />
                <span>Cotisations Sociales & Solidarité (CNSS / CSS)</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Taux CNSS Salarié (%) :</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cnssEmployeeRate}
                    onChange={(e) => updateCnssEmployee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Taux CNSS Patronal (%) :</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cnssEmployerRate}
                    onChange={(e) => updateCnssEmployer(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Taux Accident de Travail (%) :</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cnssAccidentRate}
                    onChange={(e) => updateCnssAccident(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Taux CSS (Solidarité) (%) :</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cssRate}
                    onChange={(e) => updateCssRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Deductions & Family Abatements */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-3xs">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-650" />
                <span>Abattements pour Situation Familiale (Annuel)</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Chef de Famille (TND) :</label>
                  <input
                    type="number"
                    value={abattementChefFamille}
                    onChange={(e) => updateAbattementChef(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10.5px] font-sans font-extrabold text-slate-500 block">Par Enfant à charge (TND) :</label>
                  <input
                    type="number"
                    value={abattementEnfant}
                    onChange={(e) => updateAbattementEnfant(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">
                Ces abattements diminuent la base imposable annuelle pour le calcul de l'IRPP en Tunisie selon la situation déclarée.
              </p>
            </div>

            {/* Primes list Manager */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-3xs lg:col-span-1">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-indigo-650" />
                <span>Grille & Types de Primes Récurrentes</span>
              </h3>
              <PayrollPrimesConfigCard
                items={primesList}
                onUpdate={updatePrimesList}
              />
            </div>

            {/* Dynamic IRPP brackets manager */}
            <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-3xs lg:col-span-1">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-indigo-650" />
                <span>Barème de l'Impôt sur le Revenu (IRPP)</span>
              </h3>
              <PayrollIRPPBracketsEditor />
            </div>
          </motion.div>
        )}

        {/* SUBTAB: LOCATIONS & WORKPLACES (Dépôts, Succursales & Agences RH) */}
        {activeSubTab === 'locations' && (
          <motion.div
            key="payroll-locations-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                    <Building className="w-4 h-4" />
                    <span>Gestion Centralisée RH & Pointage GPS</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-white">
                    Réseau de Sites, Succursales, Agences & Entrepôts ({companyLocations.length})
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Définissez les lieux de travail et dépôts logistiques de l'entreprise. L'affectation des collaborateurs s'effectue ici et se synchronise automatiquement avec le pointage mobile GPS et le module Stocks.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center">
                    <span className="text-[10px] text-indigo-200 block uppercase font-bold">Collaborateurs</span>
                    <span className="text-lg font-black text-white">{employees.length}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center">
                    <span className="text-[10px] text-indigo-200 block uppercase font-bold">Sites Actifs</span>
                    <span className="text-lg font-black text-emerald-400">{companyLocations.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* LEFT COLUMN: LIST OF SITES */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Liste des Lieux de Travail & Affectation Salariés</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyLocations.map((loc) => {
                    const assignedEmps = employees.filter(e => e.branchId === loc.id || (loc.isMaman && (!e.branchId || e.branchId === 'loc-maman')));
                    const isWH = loc.isWarehouse || loc.id.includes('depot') || loc.id.includes('warehouse') || loc.name.toLowerCase().includes('dépôt') || loc.name.toLowerCase().includes('entrepôt');
                    
                    return (
                      <div key={loc.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className={`p-1 px-2.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                              loc.isMaman 
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                : isWH 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {loc.isMaman ? 'Siège Principal (Mère)' : isWH ? 'Entrepôt / Dépôt' : 'Agence / Succursale'}
                            </span>
                            
                            {!loc.isMaman && (
                              <button
                                onClick={() => {
                                  if (confirm(`Êtes-vous certain de vouloir supprimer le site "${loc.name}" ?`)) {
                                    saveLocations(companyLocations.filter(l => l.id !== loc.id));
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition"
                                title="Supprimer ce site"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-sm mt-3">{loc.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            📍 {loc.address || 'Tunisie'}
                          </p>

                          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                            <div>
                              <span className="text-slate-400 block font-sans text-[9px] uppercase font-bold">Latitude :</span>
                              <span className="font-bold">{loc.lat ? loc.lat.toFixed(6) : '36.806500'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-sans text-[9px] uppercase font-bold">Longitude :</span>
                              <span className="font-bold">{loc.lng ? loc.lng.toFixed(6) : '10.181500'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-semibold text-[11px]">Rayon GPS : <strong className="text-slate-800 font-mono">{loc.radius || 150}m</strong></span>
                            <span className="text-indigo-700 bg-indigo-50 border border-indigo-150 p-1 px-2.5 rounded-lg font-bold text-[11px] flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{assignedEmps.length} salarié(s)</span>
                            </span>
                          </div>

                          {assignedEmps.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {assignedEmps.map(emp => (
                                <span key={emp.id} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                                  {emp.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: ADD NEW SITE */}
              <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs h-fit">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider border-b pb-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Nouveau Lieu de Travail</span>
                </h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Créez un dépôt, une succursale ou une agence. Ce site sera directement disponible pour l'affectation des collaborateurs et la gestion des stocks.
                </p>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom du Site / Agence / Dépôt *</label>
                    <input
                      type="text"
                      id="new-loc-name"
                      placeholder="ex: Dépôt Tunis-Sud Charguia"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type d'Emplacement</label>
                    <select
                      id="new-loc-type"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="agency">Agence / Succursale Commerciale</option>
                      <option value="warehouse">Entrepôt / Dépôt de Stockage</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adresse Physique</label>
                    <input
                      type="text"
                      id="new-loc-address"
                      placeholder="Zone Industrielle Charguia II, Tunis"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>

                  {/* Tunisian Presets */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <span>📍 Raccourcis Tunisiens :</span>
                    </label>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[
                        { name: 'Tunis Charguia', lat: 36.8435, lng: 10.2178, addr: 'Charguia II, Tunis' },
                        { name: 'Sfax Poudrière', lat: 34.7405, lng: 10.7603, addr: 'ZI Poudrière, Sfax' },
                        { name: 'Sousse Sidi A.', lat: 35.8012, lng: 10.6432, addr: 'ZI Sidi Abdelhamid, Sousse' },
                        { name: 'Bizerte Menzel', lat: 37.1535, lng: 9.7821, addr: 'Zone Franche Menzel Bourguiba' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const nameInp = document.getElementById('new-loc-name') as HTMLInputElement;
                            const latInp = document.getElementById('new-loc-lat') as HTMLInputElement;
                            const lngInp = document.getElementById('new-loc-lng') as HTMLInputElement;
                            const addrInp = document.getElementById('new-loc-address') as HTMLInputElement;
                            if (nameInp) nameInp.value = preset.name;
                            if (latInp) latInp.value = preset.lat.toString();
                            if (lngInp) lngInp.value = preset.lng.toString();
                            if (addrInp) addrInp.value = preset.addr;
                          }}
                          className="bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 p-1 px-2 rounded text-[10px] font-semibold transition cursor-pointer"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        id="new-loc-lat"
                        defaultValue="36.8065"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        id="new-loc-lng"
                        defaultValue="10.1815"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Rayon GPS (mètres)</label>
                    <input
                      type="number"
                      id="new-loc-radius"
                      defaultValue="150"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-semibold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nameInp = document.getElementById('new-loc-name') as HTMLInputElement;
                      const typeSel = document.getElementById('new-loc-type') as HTMLSelectElement;
                      const addrInp = document.getElementById('new-loc-address') as HTMLInputElement;
                      const latInp = document.getElementById('new-loc-lat') as HTMLInputElement;
                      const lngInp = document.getElementById('new-loc-lng') as HTMLInputElement;
                      const radiusInp = document.getElementById('new-loc-radius') as HTMLInputElement;

                      if (!nameInp?.value.trim()) {
                        alert('Veuillez spécifier le nom du lieu de travail.');
                        return;
                      }

                      const newLoc = {
                        id: `loc_${Date.now()}`,
                        name: nameInp.value.trim(),
                        address: addrInp?.value.trim() || 'Tunisie',
                        lat: parseFloat(latInp?.value) || 36.8065,
                        lng: parseFloat(lngInp?.value) || 10.1815,
                        radius: parseInt(radiusInp?.value) || 150,
                        isWarehouse: typeSel?.value === 'warehouse'
                      };

                      saveLocations([...companyLocations, newLoc]);
                      alert(`Site "${newLoc.name}" créé avec succès !`);

                      nameInp.value = '';
                      if (addrInp) addrInp.value = '';
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black p-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enregistrer le Site RH</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* MODAL: Add / Edit Employee */}
      <AnimatePresence>
        {isEmployeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEmployeeModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
                    <Users className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {editingEmployee ? "Modifier la Fiche du Salarié" : "Déclarer un Nouveau Salarié"}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="p-1 hover:bg-slate-100 border text-slate-400 rounded-lg hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Matricule (Auto ou Saisi)</label>
                    <input 
                      type="text" 
                      value={empMatricule}
                      onChange={e => setEmpMatricule(e.target.value)}
                      placeholder="Vide pour auto-générer"
                      className="w-full text-xs p-2.5 border rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-indigo-50/20 text-indigo-950 border-indigo-150"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nom complet *</label>
                    <input 
                      type="text" 
                      required
                      value={empName}
                      onChange={e => setEmpName(e.target.value)}
                      placeholder="Ex: Khaled Ben Amor"
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Adresse E-mail professionnelle</label>
                    <input 
                      type="email" 
                      value={empEmail}
                      onChange={e => setEmpEmail(e.target.value)}
                      placeholder="k.benamor@carthage.com.tn"
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Intitulé du Poste / Rôle *</label>
                    <input 
                      type="text" 
                      required
                      value={empJob}
                      onChange={e => setEmpJob(e.target.value)}
                      placeholder="Directeur Financier"
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Numéro d'immatriculation CNSS (SSN) *</label>
                    <input 
                      type="text" 
                      required
                      value={empSsn}
                      onChange={e => setEmpSsn(e.target.value)}
                      placeholder="Ex: 14839211-92"
                      className="w-full text-xs p-2.5 border rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">RIB Bancaire (Clé à 20 chiffres) *</label>
                    <input 
                      type="text" 
                      required
                      value={empRib}
                      onChange={e => setEmpRib(e.target.value)}
                      placeholder="Ex: 03001010015920038472"
                      className="w-full text-xs p-2.5 border rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Numéro de C.I.N ou Passeport</label>
                    <input 
                      type="text" 
                      value={empCin}
                      onChange={e => setEmpCin(e.target.value)}
                      placeholder="Ex: 14839322"
                      className="w-full text-xs p-2.5 border rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Remuneration elements */}
                <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                  <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-widest block border-b pb-1">Rémunération & Barème Elyssa</span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Salaire de Base *</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.001"
                        value={empBaseSalary}
                        onChange={e => setEmpBaseSalary(Number(e.target.value))}
                        className="w-full text-xs p-2 border rounded-lg font-mono text-right font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Indem. Transport</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.001"
                        value={empTransport}
                        onChange={e => setEmpTransport(Number(e.target.value))}
                        className="w-full text-xs p-2 border rounded-lg font-mono text-right text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Indem. Présence</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.001"
                        value={empPresence}
                        onChange={e => setEmpPresence(Number(e.target.value))}
                        className="w-full text-xs p-2 border rounded-lg font-mono text-right text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Autres Primes</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.001"
                        value={empOther}
                        onChange={e => setEmpOther(Number(e.target.value))}
                        className="w-full text-xs p-2 border rounded-lg font-mono text-right text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="text-[9.5px] text-slate-400 font-medium italic">Le cumul des indemnités constitue la part de primes de l'employé sujette à CNSS.</div>
                </div>

                 {/* Situation Familiale & Affectation */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Situation Familiale *</label>
                    <select 
                      value={empSituation}
                      onChange={e => setEmpSituation(e.target.value as any)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:outline-none"
                    >
                      <option value="Single">Célibataire</option>
                      <option value="Married_0">Marié(e) sans enfants</option>
                      <option value="Married_1">Marié(e) + 1 enfant à charge</option>
                      <option value="Married_2">Marié(e) + 2 enfants à charge</option>
                      <option value="Married_3">Marié(e) + 3 enfants à charge</option>
                      <option value="Married_4_Plus">Marié(e) + 4 enfants ou plus</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Établissement d'Affectation *</label>
                    <select 
                      value={empBranchId}
                      onChange={e => setEmpBranchId(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:outline-none font-sans font-bold text-slate-700"
                    >
                      {companyLocations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          🏢 {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center pt-5">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={empChef}
                        onChange={e => setEmpChef(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 pointer-events-auto"
                      />
                      <span>Chef de Famille</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Date d'Embauche</label>
                    <input 
                      type="date" 
                      value={empHiringDate}
                      onChange={e => setEmpHiringDate(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEmployeeModalOpen(false)}
                    className="p-2 px-4 border rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="p-2 px-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Enregistrer la Fiche
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Add Absence */}
      <AnimatePresence>
        {isAbsenceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAbsenceModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Enregistrer une Absence / Arrêt Maladie</h4>
                    <p className="text-[10px] text-slate-400">Registre du personnel Elyssa S.A.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAbsenceModalOpen(false)}
                  className="p-1 px-2.5 rounded-lg border text-xs text-slate-450 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddAbsence} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sélectionner le collaborateur *</label>
                  <select
                    value={absEmployeeId}
                    onChange={e => {
                      setAbsEmployeeId(e.target.value);
                      const selectedEmp = employees.find(emp => emp.id === e.target.value);
                      if (selectedEmp) {
                        const sug = Math.round((selectedEmp.baseSalary / 26) * 1000) / 1000;
                        setAbsDeductionAmount(sug);
                      }
                    }}
                    required
                    className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="" disabled>-- Choisir un salarié --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.jobTitle})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Type d&apos;Évènement *</label>
                    <select
                      value={absType}
                      onChange={e => {
                        const t = e.target.value as any;
                        setAbsType(t);
                        const isDed = t === 'UnpaidAbsence' || t === 'SickLeave';
                        setAbsDeductible(isDed);
                        if (!isDed) {
                          setAbsDeductionAmount(0);
                        } else {
                          const selectedEmp = employees.find(emp => emp.id === absEmployeeId);
                          if (selectedEmp) {
                            const sug = Math.round((selectedEmp.baseSalary / 26) * 1000) / 1000;
                            setAbsDeductionAmount(sug);
                          }
                        }
                      }}
                      required
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="PaidLeave">Congé Payé</option>
                      <option value="UnpaidAbsence">Absence Non Payée</option>
                      <option value="SickLeave">Arrêt Maladie</option>
                      <option value="WorkAccident">Accident de Travail</option>
                      <option value="Maternity">Congé de Maternité</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-650 mb-1 font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                      Retenue Salaire ?
                    </label>
                    <div className="flex items-center space-x-3 mt-2">
                      <input 
                        type="checkbox" 
                        id="absDeductible"
                        checked={absDeductible}
                        onChange={e => {
                          setAbsDeductible(e.target.checked);
                          if (!e.target.checked) setAbsDeductionAmount(0);
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="absDeductible" className="text-xs text-slate-600 font-bold shrink-0 cursor-pointer">
                        Activer la retenue
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Date Début *</label>
                    <input 
                      type="date" 
                      required
                      value={absStartDate}
                      onChange={e => setAbsStartDate(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Date Fin *</label>
                    <input 
                      type="date" 
                      required
                      value={absEndDate}
                      onChange={e => setAbsEndDate(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {absDeductible && (
                  <div className="p-3 bg-red-40/40 border border-red-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-red-800">Montant Retenue à opérer (TND)</label>
                      {(() => {
                        const emp = employees.find(e => e.id === absEmployeeId);
                        if (!emp) return null;
                        const start = new Date(absStartDate);
                        const end = new Date(absEndDate);
                        if (end >= start) {
                          const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          const sug = Math.round(((emp.baseSalary / 26) * days) * 1000) / 1000;
                          return (
                            <button
                              type="button"
                              onClick={() => setAbsDeductionAmount(sug)}
                              className="text-[10px] bg-red-100 text-red-800 p-1 px-2 rounded-md font-mono hover:bg-red-250 transition cursor-pointer"
                              title="Applique la formule légale tunisienne : (Base / 26) * Jours d'absence"
                            >
                              Appliquer suggestion : {sug.toFixed(3)} TND ({days} jrs)
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <input 
                      type="number" 
                      step="0.001"
                      required
                      min="0"
                      value={absDeductionAmount === 0 ? '' : absDeductionAmount}
                      onChange={e => setAbsDeductionAmount(Number(e.target.value))}
                      placeholder="Ex: 120.000"
                      className="w-full text-xs p-2.5 border border-red-200 bg-white rounded-lg focus:ring-1 focus:ring-red-500 focus:outline-none font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Motif médical / Description administrative</label>
                  <textarea
                    rows={2}
                    value={absDescription}
                    onChange={e => setAbsDescription(e.target.value)}
                    placeholder="Ex: Certificat médical de repos de 3 jours visé par le médecin ..."
                    className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 border-t flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAbsenceModalOpen(false)}
                    className="p-2.5 px-4 border rounded-xl text-xs text-slate-550 hover:bg-slate-100 font-bold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="p-2.5 px-6 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Enregistrer au registre
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Generate Payslip Step tool */}
      <AnimatePresence>
        {isPayslipModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayslipModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="p-5 border-b flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
                    <Calculator className="w-4 h-4 animate-pulse" />
                  </span>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    Calculateur Intuitif de Fiche
                  </h3>
                </div>
                <button 
                  onClick={() => setIsPayslipModalOpen(false)}
                  className="p-1 hover:bg-slate-100 border text-slate-400 rounded-lg hover:text-slate-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGeneratePayslip} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sélectionner un Collaborateur de Elyssa *</label>
                  <select
                    value={psEmployeeId}
                    onChange={e => setPsEmployeeId(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-lg bg-indigo-50/20 font-bold focus:outline-none"
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.jobTitle})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Mois Civil</label>
                    <select
                      value={psMonth}
                      onChange={e => setPsMonth(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg"
                    >
                      <option value="01">Janvier</option>
                      <option value="02">Février</option>
                      <option value="03">Mars</option>
                      <option value="04">Avril</option>
                      <option value="05">Mai</option>
                      <option value="06">Juin</option>
                      <option value="07">Juillet</option>
                      <option value="08">Août</option>
                      <option value="09">Septembre</option>
                      <option value="10">Octobre</option>
                      <option value="11">Novembre</option>
                      <option value="12">Décembre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Année</label>
                    <input 
                      type="number" 
                      min="2020" 
                      max="2035"
                      value={psYear}
                      onChange={e => setPsYear(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg font-mono text-center font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border rounded-xl space-y-3">
                  <span className="text-[9.5px] text-slate-450 font-extrabold uppercase block border-b pb-1">Option de Règlement Direct</span>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Canal de Transfert *</label>
                      <select
                        value={psPaymentMethod}
                        onChange={e => setPsPaymentMethod(e.target.value as any)}
                        className="w-full text-xs p-2 border rounded-lg font-semibold focus:outline-none"
                      >
                        <option value="Virement">Virement bancaire direct</option>
                        <option value="Cheque">Chèque bancaire</option>
                        <option value="Especes">Caisse espèces Elyssa S.A.</option>
                      </select>
                    </div>

                    {psPaymentMethod !== 'Especes' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Compte Elyssa d'origine *</label>
                        <select
                          value={psBankAccountId}
                          onChange={e => setPsBankAccountId(e.target.value)}
                          className="w-full text-xs p-2 border rounded-lg font-mono font-bold text-indigo-750 focus:outline-none"
                        >
                          {bankAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.bankName} ({(acc.currency || 'TND')}) — {acc.currentBalance.toFixed(3)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsPayslipModalOpen(false)}
                    className="p-2 px-4 border rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    className="p-2 px-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Générer le Bulletin</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Generate / Draft Work Contract */}
      <AnimatePresence>
        {isContractModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContractModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
                    <PenTool className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Rédiger un nouveau Contrat de Travail</h4>
                    <p className="text-[10px] text-slate-400">Réglementation tunisienne & Elyssa S.A.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsContractModalOpen(false)}
                  className="p-1 px-2.5 rounded-lg border text-xs text-slate-450 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddContract} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Collaborateur concerné *</label>
                  <select
                    value={contractEmployeeId}
                    onChange={e => {
                      setContractEmployeeId(e.target.value);
                      const selectedEmp = employees.find(emp => emp.id === e.target.value);
                      if (selectedEmp) {
                        setContractBaseSalary(selectedEmp.baseSalary);
                        setContractDuties(`Assurer les responsabilités et attributions du poste de ${selectedEmp.jobTitle} conformément à la charte et aux engagements de la société Tunisienne Elyssa S.A.`);
                      }
                    }}
                    required
                    className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="" disabled>-- Choisir un salarié --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.jobTitle})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Cadre Contractuel *</label>
                    <select
                      value={contractType}
                      onChange={e => {
                        const type = e.target.value as any;
                        setContractType(type);
                        if (type === 'CIVP') {
                          setContractTrialPeriod(1);
                        } else if (type === 'CDD') {
                          setContractTrialPeriod(2);
                        } else {
                          setContractTrialPeriod(3);
                        }
                      }}
                      required
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="CDI">CDI (Durée indéterminée)</option>
                      <option value="CDD">CDD (Durée déterminée)</option>
                      <option value="CIVP">CIVP / Stage (Ex-SIVP)</option>
                      <option value="Karama">Contrat Karama - ANETI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Période d&apos;essai (Mois) *</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="12"
                      required
                      value={contractTrialPeriod}
                      onChange={e => setContractTrialPeriod(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Date d&apos;Effet / Prise de poste *</label>
                    <input 
                      type="date" 
                      required
                      value={contractStartDate}
                      onChange={e => setContractStartDate(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  {(contractType === 'CDD' || contractType === 'CIVP') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-650 mb-1 text-indigo-755 bg-indigo-50 px-1 py-0.5 rounded w-fit">
                        Date d&apos;Échéance / Fin *
                      </label>
                      <input 
                        type="date" 
                        required={contractType === 'CDD' || contractType === 'CIVP'}
                        value={contractEndDate}
                        onChange={e => setContractEndDate(e.target.value)}
                        className="w-full text-xs p-2.5 border border-indigo-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Rémunération de base (TND / Mois) *</label>
                    <input 
                      type="number" 
                      step="0.001"
                      required
                      value={contractBaseSalary}
                      onChange={e => setContractBaseSalary(Number(e.target.value))}
                      placeholder="Ex: 1200.000"
                      className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] text-slate-400 font-sans italic mt-1 leading-normal">
                      Note: Ce montant correspond au salaire de base devant figurer dans l&apos;Article de rémunération légale.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Missions, responsabilités & attributions clés</label>
                  <textarea
                    rows={3}
                    value={contractDuties}
                    onChange={e => setContractDuties(e.target.value)}
                    placeholder="Saisissez des détails spécifiques sur les attributions du poste..."
                    className="w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 border-t flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsContractModalOpen(false)}
                    className="p-2.5 px-4 border rounded-xl text-xs text-slate-550 hover:bg-slate-100 font-bold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="p-2.5 px-6 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Générer & Sauvegarder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PayrollPrimesConfigCard({
  items,
  onUpdate
}: {
  items: string[];
  onUpdate: (list: string[]) => void;
}) {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Ex: Prime de rendement, Prime de fin d'année..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800"
        />
        <button
          onClick={() => {
            if (val.trim() && !items.includes(val.trim())) {
              onUpdate([...items, val.trim()]);
              setVal('');
            }
          }}
          className="bg-indigo-650 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-black transition-colors shrink-0 cursor-pointer"
        >
          Ajouter
        </button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-150 rounded-lg text-xs font-bold text-slate-700">
            <span>{item}</span>
            <button
              onClick={() => {
                if (items.length > 1) {
                  onUpdate(items.filter(i => i !== item));
                } else {
                  alert("Au moins un type de prime doit rester configuré.");
                }
              }}
              className="text-slate-400 hover:text-red-655 p-1 rounded transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayrollIRPPBracketsEditor() {
  const [brackets, setBrackets] = useState<{ limit: number; rate: number }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('carthage_payroll_settings_irpp_brackets');
    if (saved) {
      setBrackets(JSON.parse(saved));
    } else {
      const defaultBrackets = [
        { limit: 5000, rate: 0 },
        { limit: 20000, rate: 0.26 },
        { limit: 30000, rate: 0.28 },
        { limit: 50000, rate: 0.32 },
        { limit: 999999999, rate: 0.35 }
      ];
      setBrackets(defaultBrackets);
    }
  }, []);

  const saveBrackets = (newBrackets: { limit: number; rate: number }[]) => {
    const sorted = [...newBrackets].sort((a, b) => a.limit - b.limit);
    setBrackets(sorted);
    localStorage.setItem('carthage_payroll_settings_irpp_brackets', JSON.stringify(sorted));
  };

  const handleUpdateBracket = (index: number, field: 'limit' | 'rate', value: number) => {
    const updated = brackets.map((b, i) => {
      if (i === index) {
        return { ...b, [field]: value };
      }
      return b;
    });
    saveBrackets(updated);
  };

  const handleAddBracket = () => {
    const updated = [...brackets, { limit: 100000, rate: 0.38 }];
    saveBrackets(updated);
  };

  const handleRemoveBracket = (index: number) => {
    if (brackets.length > 1) {
      const updated = brackets.filter((_, i) => i !== index);
      saveBrackets(updated);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {brackets.map((b, index) => (
          <div key={index} className="flex items-center space-x-2 bg-slate-50 p-2 border border-slate-150 rounded-lg text-xs font-bold text-slate-700">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-sans">Limite:</span>
                <input
                  type="number"
                  value={b.limit === 999999999 ? '' : b.limit}
                  placeholder="Max / Infini"
                  onChange={(e) => handleUpdateBracket(index, 'limit', e.target.value === '' ? 999999999 : Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono font-bold text-slate-800"
                />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-sans">Taux:</span>
                <input
                  type="number"
                  step="0.01"
                  value={b.rate}
                  onChange={(e) => handleUpdateBracket(index, 'rate', Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded p-1 font-mono font-bold text-slate-800"
                />
              </div>
            </div>
            <button
              onClick={() => handleRemoveBracket(index)}
              className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer shrink-0"
              title="Supprimer cette tranche"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddBracket}
        className="w-full border border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/20 text-indigo-700 p-2 rounded-lg text-xs font-black transition-colors cursor-pointer"
      >
        + Ajouter une tranche d'impôt
      </button>
    </div>
  );
}
