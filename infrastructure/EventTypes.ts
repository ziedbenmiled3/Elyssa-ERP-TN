export interface TvaDetail {
  rate: number;   // e.g., 7, 13, 19
  amount: number; // calculated TVA amount in TND
}

/**
 * Representing a strict compliant Tunisian fiscal invoice payload.
 * Local regulations:
 * - Matricule Fiscal standard format: [7 digits numeric]/[1 character category]/[1 character code]/[1 character category]/[3 digits branch]
 *   Example: 1234567/A/A/M/000
 * - Timbre Fiscal is 1.000 TND since recent Finance Law revisions for invoices.
 * - FODEC (Fonds de Développement de la Compétitivité) is a 1% tax on HT applied to certain activities.
 */
export interface InvoiceTunisiaPayload {
  invoiceId: string;
  ticketId?: string; // Correlated POS ticket if converted
  customerMatriculeFiscal?: string;
  amountHT: number;
  fodecAmount: number; // 1% tax on HT
  tvaDetails: TvaDetail[];
  timbreFiscal: number; // 1.000 TND
  amountTTC: number;
  retenueSourceApplied: boolean;
  retenueSourceAmount: number; // 1.5% of HT or relevant basis
  netAPayer: number; // amountTTC - retenueSourceAmount
}

/**
 * Standard accounting journal entry line under the NCT (Normes Comptables Tunisiennes)
 */
export interface AccountingEntryLine {
  accountCode: string; // e.g. "411000", "707000"
  accountName: string;
  debit: number;
  credit: number;
}

export interface AccountingJournalEntry {
  entryId: string;
  invoiceId: string;
  companyId: string;
  date: string;
  lines: AccountingEntryLine[];
  balanced: boolean;
}
