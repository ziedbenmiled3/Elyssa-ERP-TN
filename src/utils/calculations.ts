/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Invoice, AdminSettings } from '../types';

/**
 * Calculates all invoice amounts based on HT and tax settings.
 * In Tunisia, Retenue à la source (RS) is computed on the total TTC (all taxes included)
 * or on the HT depending on the type of transaction. By default, it is computed on the
 * total amount including VAT (TTC) for commercial goods/services above 1000 TND (specifically,
 * 1.5% withholding).
 * 
 * Let's calculate:
 * - VAT amount = HT * (vatRate / 100)
 * - TTC amount = HT + VAT amount
 * - Withholding Tax = If TTC >= threshold, then TTC * (withholdingRate / 100). Otherwise 0.
 * - Net Payable = TTC - Withholding Tax
 */
export function calculateInvoiceAmounts(
  amountHT: number,
  vatRate: number,
  withholdingRate: number,
  threshold: number
): {
  vatAmount: number;
  amountTTC: number;
  withholdingAmount: number;
  amountNetToPay: number;
} {
  const vatAmount = Math.round(amountHT * (vatRate / 100) * 1000) / 1000;
  const amountTTC = Math.round((amountHT + vatAmount) * 1000) / 1000;
  
  // Under Tunisian system, RS of 1.5% applies to payments >= 1000 TND TTC.
  // Other RS (like 15% rent/fees) don't have a 1000 TND threshold.
  // We apply the threshold logic dynamically.
  let withholdingAmount = 0;
  if (amountTTC >= threshold) {
    withholdingAmount = Math.round(amountTTC * (withholdingRate / 100) * 1000) / 1000;
  }
  
  const amountNetToPay = Math.round((amountTTC - withholdingAmount) * 1000) / 1000;
  
  return {
    vatAmount,
    amountTTC,
    withholdingAmount,
    amountNetToPay
  };
}

/**
 * Formats company legal information cleanly for reuse on official documents
 * (invoices, contracts, estimates, letters, etc.).
 */
export function getCompanyLegalHeader(companyData: Partial<AdminSettings>): string {
  const parts: string[] = [];
  
  const name = companyData.companyName || "ELYSSA SOLUTIONS ENTREPRISES";
  const form = companyData.legalForm ? ` ${companyData.legalForm}` : "";
  const capital = companyData?.shareCapital ? ` au Capital de ${Number(companyData.shareCapital).toLocaleString('fr-FR')} TND` : "";
  parts.push(`${name}${form}${capital}`);

  const details: string[] = [];
  if (companyData.companyMF) {
    details.push(`MF : ${companyData.companyMF}`);
  }
  if (companyData.rneNumber) {
    details.push(`RNE : ${companyData.rneNumber}`);
  }
  if (details.length > 0) {
    parts.push(details.join(" | "));
  }

  const contact: string[] = [];
  if (companyData.companyAddress) {
    contact.push(companyData.companyAddress);
  }
  if (companyData.cityZipCode) {
    contact.push(companyData.cityZipCode);
  }
  if (contact.length > 0) {
    parts.push(`Siège Social : ${contact.join(", ")}`);
  }

  const extra: string[] = [];
  if (companyData.companyPhone) {
    extra.push(`Tél : ${companyData.companyPhone}`);
  }
  if (companyData.companyEmail) {
    extra.push(`Email : ${companyData.companyEmail}`);
  }
  if (companyData.website) {
    extra.push(`Web : ${companyData.website}`);
  }
  if (extra.length > 0) {
    parts.push(extra.join(" · "));
  }

  if (companyData.legalRepresentative) {
    parts.push(`Représentant Légal : ${companyData.legalRepresentative}`);
  }

  return parts.join("\n");
}

/**
 * Helper to structure formatted currency outputs in Tunisian Dinar (TND)
 * e.g., 1,500.250 TND (three decimals are standard in Tunisia!)
 */
export function formatTND(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
}
