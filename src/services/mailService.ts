/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SmtpSettings, ImapSettings, IncomingEmail } from '../types';

/**
 * Normalizes a tenant ID for use in localStorage keys.
 */
export function normalizeTenantId(tenantId?: string | null): string {
  if (!tenantId) return 'default_tenant';
  const clean = tenantId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return clean || 'default_tenant';
}

/**
 * Checks if the current tenant is the master Editor/Parent account (Inter-Affaires / company_parent).
 * All other clients (such as MD, GEP, demo accounts, etc.) are strictly client tenants.
 */
export function isParentCompanyTenant(tenantId?: string | null, companyName?: string | null): boolean {
  const normTenant = (tenantId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const normName = (companyName || '').trim().toLowerCase();
  
  if (!normTenant && !normName) return false;
  
  return (
    normTenant === 'company_parent' ||
    normTenant === 'parent' ||
    normTenant.includes('inter_affaires') ||
    normTenant.includes('inter-affaires') ||
    normName === 'company_parent' ||
    normName === 'parent' ||
    normName.includes('inter-affaires') ||
    normName.includes('inter affaires') ||
    normName.includes('inter_affaires')
  );
}

/**
 * Returns tenant-scoped storage key for SMTP settings.
 * Format: carthage_${tenantId}_smtp_settings
 */
export function getTenantSmtpStorageKey(tenantId?: string | null): string {
  const norm = normalizeTenantId(tenantId);
  return `carthage_${norm}_smtp_settings`;
}

/**
 * Returns tenant-scoped storage key for IMAP inbox.
 * Format: carthage_${tenantId}_imap_inbox
 */
export function getTenantImapInboxStorageKey(tenantId?: string | null): string {
  const norm = normalizeTenantId(tenantId);
  return `carthage_${norm}_imap_inbox`;
}

/**
 * Returns tenant-scoped storage key for Resend Token.
 * Format: carthage_${tenantId}_resend_token
 */
export function getTenantResendTokenStorageKey(tenantId?: string | null): string {
  const norm = normalizeTenantId(tenantId);
  return `carthage_${norm}_resend_token`;
}

/**
 * Returns tenant-scoped storage key for IMAP configuration settings.
 */
export function getTenantImapSettingsStorageKey(tenantId?: string | null): string {
  const norm = normalizeTenantId(tenantId);
  return `carthage_${norm}_imap_settings`;
}

/**
 * Default SMTP configuration depending on tenant type.
 * - company_parent (Éditeur Inter-Affaires): contact@elyssa.pro / Hostinger config
 * - client / demo / test tenant (MD, etc.): completely empty fields and disabled
 */
export function getDefaultSmtpSettings(tenantId?: string | null, companyName?: string | null): SmtpSettings {
  if (isParentCompanyTenant(tenantId, companyName)) {
    return {
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      user: "contact@elyssa.pro",
      pass: "",
      fromName: "Elyssa ERP Suite",
      fromEmail: "contact@elyssa.pro",
      isEnabled: true,
      provider: "smtp",
      resendApiKey: ""
    };
  }

  return {
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromName: "",
    fromEmail: "",
    isEnabled: false,
    provider: "smtp",
    resendApiKey: ""
  };
}

/**
 * Default IMAP configuration depending on tenant type.
 * - company_parent (Éditeur Inter-Affaires): contact@elyssa.pro / Hostinger config
 * - client / demo / test tenant (MD, etc.): completely empty fields and disabled
 */
export function getDefaultImapSettings(tenantId?: string | null, companyName?: string | null): ImapSettings {
  if (isParentCompanyTenant(tenantId, companyName)) {
    return {
      host: "imap.hostinger.com",
      port: 993,
      secure: true,
      user: "contact@elyssa.pro",
      pass: "",
      isEnabled: true
    };
  }

  return {
    host: "",
    port: 993,
    secure: true,
    user: "",
    pass: "",
    isEnabled: false
  };
}

/**
 * Default Inbox emails depending on tenant type.
 * Non-parent tenants receive empty array [] by default.
 */
export function getDefaultInboxEmails(tenantId?: string | null, companyName?: string | null, isDemo?: boolean): IncomingEmail[] {
  if (!isParentCompanyTenant(tenantId, companyName)) {
    if (isDemo) {
      return [
        {
          id: `demo-inbox-1`,
          senderName: "Service Achats Client [Démo]",
          senderEmail: "achats@client-partenaire.tn",
          subject: "[Démo] Notification de commande #CMD-2026-088",
          body: "Bonjour,\n\nVeuillez trouver ci-joint notre bon de commande validé pour livraison sur notre dépôt de Tunis.\n\nCordialement,\nService Approvisionnements.",
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          isRead: false,
          category: "sales"
        }
      ];
    }
    return [];
  }

  return [];
}

/**
 * Sanitizes any SMTP settings to guarantee that no Editor (Inter-Affaires/Hostinger) credentials leak to a client tenant.
 */
export function sanitizeSmtpSettings(settings: SmtpSettings | null | undefined, tenantId?: string | null, companyName?: string | null): SmtpSettings {
  const isParent = isParentCompanyTenant(tenantId, companyName);
  const defaultSettings = getDefaultSmtpSettings(tenantId, companyName);
  if (!settings || typeof settings !== 'object') return defaultSettings;

  if (!isParent) {
    const userLower = (settings.user || '').toLowerCase();
    const fromEmailLower = (settings.fromEmail || '').toLowerCase();
    const hostLower = (settings.host || '').toLowerCase();
    const fromNameLower = (settings.fromName || '').toLowerCase();

    const isLeakedEditorCreds = 
      userLower === 'contact@elyssa.pro' ||
      fromEmailLower === 'contact@elyssa.pro' ||
      hostLower.includes('hostinger') ||
      hostLower === 'smtp.elyssa.pro' ||
      fromNameLower === 'elyssa erp suite' ||
      fromNameLower === 'elyssa crm/erp' ||
      fromNameLower === 'elyssa erp';

    if (isLeakedEditorCreds) {
      return defaultSettings;
    }
  }

  return {
    ...defaultSettings,
    ...settings
  };
}

/**
 * Sanitizes any IMAP settings to guarantee that no Editor (Inter-Affaires/Hostinger) credentials leak to a client tenant.
 */
export function sanitizeImapSettings(settings: ImapSettings | null | undefined, tenantId?: string | null, companyName?: string | null): ImapSettings {
  const isParent = isParentCompanyTenant(tenantId, companyName);
  const defaultSettings = getDefaultImapSettings(tenantId, companyName);
  if (!settings || typeof settings !== 'object') return defaultSettings;

  if (!isParent) {
    const userLower = (settings.user || '').toLowerCase();
    const hostLower = (settings.host || '').toLowerCase();

    const isLeakedEditorCreds = 
      userLower === 'contact@elyssa.pro' ||
      hostLower.includes('hostinger') ||
      hostLower === 'imap.elyssa.pro';

    if (isLeakedEditorCreds) {
      return defaultSettings;
    }
  }

  return {
    ...defaultSettings,
    ...settings
  };
}

/**
 * Loads tenant-scoped SMTP settings from localStorage with strict isolation.
 */
export function loadTenantSmtpSettings(tenantId?: string | null, companyName?: string | null): SmtpSettings {
  const key = getTenantSmtpStorageKey(tenantId);
  const defaultSettings = getDefaultSmtpSettings(tenantId, companyName);

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return sanitizeSmtpSettings(parsed, tenantId, companyName);
      }
    }
  } catch (e) {
    console.warn(`[MailService] Error loading SMTP settings for tenant ${tenantId}:`, e);
  }

  return defaultSettings;
}

