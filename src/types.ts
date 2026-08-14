/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CommercialEngagement {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'Pending' | 'Met' | 'Delayed';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: 'Local' | 'Export';
  sector: string;
  revenuePotential: number; // in TND
  engagements: CommercialEngagement[];
  status: 'Active' | 'Inactive';
  notes: string;
  createdDate: string;
}

export type ComplaintStatus = 'Received' | 'In_Investigation' | 'Resolved' | 'Declined';
export type Department = 'Quality' | 'Logistics' | 'Production' | 'Sales' | 'Finance';

export interface Complaint {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  priority: 'Low' | 'Medium' | 'High';
  assignedDepartment: Department;
  investigationDetails?: string;
  resolutionNotes?: string;
  createdDate: string;
  resolvedDate?: string;
}

export type InvoiceStatus = 'Draft' | 'Unpaid' | 'Paid' | 'Debt_Collection';

export interface RecouvrementStep {
  id: string;
  date: string;
  type: 'Email' | 'Call' | 'Letter' | 'Legal';
  note: string;
  performedBy: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  amountHT: number; // Hors Taxe in TND
  vatRate: number; // TVA e.g., 7, 13, 19 %
  vatAmount: number; // Calculated
  withholdingTaxRate: number; // Retenue à la source (RS) e.g. 1.5, 15 %
  withholdingAmount: number; // Calculated
  amountNetToPay: number; // Amount to pay to company = HT + TVA - RS
  amountTTC: number; // Standard invoice amount = HT + TVA
  status: InvoiceStatus;
  delivery_status?: 'non_requis' | 'en_attente' | 'en_transit' | 'livre';
  delivery_address?: string;
  sales_channel?: 'web' | 'pos' | 'field_sales';
  warehouse_location?: string;
  warehouses_involved?: string[];
  multi_depot_tag?: string;
  is_demo?: boolean;
  issuedDate: string;
  dueDate: string;
  collectedAmount?: number;
  recouvrementSteps: RecouvrementStep[];
  withholdingCertificateReceived: boolean;
  items?: any[];
  seller_id?: string;
  seller_name?: string;
  commercial_id?: string;
  commercial_name?: string;
}

export interface VisitReport {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  purpose: string;
  summary: string;
  actionPoints: string[];
  aiAnalyzed: boolean;
  aiInsights?: string;
  author: string;
}

export interface CompetitorReport {
  id: string;
  competitorName: string;
  sectorName: string;
  strengths: string[];
  weaknesses: string[];
  pricingIndex: 'Cheap' | 'Competitive' | 'Premium';
  marketShare: number; // e.g., 25%
  strategicWatchNote: string;
  recordedDate: string;
}

export interface AdminSettings {
  companyName: string;
  currency: string;             // Always "TND" as requested but configurable
  defaultVatRate: number;        // e.g. 19
  defaultWithholdingRate: number; // e.g. 1.5
  withholdingThreshold: number;   // E.g., apply 1.5% RS only above 1000 TND in Tunisian tax code
  authorizedUsers: string[];
  companyLogo?: string;          // base64 SVG or PNG string of the logo
  companyAddress?: string;       // Tunisian business address
  companyPhone?: string;         // e.g., +216 71 888 999
  companyEmail?: string;         // corporate mail
  companyMF?: string;            // Matricule Fiscal e.g., 1234567/A/M/000
  geminiApiKey?: string;         // optional client personal Gemini API Key
  googleAnalyticsId?: string;    // e.g. G-XXXXXXX
  googleAdsId?: string;          // e.g. AW-XXXXXXX
  robotsTxt?: string;            // custom robots.txt content
  sitemapXml?: string;           // custom sitemap.xml URLs
  seoTitle?: string;             // Home meta title
  seoDescription?: string;       // Home meta description
  seoKeywords?: string;          // Meta keywords
  ogImage?: string;              // OpenGraph sharing thumbnail image
  
  // Legal settings
  legalForm?: string;            // ex: Société Anonyme, SARL
  shareCapital?: number;         // Capital Social (Montant numérique)
  rneNumber?: string;            // Numéro RNE (Registre National des Entreprises)
  legalRepresentative?: string;  // Gérant / Représentant Légal
  cityZipCode?: string;          // Ville & Code Postal
  website?: string;              // Site Web
}

