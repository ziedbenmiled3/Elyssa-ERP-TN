/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import BillingManager, { DEFAULT_DEMO_INVOICES } from './BillingManager';
import { DEFAULT_DEMO_CLIENTS } from './ClientManager';
import { Invoice, Client, AdminSettings, SmtpSettings, EmailTemplate, CommunicationLog } from '../types';

export interface InvoiceManagerProps {
  invoices?: Invoice[];
  clients?: Client[];
  adminSettings?: AdminSettings;
  onUpdateAdminSettings?: (updatedSettings: AdminSettings) => void;
  onUpdateInvoices?: (updatedInvoices: Invoice[]) => void;
  smtpSettings?: SmtpSettings;
  emailTemplates?: EmailTemplate[];
  communicationLogs?: CommunicationLog[];
  onUpdateCommunicationLogs?: (logs: CommunicationLog[]) => void;
  activeTenantId?: string;
  isDemoCompany?: boolean;
}

export { DEFAULT_DEMO_INVOICES, DEFAULT_DEMO_CLIENTS };

export default function InvoiceManager(props: InvoiceManagerProps) {
  const isDemoTenant = React.useMemo(() => {
    if (props.isDemoCompany) return true;
    const tid = String(props.activeTenantId || localStorage.getItem('carthage_active_company') || '').toLowerCase().trim();
    if (tid.includes('parent') || tid.includes('prod') || tid === 'inter-affaires' || tid === 'company_parent' || tid === 'elyssa entreprises s.a.') {
      return false;
    }
    return tid === 'inter-affaires-demo' || tid === 'demo' || tid === 'company_demo' || tid.includes('démo') || tid.includes('demo') || tid.includes('sandbox');
  }, [props.activeTenantId, props.isDemoCompany]);

  // Direct state initialization with STRICT PROD isolation
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (!isDemoTenant) {
      return Array.isArray(props.invoices) 
        ? props.invoices.filter(i => !i.is_demo && !String(i.id || '').startsWith('demo-')) 
        : [];
    }
    return Array.isArray(props.invoices) && props.invoices.length > 0 ? props.invoices : DEFAULT_DEMO_INVOICES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    if (!isDemoTenant) {
      return Array.isArray(props.clients) 
        ? props.clients.filter(c => !c.is_demo && !String(c.id || '').startsWith('demo-')) 
        : [];
    }
    return Array.isArray(props.clients) && props.clients.length > 0 ? props.clients : DEFAULT_DEMO_CLIENTS;
  });

  useEffect(() => {
    if (!isDemoTenant) {
      const sanitized = Array.isArray(props.invoices) 
        ? props.invoices.filter(i => !i.is_demo && !String(i.id || '').startsWith('demo-')) 
        : [];
      setInvoices(sanitized);
    } else if (Array.isArray(props.invoices) && props.invoices.length > 0) {
      setInvoices(props.invoices);
    }
  }, [props.invoices, isDemoTenant]);

  useEffect(() => {
    if (!isDemoTenant) {
      const sanitized = Array.isArray(props.clients) 
        ? props.clients.filter(c => !c.is_demo && !String(c.id || '').startsWith('demo-')) 
        : [];
      setClients(sanitized);
    } else if (Array.isArray(props.clients) && props.clients.length > 0) {
      setClients(props.clients);
    }
  }, [props.clients, isDemoTenant]);

  const defaultAdminSettings: AdminSettings = props.adminSettings || {
    companyName: 'Elyssa ERP Suite',
    matriculeFiscal: '1849203/A/M/000',
    companyMF: '1849203/A/M/000',
    currency: 'TND',
    defaultVatRate: 19,
    defaultWithholdingRate: 1.5,
    withholdingThreshold: 1000,
    authorizedUsers: ['Admin', 'Comptable', 'Commercial'],
    companyAddress: 'Zone Industrielle Radès, 2040 Tunis, Tunisie',
    companyPhone: '+216 71 800 900',
    companyEmail: 'contact@elyssaerp.tn'
  };

  return (
    <BillingManager
      invoices={invoices}
      clients={clients}
      adminSettings={defaultAdminSettings}
      onUpdateAdminSettings={props.onUpdateAdminSettings}
      onUpdateInvoices={(updated) => {
        setInvoices(updated);
        if (props.onUpdateInvoices) {
          props.onUpdateInvoices(updated);
        }
      }}
      smtpSettings={props.smtpSettings}
      emailTemplates={props.emailTemplates}
      communicationLogs={props.communicationLogs}
      onUpdateCommunicationLogs={props.onUpdateCommunicationLogs}
    />
  );
}