/**
 * Saves tenant-scoped SMTP settings to localStorage.
 */
export function saveTenantSmtpSettings(tenantId: string | null | undefined, settings: SmtpSettings): void {
  const key = getTenantSmtpStorageKey(tenantId);
  try {
    localStorage.setItem(key, JSON.stringify(settings));
    if (settings.resendApiKey) {
      const tokenKey = getTenantResendTokenStorageKey(tenantId);
      localStorage.setItem(tokenKey, settings.resendApiKey);
    }
  } catch (e) {
    console.error(`[MailService] Failed to save SMTP settings for ${tenantId}:`, e);
  }
}

/**
 * Loads tenant-scoped IMAP settings from localStorage with strict isolation.
 */
export function loadTenantImapSettings(tenantId?: string | null, companyName?: string | null): ImapSettings {
  const key = getTenantImapSettingsStorageKey(tenantId);
  const defaultSettings = getDefaultImapSettings(tenantId, companyName);

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return sanitizeImapSettings(parsed, tenantId, companyName);
      }
    }
  } catch (e) {
    console.warn(`[MailService] Error loading IMAP settings for tenant ${tenantId}:`, e);
  }

  return defaultSettings;
}

/**
 * Saves tenant-scoped IMAP settings to localStorage.
 */
export function saveTenantImapSettings(tenantId: string | null | undefined, settings: ImapSettings): void {
  const key = getTenantImapSettingsStorageKey(tenantId);
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {
    console.error(`[MailService] Failed to save IMAP settings for ${tenantId}:`, e);
  }
}