export interface WeeklyReport {
  id: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  activitiesCompleted: string[];
  pendingActions: string[];
  marketInsights: string;
  revenueCollected: number;
  newInvoicesCount: number;
  complaintsResolved: number;
  aiGeneratedReport?: string;
  createdDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  category: string; // e.g. "Matériaux", "Chimie", "Emballage", "Logistique"
  status: 'Active' | 'Inactive';
  createdDate: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string; // e.g. "Matières Premières", "Produits Finis", "Emballages", "Pièces"
  stockLevel: number;
  minStockLevel: number; // Alerts when stockLevel <= minStockLevel
  unitPrice: number; // TND
  costPrice: number; // TND
  marginPercentage?: number; // % Profit margin (optional, default to calculated if not set)
  supplierId: string; // Linked supplier
  supplierName: string;
  unit: string; // e.g. "Kg", "Litre", "Pièce", "Tonne"
  createdDate: string;
  warehouseId?: string;
  aisle?: string; // Rayon
  shelf?: string; // Étagère
  bin?: string;   // Casier / Emplacement
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'In' | 'Out' | 'Correction';
  quantity: number;
  date: string;
  reference: string; // Invoice ID, Supplier PO, physical check
  operator: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  isEnabled: boolean;
  provider?: 'smtp' | 'resend';
  resendApiKey?: string;
}

export interface ImapSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  isEnabled: boolean;
}

export interface IncomingEmail {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  category: 'invoice' | 'complaint' | 'general' | 'sales' | 'support';
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // supports placeholders like {{clientName}}, {{invoiceNumber}}, {{amountTTC}}, {{dueDate}}
}

export interface CommunicationLog {
  id: string;
  recipientName: string;
  recipientEmail: string;
  templateType: string; // 'invoice' | 'collection_lvl1' | 'collection_lvl2' | 'manual'
  subject: string;
  body: string;
  sentDate: string;
  status: 'Sent' | 'Failed' | 'Simulated';
  referenceId?: string; // invoiceNumber or clientId
  errorMessage?: string;
}

export interface CollaboratorTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In_Progress' | 'Completed';
  createdDate: string;
}

export interface CollaboratorAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Agent' | 'Manager' | 'Viewer' | 'Director';
  status: 'Invited' | 'Active' | 'Suspended';
  assignedTasks: CollaboratorTask[];
  createdDate: string;
  company?: string;
  company_id?: string;
  companyId?: string;
  assignedModules?: string[];
  pinCode?: string;
  plainPassword?: string;
  structureType?: 'Direction' | 'Service' | 'Agence' | 'Succursale' | 'Entrepôt' | 'Usine';
  structureName?: string;
  matricule?: string;
  jobTitle?: string;
  phone?: string;
}

export interface UserSession {
  email: string;
  name: string;
  role: 'SuperAdmin' | 'Manager' | 'Agent' | 'Viewer' | 'Director';
  id: string;
  companyName?: string;
  companyId?: string;
}

export interface BankAccount {
  id: string;
  bankName: string; // e.g., "BIAT", "UIB", "Attijari Bank", "Caisse Principale (Espèces)"
  accountNumber: string; // e.g., "RIB IBAN" or "CAISSE-01"
  type: 'Checking' | 'Savings' | 'CashBox' | 'Other';
  initialBalance: number; // in TND
  currentBalance: number; // calculated: initial + sum(In) - sum(Out)
  currency: string; // "TND"
  status: 'Active' | 'Suspended';
}

export type TransactionMethod = 'Cheque' | 'Traite' | 'Especes' | 'Virement' | 'Prelevement' | 'Autre';

export interface BankTransaction {
  id: string;
  accountId: string; // Linked bank account
  accountName: string; // denormalized for view speed
  date: string; // "YYYY-MM-DD"
  type: 'In' | 'Out';
  amount: number; // TND
  method: TransactionMethod;
  reference: string; // Cheque number, Bill number, Traite Ref, etc.
  dueDate?: string; // Maturity date for Traites or post-dated Cheques
  beneficiaryOrIssuer: string; // Customer, supplier, public Treasury, employee...
  category: 'Vente' | 'Achat Fournisseur' | 'Salaire' | 'Loyer' | 'Impôts & Taxes' | 'Frais Bancaires' | 'Dividendes' | 'Retrait/Dépôt' | 'Autre';
  description: string;
  status: 'Cleared' | 'Pending' | 'Bounced'; // cleared immediately for cash, pending/cleared for cheq/traite
}

