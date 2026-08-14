import fs from 'fs';
import path from 'path';

export interface SanitizeOptions {
  targetCompanyId: string;
  targetCompanyName: string;
  dryRun?: boolean;
}

export function sanitizeCrossTenantRecord(record: any, validCompanyId: string): boolean {
  if (!record || typeof record !== 'object') return false;
  const recordCompany = record.company_id || record.companyId || record.company;
  if (!recordCompany) return true; // Keep if neutral
  return recordCompany.toLowerCase() === validCompanyId.toLowerCase();
}

console.log("🔥 Sanitize Cross Tenant Data Utility Loaded.");
