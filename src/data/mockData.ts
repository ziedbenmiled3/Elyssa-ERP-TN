/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Complaint, Invoice, CompetitorReport, AdminSettings, VisitReport, Supplier, Product, StockMovement, SmtpSettings, EmailTemplate, CommunicationLog } from '../types';

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  companyName: "Inter-Affaires (Parent)",
  currency: "TND",
  defaultVatRate: 19,
  defaultWithholdingRate: 1.5,
  withholdingThreshold: 1000,
  authorizedUsers: ["contact@elyssa.pro"],
  companyLogo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwZjE3MmEiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0zMCw2MCBDMzUsNDAgNDUsMzAgNTAsMjUgQzU1LDMwIDY1LDQwIDcwLDYwIFoiIGZpbGw9InVybCgjZ29sZCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjIwIiByPSI0IiBmaWxsPSIjZmJiZjI0Ii8+PHBhdGggZD0iTTIwLDY1IEMzNSw3MCA2NSw3MCA4MCw2NSBDNzAsNzIgMzAsNzIgMjAsNjUgWiIgZmlsbD0iI2Y1OWUwYiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmYmJmMjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNiNDUzMDkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48dGV4dCB4PSI1MCIgeT0iODgiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgbGV0dGVyLXNwYWNpbmc9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVMWVNTQTwvdGV4dD48L3N2Zz4=",
  companyAddress: "Rue du Lac Windermere, Les Berges du Lac 2, 1053 Tunis, Tunisie",
  companyPhone: "+216 71 862 100",
  companyEmail: "contact@elyssa.pro",
  companyMF: "1458932/A/M/000",
  geminiApiKey: "",
  googleAnalyticsId: "",
  googleAdsId: "",
  robotsTxt: "User-agent: *\nDisallow: /admin\nDisallow: /api\nAllow: /\n",
  sitemapXml: "https://elyssa.pro/",
  seoTitle: "Elyssa ERP | Progiciel de Gestion Intégré & Pilotage d'Entreprise",
  seoDescription: "Elyssa ERP - Solution intégrée de gestion globale pour entreprises en Tunisie.",
  seoKeywords: "Elyssa ERP, ERP Tunisie, Gestion Intégrée",
  ogImage: "",
  legalForm: "Société Anonyme",
  shareCapital: 100000,
  rneNumber: "1458932RNE",
  legalRepresentative: "MED ZIED BEN MILED",
  cityZipCode: "Tunis 1053",
  website: "https://elyssa.pro"
};

export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_COMPLAINTS: Complaint[] = [];
export const INITIAL_COMPETITORS: CompetitorReport[] = [];
export const INITIAL_VISIT_REPORTS: VisitReport[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [];
export const INITIAL_COMMUNICATION_LOGS: CommunicationLog[] = [];

export const DEFAULT_SMTP_SETTINGS: SmtpSettings = {
  host: "smtp.elyssa.pro",
  port: 587,
  secure: false,
  user: "contact@elyssa.pro",
  pass: "",
  fromName: "Elyssa ERP",
  fromEmail: "contact@elyssa.pro",
  isEnabled: false,
  provider: "smtp",
  resendApiKey: ""
};

export const DEFAULT_IMAP_SETTINGS = {
  host: "imap.elyssa.pro",
  port: 993,
  secure: true,
  user: "contact@elyssa.pro",
  pass: "",
  isEnabled: false
};

export const INITIAL_INCOMING_EMAILS: any[] = [];