export interface TaxDeclaration {
  id: string;
  year: number;
  period: 'M01'|'M02'|'M03'|'M04'|'M05'|'M06'|'M07'|'M08'|'M09'|'M10'|'M11'|'M12' | 'Q1'|'Q2'|'Q3'|'Q4' | 'Yearly';
  periodLabel: string; // e.g., "Janvier 2026", "T1 2026"
  tvaCollected: number; // TVA collectée sur ventes
  tvaDeductible: number; // TVA déductible sur achats/charges
  tvaDue: number; // net TVA à payer (or credit if negative)
  withholdingPaid: number; // Retenues subies (par nos clients, récupérables)
  withholdingCollected: number; // Retenues effectuées (sur nos fournisseurs, à reverser)
  corporateTaxEstimate: number; // Estimation de l'impôt sur les sociétés (IS)
  status: 'Draft' | 'Validated' | 'Paid';
  filedDate?: string;
  totalAmountPaid: number; // Amount paid in TND
}

export interface YearEndClosing {
  id: string;
  year: number;
  closingDate: string;
  closedBy: string;
  revenues: number; // Total revenue (HT)
  expenses: number; // Total charges (HT)
  ebitda: number; // Gross operating profit
  corporateTax: number; // Computed tax (e.g. 15% rate on profit)
  netIncome: number; // Revenues - Expenses - Tax
  status: 'Draft' | 'Closed' | 'Archived';
  notes: string;
  isLocked: boolean; // Locks editing in that fiscal year
}

export interface Employee {
  id: string;
  matricule?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: string;
  jobTitle: string;
  ssn?: string; // CNSS registration number
  cnssNumber?: string;
  rib?: string; // Bank account details (RIB)
  cin?: string; // C.I.N or Passport number
  nationalId?: string;
  birthDate?: string;
  baseSalary: number; // in TND
  transportAllowance?: number; // in TND
  presenceAllowance?: number; // in TND
  otherAllowances?: number; // in TND (prime de rendement, etc.)
  familySituation?: 'Single' | 'Married_0' | 'Married_1' | 'Married_2' | 'Married_3' | 'Married_4_Plus';
  isChefDeFamille?: boolean;
  status: 'Active' | 'OnLeave' | 'Terminated';
  hiringDate?: string;
  hireDate?: string;
  branchId?: string; // Pointing to CompanyLocation id
  department?: string;
  company?: string;
  company_id?: string;
  companyId?: string;
  contractType?: string;
  assigned_module?: string;
}

export interface CompanyLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  isMaman?: boolean; // True if it's the headquarters (Connexion Mère)
}

export interface TripartiteWeightingConfig {
  weight_entreprise: number; // e.g. 70
  weight_direction: number;  // e.g. 20
  weight_personnel: number;  // e.g. 10
  company_achievement_rate?: number; // e.g. 90
}

export interface TripartiteBreakdown {
  weight_entreprise: number;
  rate_entreprise: number;
  prime_entreprise: number;

  weight_direction: number;
  rate_direction: number;
  prime_direction: number;

  weight_personnel: number;
  rate_personnel: number;
  prime_personnel: number;

  formula_string?: string;
}

export interface KPIItem {
  id: string;
  title: string;
  weight_percent: number; // e.g. 40
  target_value: number; // Cible à atteindre
  current_value: number; // Valeur réalisée auto-calculée ou saisie manager
  unit?: string; // 'TND', 'Livraisons', 'Clients', '%', 'Bons'
  data_source: 'auto_pos_sales' | 'auto_deliveries' | 'auto_picking' | 'manual_manager';
  notes?: string;
}

export interface PerformanceContract {
  id: string;
  tenantId?: string;
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
  period: 'mensuel' | 'trimestriel' | 'annuel';
  year: number;
  month?: number;
  month_name?: string;
  kpis: KPIItem[];
  prime_target_tnd: number;
  calculated_prime_tnd: number;
  achievement_rate: number; // Global weighted % (0 to 100+)
  tripartite_config?: TripartiteWeightingConfig;
  tripartite_breakdown?: TripartiteBreakdown;
  status: 'brouillon' | 'en_attente_signature' | 'valide_signe' | 'evalue' | 'injecte_paie';
  signed_at?: string;
  injected_in_payroll_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  is_demo?: boolean;
  is_demo_data?: boolean;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // "YYYY-MM"
  baseSalary: number;
  grossSalary: number;
  cnssEmployee: number; // 9.18%
  cnssEmployer: number; // 17.07%
  professionalExpenses: number; // 10% capped
  familyDeduction: number; // based on married/children
  taxableIncome: number; // Assiette de calcul IRPP
  irpp: number; // Impôt retenu
  css: number; // Contribution Sociale Solidaire (1% or constant)
  netSalary: number; // Net à payer
  allowancesPaid: number;
  performancePrime?: number; // Prime de performance MPO/OKR
  performancePrimeNote?: string; // Libellé/Contrat de la prime
  absencesDeduction?: number; // Deducted for unpaid absences/sickness
  absenceDaysTracked?: number; // Total unpaid or sick days in month
  missionReimbursements?: number; // Non-taxable mission expense reimbursements from Fleet & Missions
  missionDetails?: { id: string; destination: string; amount: number }[];
  status: 'Draft' | 'Approved' | 'Paid';
  paidDate?: string;
  paymentMethod: 'Virement' | 'Cheque' | 'Especes';
  bankAccountId?: string;
}