/**
 * Loads tenant-scoped IMAP inbox emails from localStorage.
 */
export function loadTenantImapInbox(tenantId?: string | null, companyName?: string | null, isDemo?: boolean): IncomingEmail[] {
  const isParent = isParentCompanyTenant(tenantId, companyName);
  const key = getTenantImapInboxStorageKey(tenantId);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        if (!isParent) {
          // Filter out any editor emails if accidentally present
          const sanitized = parsed.filter(m => m && !m.id?.includes('editor-private'));
          return sanitized;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`[MailService] Error loading IMAP inbox for tenant ${tenantId}:`, e);
  }

  return getDefaultInboxEmails(tenantId, companyName, isDemo);
}

/**
 * Saves tenant-scoped IMAP inbox emails to localStorage.
 */
export function saveTenantImapInbox(tenantId: string | null | undefined, emails: IncomingEmail[]): void {
  const key = getTenantImapInboxStorageKey(tenantId);
  try {
    localStorage.setItem(key, JSON.stringify(emails));
  } catch (e) {
    console.error(`[MailService] Failed to save IMAP inbox for ${tenantId}:`, e);
  }
}

/**
 * Loads tenant-scoped Resend token.
 */
export function loadTenantResendToken(tenantId?: string | null, companyName?: string | null): string {
  if (!isParentCompanyTenant(tenantId, companyName)) {
    const key = getTenantResendTokenStorageKey(tenantId);
    return localStorage.getItem(key) || '';
  }
  const key = getTenantResendTokenStorageKey(tenantId);
  return localStorage.getItem(key) || '';
}

/**
 * Saves tenant-scoped Resend token.
 */
export function saveTenantResendToken(tenantId: string | null | undefined, token: string): void {
  const key = getTenantResendTokenStorageKey(tenantId);
  try {
    if (token) {
      localStorage.setItem(key, token);
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error(`[MailService] Failed to save Resend token for ${tenantId}:`, e);
  }
}

export const MailService = {
  normalizeTenantId,
  isParentCompanyTenant,
  getTenantSmtpStorageKey,
  getTenantImapInboxStorageKey,
  getTenantResendTokenStorageKey,
  getTenantImapSettingsStorageKey,
  getDefaultSmtpSettings,
  getDefaultImapSettings,
  getDefaultInboxEmails,
  sanitizeSmtpSettings,
  sanitizeImapSettings,
  loadTenantSmtpSettings,
  saveTenantSmtpSettings,
  loadTenantImapSettings,
  saveTenantImapSettings,
  loadTenantImapInbox,
  saveTenantImapInbox,
  loadTenantResendToken,
  saveTenantResendToken
};

export default MailService;