export interface AbsenceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'PaidLeave' | 'UnpaidAbsence' | 'SickLeave' | 'WorkAccident' | 'Maternity';
  startDate: string;
  endDate: string;
  daysCount: number;
  isDeductibleFromSalary: boolean;
  deductionAmount: number; // calculated deduction in TND
  status: 'Requested' | 'Approved' | 'Rejected';
  description: string;
}

export interface WorkContract {
  id: string;
  employeeId: string;
  employeeName: string;
  contractType: 'CDI' | 'CDD' | 'CIVP' | 'Karama';
  startDate: string;
  endDate?: string;
  trialPeriodMonths: number;
  baseSalary: number;
  status: 'Draft' | 'Signed' | 'Terminated';
  dutiesDescription: string;
  generatedAt: string;
  signedAt?: string;
}

export interface GedDocument {
  id: string;
  name: string;
  type: 'Invoice' | 'Contract' | 'Report' | 'Other';
  fileSize: string;
  fileType: string;
  base64Data?: string; // used for downloading simulated or uploaded files
  uploadDate: string;
  linkedToType: 'Client' | 'Employee' | 'None';
  linkedToId?: string;
  linkedToName?: string;
  description?: string;
  version: number;
  uploadedBy: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string; // matricule / carte grise
  purchaseDate: string;
  purchasePrice: number;
  status: 'Active' | 'UnderRepair' | 'Sold';
  saleDate?: string;
  salePrice?: number;
  assignedToEmployeeId?: string; // ID collaborateur affecté (MOD-03)
  assignedEmployeeName?: string; // Nom collaborateur affecté
}

export interface MissionExpenseItem {
  id: string;
  category: 'Hotel' | 'Food' | 'Visa' | 'Flight' | 'Train' | 'Louage' | 'Taxi' | 'Fuel' | 'Toll' | 'Other';
  description: string;
  amount: number;
  invoiceNumber?: string;
  date: string;
}

export interface MissionOrder {
  id: string;
  employeeId: string;
  employeeName: string;
  vehicleId?: string; // empty if transportType is 'Other'
  vehicleLabel?: string; // empty if transportType is 'Other'
  transportType: 'CompanyCar' | 'Other';
  otherTransportLabel?: string; // e.g. 'Train', 'Louage', 'Avion', 'Taxi', etc.
  destination: string;
  purpose: string;
  departureDateTime: string;
  returnDateTime: string;
  status: 'Draft' | 'Approved' | 'Completed' | 'CLOTURE_PAYE' | 'Canceled';
  expenses?: MissionExpenseItem[];
  allowancesGranted?: number; // Avance sur frais accordée (DT)
  totalAdvance?: number;
  totalExpenses?: number;
  netBalanceToSettle?: number;
  closedAt?: string;
}

export interface FleetExpense {
  id: string;
  date: string;
  vehicleId: string;
  vehicleLabel: string;
  category: 'GasolineBonus' | 'Insurance' | 'Vignette' | 'Toll' | 'SpareParts' | 'MechanicLabor' | 'PanelBeaterInvoice' | 'Other';
  amount: number;
  invoiceNb?: string;
  providerName?: string;
  description?: string;
}

export interface IncidentRecord {
  id: string;
  date: string;
  vehicleId: string;
  vehicleLabel: string;
  employeeId: string;
  driverName: string;
  description: string;
  safetyInquiry: string; // enquête chauffeur
  sanctionsApplied: string; // sanctions appliquées (fautes graves)
  severity: 'Low' | 'Medium' | 'High';
  status: 'Reported' | 'UnderInquiry' | 'Resolved';
}

export interface SupportTicketMessage {
  id: string;
  senderName: string;
  senderRole: 'Client' | 'IT Support' | 'Admin' | 'Manager' | 'Agent';
  content: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: 'Technical' | 'Billing' | 'HR_Payroll' | 'Commercial' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In_Progress' | 'Pending_Customer' | 'Resolved' | 'Closed';
  creatorName: string;
  creatorEmail: string;
  createdDate: string;
  assignedAgent?: string;
  messages: SupportTicketMessage[];
}

export interface ImportFolderItem {
  id: string;
  productName: string;
  quantity: number;
  fobUnitPrice: number; // in Foreign Currency
  foreignCurrencyRate: number; // e.g., TND rate
  customsDutyRate: number; // % e.g., 15%
  vatRate: number; // % e.g., 19%
}

export interface ImportFolder {
  id: string;
  reference: string; // e.g., IMP-2026-001 or EXP-2026-001
  folderType?: 'Import' | 'Export'; // Default is 'Import'
  supplierName?: string; // For import
  clientName?: string; // For export
  originCountry?: string; // For import
  destinationCountry?: string; // For export
  incoterm: 'FOB' | 'CIF' | 'EXW' | 'CFR' | 'DDP';
  portOfArrival?: 'Radès' | 'Sfax' | 'Enfidha' | 'Tunis-Carthage'; // For import
  portOfDeparture?: 'Radès' | 'Sfax' | 'Enfidha' | 'Tunis-Carthage'; // For export
  transitterName: string; // Transitaire
  status: 'Draft' | 'Transit' | 'Customs' | 'Cleared' | 'InStock';
  creationDate: string;
  estimatedArrivalDate: string;
  currency: 'EUR' | 'USD' | 'GBP';
  exchangeRate: number; // 1 Currency = X TND
  items: ImportFolderItem[];
  
  // Expenses for Landed Cost (in TND)
  freightCostTND: number; // Fret
  customsDutiesTND: number; // Droits de douane payés
  transitterFeesTND: number; // Frais de transitaire
  handlingFeesTND: number; // Frais d'acconage / manutention
  insuranceCostTND: number; // Assurance transport
  otherFeesTND: number; // Autres taxes ou frais
}

export interface LCRequest {
  id: string;
  importFolderId?: string;
  folderType?: 'Import' | 'Export'; // Whether LC is issued for import or received for export
  lcReference: string;
  proformaInvoiceRef: string;
  proformaInvoiceDate: string;
  issuingBank: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  advisingBank: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
  paymentTerms: 'At Sight' | 'Deferred 30 Days' | 'Deferred 60 Days' | 'Deferred 90 Days' | 'Deferred 120 Days';
  expiryDate: string;
  shipmentDeadline: string;
  portOfLoading: string;
  portOfDischarge: 'Radès' | 'Sfax' | 'Enfidha' | 'Tunis-Carthage';
  status: 'Draft' | 'Submitted' | 'Opened' | 'Settled' | 'Cancelled';
  requiredDocuments: string[];
  additionalConditions?: string;
  creationDate: string;
}

export interface CessionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
  category: 'Evaluation' | 'Juridique' | 'Comptabilité' | 'Audit' | 'Ressources Humaines' | 'Négociation' | 'Fiscal' | 'Autre';
  direction: 'Direction Générale' | 'Direction Financière' | 'Direction Juridique' | 'Direction RH' | 'Direction Commerciale' | 'Direction Technique';
  authorName: string;
  authorRole: 'Collaborateur' | 'Dirigeant';
  financialImpact?: number; // Optional valuation impact in TND
  description: string;
  status: 'Brouillon' | 'Soumis' | 'Approuvé' | 'Complété';
  attachmentsCount?: number;
  isAutomatic?: boolean;
  actionType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVAL' | 'SYSTEM';
  sourceModule?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  quantityNeeded: number;
  unit: string;
  unitCost: number; // in TND
  importFolderId?: string; // Sourced from an import dossier
}

export interface Nomenclature {
  id: string;
  productName: string;
  category: string;
  materials: RawMaterial[];
  estimatedTimeMinutes: number;
  laborCostPerUnit: number;
}

export interface ManufacturingOrder {
  id: string;
  nomenclatureId: string;
  productName: string;
  quantityToProduce: number;
  quantityProduced: number;
  quantityScrapped: number; // Rebuts
  startDate: string;
  endDate?: string;
  assignedLine: string; // Ligne 1, Ligne 2, etc.
  assignedTeam: string;
  status: 'Planifié' | 'En attente Douane/Matières' | 'En cours' | 'Terminé' | 'Rejeté';
  advancement: number; // 0-100%
  importFolderId?: string; // Direct link to import folder for raw materials
  lcRequestId?: string; // Direct link to letter of credit
  customsStatusOverride?: 'Blocked' | 'Released';
  notes?: string;
}

export type AssignedModule = 'standard' | 'chantier' | 'vente' | 'polyvalent';

export type { MobileDevice, FleetInventoryItem, FleetDeviceStatus, DeliveryTour } from './types/mobileTerrain';










