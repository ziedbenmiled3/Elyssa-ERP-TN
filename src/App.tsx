/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAiCopilot } from "./hooks/useAiCopilot";
import { CopilotChatDrawer } from "./components/CopilotChatDrawer";
import { MessageSquare } from "lucide-react";
import { 
  AdminSettings, 
  Client, 
  Complaint, 
  Invoice, 
  VisitReport, 
  CompetitorReport,
  Supplier,
  Product,
  StockMovement,
  SmtpSettings,
  ImapSettings,
  IncomingEmail,
  EmailTemplate,
  CommunicationLog,
  CollaboratorAccount,
  UserSession,
  BankAccount,
  BankTransaction,
  TaxDeclaration,
  YearEndClosing,
  GedDocument,
  Employee,
  WorkContract,
  Payslip,
  AbsenceRecord,
  ImportFolder,
  LCRequest,
  Vehicle,
  MissionOrder,
  FleetExpense,
  IncidentRecord
} from './types';

import { purgeTenantData, clearDemoData as clearDemoDataService, reloadDemoData } from './services/demoDataService';
import { seedHyperConnectedDemoData } from './services/hyperConnectedDemoSeeder';

import { 
  INITIAL_ADMIN_SETTINGS, 
  INITIAL_CLIENTS, 
  INITIAL_COMPLAINTS, 
  INITIAL_INVOICES, 
  INITIAL_VISIT_REPORTS, 
  INITIAL_COMPETITORS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  DEFAULT_SMTP_SETTINGS,
  DEFAULT_IMAP_SETTINGS,
  INITIAL_INCOMING_EMAILS,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_COMMUNICATION_LOGS
} from './data/mockData';

import {
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_TAX_DECLARATIONS,
  INITIAL_YEAR_END_CLOSINGS
} from './data/financeMock';

const DEFAULT_FLEET_VEHICLES: Vehicle[] = [
  { id: 'demo-v_1', brand: 'Peugeot', model: 'Partner', registrationNumber: '228 TUN 4091', purchaseDate: '2024-03-12', purchasePrice: 62000.000, status: 'Active', assignedToEmployeeId: 'demo-emp_3', assignedEmployeeName: 'Mohamed Ali Gharbi (Démo)' },
  { id: 'demo-v_2', brand: 'Citroën', model: 'C-Elysée', registrationNumber: '215 TUN 9811', purchaseDate: '2023-01-15', purchasePrice: 48000.000, status: 'Active', assignedToEmployeeId: 'demo-emp_1', assignedEmployeeName: 'Khaled Ben Amor (Démo)' },
  { id: 'demo-v_3', brand: 'Dacia', model: 'Duster', registrationNumber: '235 TUN 3254', purchaseDate: '2025-06-10', purchasePrice: 78000.000, status: 'Active', assignedToEmployeeId: 'demo-emp_2', assignedEmployeeName: 'Ines Dridi (Démo)' },
  { id: 'demo-v_4', brand: 'Renault', model: 'Clio 5', registrationNumber: '204 TUN 1542', purchaseDate: '2022-09-22', purchasePrice: 42000.000, status: 'UnderRepair', assignedToEmployeeId: 'demo-emp_3', assignedEmployeeName: 'Mohamed Ali Gharbi (Démo)' },
  { id: 'demo-v_904', brand: 'Isuzu', model: 'D-Max Camionette', registrationNumber: '240 TN 8812', purchaseDate: '2024-02-10', purchasePrice: 72000.000, status: 'Active', assignedToEmployeeId: 'EMP-904', assignedEmployeeName: 'Sami Ben Ali' },
  { id: 'demo-v_912', brand: 'Toyota', model: 'Hilux Pick-Up', registrationNumber: '198 TN 4410', purchaseDate: '2023-08-15', purchasePrice: 85000.000, status: 'Active', assignedToEmployeeId: 'EMP-912', assignedEmployeeName: 'Mohamed Trabelsi' },
  { id: 'demo-v_920', brand: 'Peugeot', model: 'Boxer Fourgon', registrationNumber: '215 TN 1092', purchaseDate: '2024-04-01', purchasePrice: 68000.000, status: 'Active', assignedToEmployeeId: 'EMP-920', assignedEmployeeName: 'Youssef Mansour' },
  { id: 'demo-v_935', brand: 'Citroën', model: 'Berlingo Van', registrationNumber: '201 TN 6621', purchaseDate: '2023-11-20', purchasePrice: 52000.000, status: 'Active', assignedToEmployeeId: 'EMP-935', assignedEmployeeName: 'Karem Chaabane' },
  { id: 'demo-v_942', brand: 'Renault', model: 'Clio 5', registrationNumber: '228 TN 3301', purchaseDate: '2024-01-10', purchasePrice: 46000.000, status: 'Active', assignedToEmployeeId: 'EMP-942', assignedEmployeeName: 'Fatma Gharbi' },
  { id: 'demo-v_950', brand: 'Isuzu', model: 'D-Max 4x4', registrationNumber: '215 TUN 9832', purchaseDate: '2023-08-18', purchasePrice: 89000.000, status: 'Active', assignedToEmployeeId: 'EMP-950', assignedEmployeeName: 'Hamadi Rekik' },
  { id: 'demo-v_951', brand: 'Hyundai', model: 'H100 Fourgon', registrationNumber: '219 TN 5510', purchaseDate: '2024-05-12', purchasePrice: 58000.000, status: 'Active', assignedToEmployeeId: 'EMP-951', assignedEmployeeName: 'Ahmed Karray' }
];

const DEFAULT_FLEET_MISSIONS: MissionOrder[] = [
  { 
    id: 'demo-mo_1', 
    employeeId: 'demo-emp_3', 
    employeeName: 'Mohamed Ali Gharbi (Démo)', 
    vehicleId: 'demo-v_1', 
    vehicleLabel: 'Peugeot Partner (228 TUN 4091)', 
    transportType: 'CompanyCar',
    destination: 'Sfax / Gabès', 
    purpose: 'Livraison de pièces détachées urgentes aux clients zone industrielle', 
    departureDateTime: '2026-06-15T07:15', 
    returnDateTime: '2026-06-16T19:45', 
    status: 'Completed',
    expenses: [
      { id: 'demo-me_mo1_1', category: 'Hotel', description: 'Chambre individuelle Hôtel Sfax Centre', amount: 145.000, invoiceNumber: 'FA_SFAX_998', date: '2026-06-15' },
      { id: 'demo-me_mo1_2', category: 'Food', description: 'Dîner et petit-déjeuner', amount: 35.000, invoiceNumber: 'RE_SFAX_321', date: '2026-06-15' }
    ]
  },
  { 
    id: 'demo-mo_2', 
    employeeId: 'demo-emp_1', 
    employeeName: 'Khaled Ben Amor (Démo)', 
    vehicleId: 'demo-v_2', 
    vehicleLabel: 'Citroën C-Elysée (215 TUN 9811)', 
    transportType: 'CompanyCar',
    destination: 'Tunis Centre / BFT Bank', 
    purpose: 'Rapprochement bancaire physique et signature de protocoles', 
    departureDateTime: '2026-06-20T09:30', 
    returnDateTime: '2026-06-20T13:00', 
    status: 'Approved',
    expenses: []
  },
  { 
    id: 'demo-mo_3', 
    employeeId: 'demo-emp_2', 
    employeeName: 'Ines Dridi (Démo)', 
    vehicleId: 'demo-v_3', 
    vehicleLabel: 'Dacia Duster (235 TUN 3254)', 
    transportType: 'CompanyCar',
    destination: 'Sousse', 
    purpose: 'Audit logistique inter-entreprises du dépôt côtier', 
    departureDateTime: '2026-06-22T08:00', 
    returnDateTime: '2026-06-24T18:00', 
    status: 'Draft',
    expenses: [
      { id: 'demo-me_mo3_1', category: 'Hotel', description: 'Réservation Hôtel Tej Marhaba Sousse (2 nuits)', amount: 260.000, invoiceNumber: 'TM_SOUSSE_11', date: '2026-06-22' }
    ]
  },
  { 
    id: 'demo-mo_4', 
    employeeId: 'demo-emp_2', 
    employeeName: 'Ines Dridi (Démo)', 
    transportType: 'Other', 
    otherTransportLabel: 'Avion', 
    destination: 'Paris / Salon de la Logistique', 
    purpose: 'Négociation partenariats fret maritime et renouvellement agrément douanier', 
    departureDateTime: '2026-06-25T08:00', 
    returnDateTime: '2026-06-28T22:00', 
    status: 'Approved', 
    expenses: [
      { id: 'demo-me_mo4_1', category: 'Flight', description: "Billet d'avion Tunis-Paris A/R Tunisair", amount: 1120.000, invoiceNumber: 'TUV_32441', date: '2026-06-25' },
      { id: 'demo-me_mo4_2', category: 'Hotel', description: 'Hôtel Ibis Paris 3 Nuits', amount: 980.000, invoiceNumber: 'PAR_HOST_889', date: '2026-06-25' },
      { id: 'demo-me_mo4_3', category: 'Visa', description: 'Frais Consulaires TLS contact Visa Schengen', amount: 280.000, invoiceNumber: 'TLS_SHEN_2026', date: '2026-06-22' },
      { id: 'demo-me_mo4_4', category: 'Food', description: 'Frais de restauration et métro Paris RER', amount: 150.000, date: '2026-06-26' }
    ]
  },
  {
    id: 'demo-mo_904',
    employeeId: 'EMP-904',
    employeeName: 'Sami Ben Ali',
    vehicleId: 'demo-v_904',
    vehicleLabel: 'Camionette Isuzu (240 TN 8812)',
    transportType: 'CompanyCar',
    destination: 'Grand Tunis & Ben Arous',
    purpose: 'Tournée Commerciale Van Sales & Prospection B2B clients grands comptes',
    departureDateTime: '2026-08-05T08:00',
    returnDateTime: '2026-08-05T18:00',
    status: 'Approved',
    expenses: [
      { id: 'demo-me_904_1', category: 'Fuel', description: 'Recharge carte carburant Ola Energy Lac 2', amount: 140.000, invoiceNumber: 'BON_OLA_904', date: '2026-08-05' }
    ]
  },
  {
    id: 'demo-mo_912',
    employeeId: 'EMP-912',
    employeeName: 'Mohamed Trabelsi',
    vehicleId: 'demo-v_912',
    vehicleLabel: 'Toyota Hilux Pick-Up (198 TN 4410)',
    transportType: 'CompanyCar',
    destination: 'Port de Sousse Extension',
    purpose: 'Supervision Chantier BTP & Approvisionnement Béton/Acier',
    departureDateTime: '2026-08-05T07:30',
    returnDateTime: '2026-08-05T19:00',
    status: 'Approved',
    expenses: [
      { id: 'demo-me_912_1', category: 'Toll', description: 'Badge télépéage autoroute A1 Sousse', amount: 35.000, invoiceNumber: 'PEA_AUT_SOUSSE', date: '2026-08-05' }
    ]
  },
  {
    id: 'demo-mo_920',
    employeeId: 'EMP-920',
    employeeName: 'Youssef Mansour',
    vehicleId: 'demo-v_920',
    vehicleLabel: 'Peugeot Boxer Fourgon (215 TN 1092)',
    transportType: 'CompanyCar',
    destination: 'Sfax / Route de Mahdia',
    purpose: 'Livraison palette produits agroalimentaires & Encaissement grossistes',
    departureDateTime: '2026-08-04T06:00',
    returnDateTime: '2026-08-05T20:00',
    status: 'Approved',
    expenses: [
      { id: 'demo-me_920_1', category: 'Fuel', description: 'Plein Gazole 50 SNDP Agil Sfax', amount: 210.000, invoiceNumber: 'AGIL_SFAX_331', date: '2026-08-04' }
    ]
  },
  {
    id: 'demo-mo_935',
    employeeId: 'EMP-935',
    employeeName: 'Karem Chaabane',
    vehicleId: 'demo-v_935',
    vehicleLabel: 'Citroën Berlingo Van (201 TN 6621)',
    transportType: 'CompanyCar',
    destination: 'Nabeul / Zone Industrielle Cap Bon',
    purpose: 'Maintenance préventive ligne d emballage semi-automatique',
    departureDateTime: '2026-08-05T08:30',
    returnDateTime: '2026-08-05T17:30',
    status: 'Approved',
    expenses: []
  },
  {
    id: 'demo-mo_942',
    employeeId: 'EMP-942',
    employeeName: 'Fatma Gharbi',
    vehicleId: 'demo-v_942',
    vehicleLabel: 'Renault Clio 5 (228 TN 3301)',
    transportType: 'CompanyCar',
    destination: 'Bizerte / Site Industriel Menzel Bourguiba',
    purpose: 'Contrôle Qualité ISO 9001 & Audit conformité matières premières',
    departureDateTime: '2026-08-05T09:00',
    returnDateTime: '2026-08-05T16:30',
    status: 'Approved',
    expenses: []
  },
  {
    id: 'demo-mo_950',
    employeeId: 'EMP-950',
    employeeName: 'Hamadi Rekik',
    vehicleId: 'demo-v_950',
    vehicleLabel: 'Isuzu D-Max 4x4 (215 TUN 9832)',
    transportType: 'CompanyCar',
    destination: 'Kairouan & Sidi Bouzid',
    purpose: 'Inspections techniques puits & forages d eau potable',
    departureDateTime: '2026-08-05T07:00',
    returnDateTime: '2026-08-05T19:30',
    status: 'Approved',
    expenses: []
  },
  {
    id: 'demo-mo_951',
    employeeId: 'EMP-951',
    employeeName: 'Ahmed Karray',
    vehicleId: 'demo-v_951',
    vehicleLabel: 'Hyundai H100 Fourgon (219 TN 5510)',
    transportType: 'CompanyCar',
    destination: 'Gabès & Medenine',
    purpose: 'Livraison matériel hydraulique & tuyauterie polyéthylène',
    departureDateTime: '2026-08-05T06:30',
    returnDateTime: '2026-08-05T20:30',
    status: 'Approved',
    expenses: []
  }
];

const DEFAULT_FLEET_EXPENSES: any[] = [
  { id: 'demo-exp_1', date: '2026-06-02', vehicleId: 'demo-v_1', vehicleLabel: 'Peugeot Partner (228 TUN 4091) (Démo)', category: 'GasolineBonus', amount: 120.000, invoiceNb: 'BON_OLA_39912', providerName: 'Ola Energy Charguia', description: 'Recharge carte carburant mensuel' },
  { id: 'demo-exp_2', date: '2026-06-05', vehicleId: 'demo-v_2', vehicleLabel: 'Citroën C-Elysée (215 TUN 9811) (Démo)', category: 'Insurance', amount: 980.050, invoiceNb: 'FACT_AST_2026', providerName: 'Assurances ASTREE', description: 'Renouvellement contrat assurance tous risques annuel' },
  { id: 'demo-exp_3', date: '2026-06-08', vehicleId: 'demo-v_4', vehicleLabel: 'Renault Clio 5 (204 TUN 1542) (Démo)', category: 'SpareParts', amount: 340.000, invoiceNb: 'PIECE_RENA_002', providerName: 'Maison Renault Tunis', description: 'Remplacement plaquettes et disques de freins avant' },
  { id: 'demo-exp_4', date: '2026-06-08', vehicleId: 'demo-v_4', vehicleLabel: 'Renault Clio 5 (204 TUN 1542) (Démo)', category: 'MechanicLabor', amount: 75.000, invoiceNb: 'MO_MEC_GASTON', providerName: 'Atelier Gaston Mécanique', description: "Main d'œuvre montage plaquettes" },
  { id: 'demo-exp_5', date: '2026-06-11', vehicleId: 'demo-v_3', vehicleLabel: 'Dacia Duster (235 TUN 3254) (Démo)', category: 'Vignette', amount: 180.000, invoiceNb: 'REC_FIN_9921', providerName: 'Recette des Finances Tunis', description: "Droit de circulation de l'exercice 2026" },
  { id: 'demo-exp_6', date: '2026-06-15', vehicleId: 'demo-v_1', vehicleLabel: 'Peugeot Partner (228 TUN 4091) (Démo)', category: 'Toll', amount: 12.000, invoiceNb: 'PEA_MOR_AUT', providerName: 'Tunisie Autoroutes S.A.', description: 'Recharge badge Tunisie Autoroute' },
  { id: 'demo-exp_7', date: '2026-06-17', vehicleId: 'demo-v_4', vehicleLabel: 'Renault Clio 5 (204 TUN 1542) (Démo)', category: 'PanelBeaterInvoice', amount: 450.000, invoiceNb: 'FACT_TOLIER_99', providerName: 'Tôlerie Moderne El Ouardia', description: 'Rattrapage froissement aile arrière droite' },
  { id: 'demo-exp_904', date: '2026-06-22', vehicleId: 'demo-v_904', vehicleLabel: 'Camionette Isuzu (240 TN 8812)', category: 'GasolineBonus', amount: 140.000, invoiceNb: 'BON_OLA_904', providerName: 'Ola Energy Lac 2', description: 'Recharge carte carburant Van Sales (Sami Ben Ali)' },
  { id: 'demo-exp_912', date: '2026-06-20', vehicleId: 'demo-v_912', vehicleLabel: 'Toyota Hilux (198 TN 4410)', category: 'Toll', amount: 35.000, invoiceNb: 'PEA_AUT_SOUSSE', providerName: 'Tunisie Autoroutes S.A.', description: 'Badge télépéage trajet Chantier Sousse (Mohamed Trabelsi)' },
  { id: 'demo-exp_920', date: '2026-06-21', vehicleId: 'demo-v_920', vehicleLabel: 'Peugeot Boxer (215 TN 1092)', category: 'GasolineBonus', amount: 210.000, invoiceNb: 'AGIL_SFAX_331', providerName: 'SNDP Agil Sfax', description: 'Plein Gazole 50 tournée livraison Sud (Youssef Mansour)' },
  { id: 'demo-exp_935', date: '2026-06-18', vehicleId: 'demo-v_935', vehicleLabel: 'Citroën Berlingo (201 TN 6621)', category: 'MechanicLabor', amount: 165.000, invoiceNb: 'FACT_CIT_6621', providerName: 'Citroën Nabeul Service', description: 'Vidange huile synthétique et changement filtres (Karem Chaabane)' },
  { id: 'demo-exp_942', date: '2026-06-15', vehicleId: 'demo-v_942', vehicleLabel: 'Renault Clio 5 (228 TN 3301)', category: 'Insurance', amount: 790.000, invoiceNb: 'COMAR_2026_QUAL', providerName: 'Assurances COMAR', description: 'Contrat assurance flotte mission inspection (Fatma Gharbi)' }
];

const DEFAULT_FLEET_INCIDENTS: any[] = [
  { 
    id: 'demo-inc_1', 
    date: '2026-06-08', 
    vehicleId: 'demo-v_4', 
    vehicleLabel: 'Renault Clio 5 (204 TUN 1542) (Démo)', 
    employeeId: 'demo-emp_3', 
    driverName: 'Mohamed Ali Gharbi (Démo)', 
    description: 'Choc arrière mineur au rond-point Charguia II avec un véhicule tiers', 
    safetyInquiry: 'Le chauffeur prétend avoir été surpris par le freinage brusque du tiers. Constat amiable rédigé.', 
    sanctionsApplied: 'Avertissement verbal sérieux rappelé. Pas de responsabilité pécuniaire directe retenue.', 
    severity: 'Medium', 
    status: 'Resolved' 
  },
  { 
    id: 'demo-inc_2', 
    date: '2026-06-19', 
    vehicleId: 'demo-v_1', 
    vehicleLabel: 'Peugeot Partner (228 TUN 4091) (Démo)', 
    employeeId: 'demo-emp_3', 
    driverName: 'Mohamed Ali Gharbi (Démo)', 
    description: 'Rayures profondes constatées sur le parking de la gare de fret', 
    safetyInquiry: "Auteur non identifié (tiers en fuite). Le chauffeur s'était garé sur une zone interdite au chargement rapide, d'où le risque pris.", 
    sanctionsApplied: 'En attente de commission de sécurité interne.', 
    severity: 'Low', 
    status: 'UnderInquiry' 
  }
];

const DEFAULT_IMPORT_FOLDERS: ImportFolder[] = [
  {
    id: 'demo-imp_1',
    reference: 'IMP-2026-001 (Démo)',
    folderType: 'Import',
    supplierName: 'Marseille Chimie SAS',
    originCountry: 'France',
    incoterm: 'FOB',
    portOfArrival: 'Radès',
    transitterName: 'Société Tunisienne de Transit & Logistique (STTL)',
    status: 'Customs',
    creationDate: '2026-06-01',
    estimatedArrivalDate: '2026-06-30',
    currency: 'EUR',
    exchangeRate: 3.42,
    items: [
      { id: 'demo-item_1', productName: 'Solvant Éco Purifié', quantity: 1500, fobUnitPrice: 4.5, foreignCurrencyRate: 3.42, customsDutyRate: 15, vatRate: 19 },
      { id: 'demo-item_2', productName: 'Additif Stabilisateur X20', quantity: 800, fobUnitPrice: 12.0, foreignCurrencyRate: 3.42, customsDutyRate: 10, vatRate: 19 }
    ],
    freightCostTND: 4200,
    customsDutiesTND: 8150,
    transitterFeesTND: 1200,
    handlingFeesTND: 850,
    insuranceCostTND: 650,
    otherFeesTND: 300
  },
  {
    id: 'demo-imp_2',
    reference: 'IMP-2026-002 (Démo)',
    folderType: 'Import',
    supplierName: 'Genoa Industrial Valves',
    originCountry: 'Italie',
    incoterm: 'CIF',
    portOfArrival: 'Sfax',
    transitterName: 'Sfax Douane Services',
    status: 'Transit',
    creationDate: '2026-06-15',
    estimatedArrivalDate: '2026-07-05',
    currency: 'EUR',
    exchangeRate: 3.42,
    items: [
      { id: 'demo-item_3', productName: 'Vanne Haute Pression V3', quantity: 120, fobUnitPrice: 85.0, foreignCurrencyRate: 3.42, customsDutyRate: 20, vatRate: 19 },
      { id: 'demo-item_4', productName: 'Joint Torique Graphene', quantity: 2000, fobUnitPrice: 1.2, foreignCurrencyRate: 3.42, customsDutyRate: 5, vatRate: 19 }
    ],
    freightCostTND: 0,
    customsDutiesTND: 12400,
    transitterFeesTND: 1500,
    handlingFeesTND: 1100,
    insuranceCostTND: 0,
    otherFeesTND: 450
  },
  {
    id: 'demo-imp_3',
    reference: 'IMP-2026-003 (Démo)',
    folderType: 'Import',
    supplierName: 'Hamburg Raw Materials Ltd',
    originCountry: 'Allemagne',
    incoterm: 'EXW',
    portOfArrival: 'Radès',
    transitterName: 'STTL',
    status: 'Cleared',
    creationDate: '2026-05-10',
    estimatedArrivalDate: '2026-06-20',
    currency: 'EUR',
    exchangeRate: 3.41,
    items: [
      { id: 'demo-item_5', productName: 'Résine Synthétique Premium', quantity: 5000, fobUnitPrice: 2.1, foreignCurrencyRate: 3.41, customsDutyRate: 15, vatRate: 19 }
    ],
    freightCostTND: 8500,
    customsDutiesTND: 14600,
    transitterFeesTND: 1800,
    handlingFeesTND: 1200,
    insuranceCostTND: 1100,
    otherFeesTND: 600
  },
  {
    id: 'demo-exp_1',
    reference: 'EXP-2026-001 (Démo)',
    folderType: 'Export',
    clientName: 'Tripoli Polymer Trading',
    destinationCountry: 'Libye',
    incoterm: 'FOB',
    portOfDeparture: 'Sfax',
    transitterName: 'Sfax Douane Services',
    status: 'Transit',
    creationDate: '2026-06-10',
    estimatedArrivalDate: '2026-07-01',
    currency: 'USD',
    exchangeRate: 3.12,
    items: [
      { id: 'demo-exp-item_1', productName: 'Résine Polyéthylène Haute Densité (PEHD)', quantity: 4000, fobUnitPrice: 1.80, foreignCurrencyRate: 3.12, customsDutyRate: 0, vatRate: 0 }
    ],
    freightCostTND: 0,
    customsDutiesTND: 0,
    transitterFeesTND: 650,
    handlingFeesTND: 450,
    insuranceCostTND: 0,
    otherFeesTND: 150
  },
  {
    id: 'demo-exp_2',
    reference: 'EXP-2026-002 (Démo)',
    folderType: 'Export',
    clientName: 'Algeria Chemical Corp',
    destinationCountry: 'Algérie',
    incoterm: 'CIF',
    portOfDeparture: 'Radès',
    transitterName: 'STTL',
    status: 'Customs',
    creationDate: '2026-06-18',
    estimatedArrivalDate: '2026-06-29',
    currency: 'EUR',
    exchangeRate: 3.42,
    items: [
      { id: 'demo-exp-item_2', productName: 'Adjuvants Ciment Spécifiques', quantity: 12000, fobUnitPrice: 0.95, foreignCurrencyRate: 3.42, customsDutyRate: 0, vatRate: 0 }
    ],
    freightCostTND: 3800,
    customsDutiesTND: 0,
    transitterFeesTND: 850,
    handlingFeesTND: 550,
    insuranceCostTND: 400,
    otherFeesTND: 200
  }
];

const DEFAULT_LC_REQUESTS: LCRequest[] = [
  {
    id: 'demo-lc_1',
    importFolderId: 'demo-imp_1',
    folderType: 'Import',
    lcReference: 'BIAT-CDOC-2026-0819 (Démo)',
    proformaInvoiceRef: 'PROFORMA-MC-1029',
    proformaInvoiceDate: '2026-05-25',
    issuingBank: 'Banque Internationale Arabe de Tunisie (BIAT) - Agence Sfax El Jadida',
    beneficiaryName: 'Marseille Chimie SAS',
    beneficiaryAddress: 'Avenue de l\'Exportation, Zone Portuaire, 13002 Marseille, France',
    advisingBank: 'BNP Paribas - Agence Marseille Joliette',
    amount: 16350,
    currency: 'EUR',
    paymentTerms: 'At Sight',
    expiryDate: '2026-08-30',
    shipmentDeadline: '2026-06-30',
    portOfLoading: 'Port de Marseille, France',
    portOfDischarge: 'Radès',
    status: 'Opened',
    requiredDocuments: [
      'Facture Commerciale signée en 3 exemplaires originaux',
      'Jeu complet de Connaissement Maritime (Bill of Lading) "Clean on Board" à l\'ordre de la BIAT',
      'Certificat de circulation des marchandises EUR.1 visé par la douane française',
      'Note de colisage (Packing List) détaillée',
      'Certificat d\'analyse chimique des solvants'
    ],
    additionalConditions: 'Expéditions partielles autorisées. Transbordement interdit. Tous les frais bancaires hors de Tunisie sont à la charge du bénéficiaire.',
    creationDate: '2026-05-28'
  },
  {
    id: 'demo-lc_2',
    importFolderId: 'demo-imp_2',
    folderType: 'Import',
    lcReference: 'AMEN-CDOC-2026-0922 (Démo)',
    proformaInvoiceRef: 'PI-2026-VALVES-12',
    proformaInvoiceDate: '2026-06-10',
    issuingBank: 'AMEN BANK - Agence Tunis Berges du Lac',
    beneficiaryName: 'Genoa Industrial Valves',
    beneficiaryAddress: 'Via della Logistica, Calata Sanità, 16126 Genova, Italie',
    advisingBank: 'UniCredit SpA - Sede di Genova',
    amount: 12600,
    currency: 'EUR',
    paymentTerms: 'Deferred 90 Days',
    expiryDate: '2026-09-15',
    shipmentDeadline: '2026-07-15',
    portOfLoading: 'Port de Gênes, Italie',
    portOfDischarge: 'Sfax',
    status: 'Submitted',
    requiredDocuments: [
      'Facture Commerciale signée certifiant l\'origine des marchandises',
      'Connaissement Maritime Original signé "Freight Prepaid"',
      'Certificat d\'Origine EUR.1 original',
      'Note de poids détaillée'
    ],
    additionalConditions: 'Paiement à 90 jours de la date de connaissement. Acceptation bancaire obligatoire.',
    creationDate: '2026-06-12'
  },
  {
    id: 'demo-lc_export_1',
    importFolderId: 'demo-exp_1',
    folderType: 'Export',
    lcReference: 'W-TRIP-2026-EXP72 (Démo Export)',
    proformaInvoiceRef: 'PI-ELYSSA-EXP-2026-89',
    proformaInvoiceDate: '2026-06-05',
    issuingBank: 'Wahda Bank - Tripoli, Libya',
    beneficiaryName: 'Elyssa Distribution S.A.',
    beneficiaryAddress: 'Zone Industrielle Ghannouch, Sfax, Tunisie',
    advisingBank: 'Banque Nationale Agricole (BNA) - Agence Tunis Berges du Lac',
    amount: 7200,
    currency: 'USD',
    paymentTerms: 'At Sight',
    expiryDate: '2026-08-15',
    shipmentDeadline: '2026-07-10',
    portOfLoading: 'Port de Sfax, Tunisie',
    portOfDischarge: 'Enfidha',
    status: 'Opened',
    requiredDocuments: [
      'Facture Commerciale signée en 3 exemplaires originaux certifiée par la Chambre de Commerce',
      'Connaissement Maritime Original (Bill of Lading) Clean on Board à l\'ordre de Wahda Bank',
      'Certificat d\'Origine délivré par l\'UTICA',
      'Note de colisage détaillée',
      'Certificat phytosanitaire officiel'
    ],
    additionalConditions: 'Tous les documents doivent mentionner le numéro d\'autorisation d\'exportation de la BCT.',
    creationDate: '2026-06-08'
  }
];

// Component imports
import { AppLaunchpad } from './components/AppLaunchpad';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import ComplaintManager from './components/ComplaintManager';
import BillingManager from './components/BillingManager';
import MarketIntelligence from './components/MarketIntelligence';
import ReportsManager from './components/ReportsManager';
import AdminConsole from './components/AdminConsole';
import StockManager from './components/StockManager';
import CommunicationHub from './components/CommunicationHub';
import PilotageManager from './components/PilotageManager';
import LoginPage from './components/LoginPage';
import FinanceManager from './components/FinanceManager';
import UserGuide from './components/UserGuide';
import InvestmentManager from './components/InvestmentManager';
import PayrollManager from './components/PayrollManager';
import GedManager from './components/GedManager';
import FleetManager from './components/FleetManager';
import TransitLogistiqueManager from './components/TransitLogistiqueManager';
import SaaSConfig, { PACKS_DEFINITIONS } from './components/SaaSConfig';
import CollaboratorConsole from './components/CollaboratorConsole';
import AttendanceManager from './components/AttendanceManager';
import PocketAttendanceView from './components/PocketAttendanceView';
import LandingPage from './components/LandingPage';
import LockedModuleScreen from './components/LockedModuleScreen';
import { LockedModulePage } from './components/LockedModulePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ElyssaLogo } from './components/ElyssaLogo';
import SmartPOS from './components/SmartPOS';
import { CessionManager } from './components/CessionManager';
import ProductionManager from './components/ProductionManager';
import PurchasingManager from './components/PurchasingManager';
import AssetManager from './components/AssetManager';
import TreasuryManager from './components/TreasuryManager';
import TejIntegration from './components/TejIntegration';
import BusinessPlanManager from './components/BusinessPlanManager';
import JuridiqueManager from './components/JuridiqueManager';
import PortailClientManager from './components/PortailClientManager';
import PerformanceManager from './components/PerformanceManager';
import { DEFAULT_DEMO_PERFORMANCE_CONTRACTS } from './services/performanceContractService';
import { PerformanceContract } from './types';
import { MobileTerrainDashboard } from './pages/admin/MobileTerrainDashboard';
import { FleetAssetManager } from './components/FleetAssetManager';
import { DispatchManager } from './components/DispatchManager';
import { WarehousePickingScreen } from './components/WarehousePickingScreen';
import AccountantPortal from './components/AccountantPortal';
import { canAccess } from './utils/auth_utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './utils/firebase';


import { 
  Building2, 
  Users, 
  AlertTriangle, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  Activity, 
  UserCheck,
  Package,
  Mail,
  Target,
  Award,
  LogOut,
  KeyRound,
  Calculator,
  BookOpen,
  Car,
  Clock,
  Lock,
  ArrowRight,
  ShieldAlert,
  Globe,
  Building,
  ArrowRightLeft,
  Cog,
  ShoppingCart,
  Briefcase,
  Plus,
  Trash2,
  Send,
  Scale,
  Sparkles,
  Smartphone,
  Grid,
  LayoutGrid,
  Boxes,
  Truck,
  Zap,
  FolderKey,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getActiveCompanyNameFromStorage = (): string => {
  try {
    const savedSession = window.localStorage.getItem('carthage_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      if (parsed) {
        if (parsed.role === 'SuperAdmin') {
          return window.localStorage.getItem('carthage_active_company_simulated') || 'Inter-Affaires';
        }
        const collabsSaved = window.localStorage.getItem('carthage_collaborators');
        if (collabsSaved) {
          const collabs = JSON.parse(collabsSaved);
          const found = collabs.find((c: any) => c?.email?.toLowerCase() === parsed?.email?.toLowerCase());
          if (found && found.company) {
            return found.company;
          }
        }
      }
    }
  } catch (e) {}
  return 'Inter-Affaires';
};

const companySpecificKeys = [
  'carthage_employees', 'carthage_documents', 'carthage_clients', 'carthage_complaints',
  'carthage_invoices', 'carthage_visit_reports', 'carthage_competitors', 'carthage_suppliers',
  'carthage_products', 'carthage_stock_movements', 'carthage_smtp_settings', 'carthage_imap_settings',
  'carthage_incoming_emails', 'carthage_email_templates', 'carthage_communication_logs',
  'carthage_bank_accounts', 'carthage_bank_transactions', 'carthage_tax_declarations',
  'carthage_year_end_closings',
  'carthage_assets_immobilisations', 'carthage_cession_entries',
  'carthage_production_nomenclatures', 'carthage_production_manufacturing_orders',
  'carthage_purchasing_requisitions', 'carthage_purchasing_orders', 'carthage_purchasing_suppliers_performance',
  'carthage_assets_is_rate', 'carthage_assets_locations', 'carthage_assets_categories_config',
  'carthage_production_settings_lines_v2', 'carthage_production_settings_teams_v2', 'carthage_production_settings_categories_v2',
  'carthage_purchasing_fodec_rate', 'carthage_purchasing_approval_threshold', 'carthage_purchasing_stamp_duty'
];

const clearAppCache = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        // Interdiction formelle de toucher aux clés de session Firebase ou autres jetons d'authentification
        if (
          key.startsWith('firebase:authUser:') || 
          key.startsWith('firebase:') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('auth')
        ) {
          continue;
        }
        
        // Préserver la session et le contexte utilisateur de l'application
        if (
          key === 'carthage_session' || 
          key === 'carthage_current_user' || 
          key === 'carthage_active_company_name' ||
          key === 'carthage_active_company_simulated' ||
          key === 'carthage_publisher_clients' ||
          key === 'carthage_licence_requests' ||
          key === 'carthage_admin_alerts' ||
          key === 'carthage_demo_simulation_active' ||
          key.includes('prospect')
        ) {
          continue;
        }

        // Nettoyer uniquement les clés de données de l'application (carthage_* et elyssa_*) et les caches spécifiés
        if (
          key.startsWith('carthage_') || 
          key.startsWith('elyssa_') || 
          key.includes('app_data') || 
          key.includes('dashboard_cache') || 
          key.includes('is_demo_loaded')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
    });
  } catch (e) {}
};

const resetAllStates = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        // Interdiction formelle de toucher aux clés de session Firebase ou autres jetons d'authentification
        if (
          key.startsWith('firebase:authUser:') || 
          key.startsWith('firebase:') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('auth')
        ) {
          continue;
        }
        
        // Préserver uniquement la session d'authentification utilisateur
        if (key === 'carthage_session' || key === 'carthage_current_user') {
          continue;
        }

        if (
          key.startsWith('carthage_') || 
          key.startsWith('elyssa_') || 
          key.includes('app_data') || 
          key.includes('dashboard_cache') || 
          key.includes('is_demo_loaded')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
    });
    console.log('[Cache Reset] resetAllStates() executed. Permanently wiped matching carthage_ and elyssa_ cache keys.');
  } catch (e) {}
};

const isDynamicPersistenceDisallowed = (key: string): boolean => {
  const k = key.toLowerCase();
  // Strictly prevent any local persistence of dynamic collaborator, employee, absence, contract, payroll, purchasing, production or general ERP collection data
  return (
    k.includes('collaborator') ||
    k.includes('employee') ||
    k.includes('contract') ||
    k.includes('absence') ||
    k.includes('payslip') ||
    k.includes('purchasing') ||
    k.includes('production') ||
    k.includes('requisition') ||
    k.includes('order') ||
    k.includes('nomenclature') ||
    k.includes('manufacturing') ||
    k.includes('client') ||
    k.includes('complaint') ||
    k.includes('invoice') ||
    k.includes('visit_report') ||
    k.includes('competitor') ||
    k.includes('supplier') ||
    k.includes('product') ||
    k.includes('stock_movement') ||
    k.includes('incoming_email') ||
    k.includes('email_template') ||
    k.includes('communication_log') ||
    k.includes('bank_account') ||
    k.includes('bank_transaction') ||
    k.includes('tax_declaration') ||
    k.includes('year_end_closing') ||
    k.includes('document')
  );
};

const scopedStorage = {
  getItem: (key: string): string | null => {
    if (isDynamicPersistenceDisallowed(key)) {
      console.log(`[Storage Blocked] Reading blocked for dynamic key: ${key}`);
      return null;
    }
    if (companySpecificKeys.includes(key)) {
      const activeCompany = getActiveCompanyNameFromStorage();
      const suffix = activeCompany.toLowerCase().replace(/[^a-z0-9]/g, '_');
      return window.localStorage.getItem(`${key}_${suffix}`);
    }
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (isDynamicPersistenceDisallowed(key)) {
      console.log(`[Storage Blocked] Writing blocked for dynamic key: ${key}`);
      return;
    }
    if (companySpecificKeys.includes(key)) {
      const activeCompany = getActiveCompanyNameFromStorage();
      const suffix = activeCompany.toLowerCase().replace(/[^a-z0-9]/g, '_');
      window.localStorage.setItem(`${key}_${suffix}`, value);
      return;
    }
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (isDynamicPersistenceDisallowed(key)) {
      console.log(`[Storage Blocked] Deletion blocked for dynamic key: ${key}`);
      return;
    }
    if (companySpecificKeys.includes(key)) {
      const activeCompany = getActiveCompanyNameFromStorage();
      const suffix = activeCompany.toLowerCase().replace(/[^a-z0-9]/g, '_');
      window.localStorage.removeItem(`${key}_${suffix}`);
      return;
    }
    window.localStorage.removeItem(key);
  },
  clear: (): void => {
    clearAppCache();
  }
};

const localStorage = scopedStorage;

export const fetchWithRetry = async (url: string, options?: RequestInit, retries = 6, delay = 1500): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
};

// Custom Hook for Firestore direct fetch, bypassing any local caching or fallbacks
export function useFetchData(activeCompanyName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (onSuccess: (data: any) => void, onCollabsSuccess: (data: any[]) => void) => {
    if (!activeCompanyName) return null;
    setLoading(true);
    setError(null);
    try {
      // Get companyId from stored session
      let companyId = "";
      try {
        const savedSession = localStorage.getItem('carthage_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          companyId = parsed?.companyId || parsed?.company_id || "";
        }
      } catch (e) {}

      const headers: Record<string, string> = {};
      if (companyId) {
        headers['x-company-id'] = companyId;
      }

      // 1. Direct GET request to company-data on Firestore, adding random timestamp query to force network/bypass browser cache
      const res = await fetchWithRetry(`/api/db/company-data?company=${encodeURIComponent(activeCompanyName)}&nocache=${Date.now()}`, {
        headers
      });
      let companyData = null;
      if (res.ok) {
        const resData = await res.json();
        if (resData) {
          companyData = resData;
          onSuccess(resData);
        }
      }

      // 2. Direct GET request to collaborators on Firestore
      const collabsRes = await fetchWithRetry(`/api/db/collaborators?company=${encodeURIComponent(activeCompanyName)}&nocache=${Date.now()}`, {
        headers
      });
      if (collabsRes.ok) {
        const collabsData = await collabsRes.json();
        if (Array.isArray(collabsData)) {
          onCollabsSuccess(collabsData);
        }
      }
      return companyData;
    } catch (err: any) {
      console.warn('[useFetchData] Failed direct Firestore query:', err);
      setError(err?.message || String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeCompanyName]);

  return { fetchData, loading, error };
}

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const savedSession = localStorage.getItem('carthage_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      let companyId = parsed?.companyId || parsed?.company_id;
      
      // SuperAdmin check: Use the simulated company's ID if simulating, otherwise fall back to parent company ID
      if (parsed?.role === 'SuperAdmin' || parsed?.email?.toLowerCase() === 'admin@elyssa.pro' || parsed?.email?.toLowerCase() === 'contact@elyssa.pro') {
        const simulatedName = localStorage.getItem('carthage_active_company_simulated') || 'Inter-Affaires';
        if (simulatedName && simulatedName !== 'Inter-Affaires') {
          const clientsStr = localStorage.getItem('carthage_publisher_clients');
          if (clientsStr) {
            try {
              const clients = JSON.parse(clientsStr);
              const matched = clients.find((c: any) => c.companyName?.toLowerCase() === simulatedName.toLowerCase());
              if (matched && (matched.id || matched.company_id)) {
                companyId = matched.id || matched.company_id;
              }
            } catch (err) {}
          }
        } else {
          companyId = 'pc-parent-elyssa';
        }
      }
      
      if (companyId) {
        headers['x-company-id'] = companyId;
      }
    } else {
      const prospect = localStorage.getItem('carthage_trial_registered_prospect');
      if (prospect) {
        const parsed = JSON.parse(prospect);
        const clientsStr = localStorage.getItem('carthage_publisher_clients');
        if (clientsStr) {
          const clients = JSON.parse(clientsStr);
          const matched = clients.find((c: any) => c.companyName?.toLowerCase() === parsed.companyName?.toLowerCase());
          if (matched && (matched.id || matched.company_id)) {
            headers['x-company-id'] = matched.id || matched.company_id;
          }
        }
        headers['x-is-trial-signup'] = 'true';
      }
    }
  } catch (e) {}
  return headers;
};

const getCompleteDemoPayload = (companyName: string) => {
  const companyTemplates = INITIAL_EMAIL_TEMPLATES.map(t => ({
    ...t,
    subject: t.subject ? t.subject.replace(/Elyssa Entreprises S\.A\./g, companyName) : "",
    body: t.body ? t.body.replace(/Elyssa Entreprises S\.A\./g, companyName) : ""
  }));

  const demoClientsMapped = INITIAL_CLIENTS.map(c => ({
    ...c,
    id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`,
    engagements: (c.engagements || []).map(e => ({
      ...e,
      id: e.id.startsWith('demo-') ? e.id : `demo-${e.id}`
    }))
  }));

  const demoVisitReportsMapped = INITIAL_VISIT_REPORTS.map(v => ({
    ...v,
    id: v.id.startsWith('demo-') ? v.id : `demo-${v.id}`,
    clientId: v.clientId.startsWith('demo-') ? v.clientId : `demo-${v.clientId}`
  }));

  const demoComplaintsMapped = INITIAL_COMPLAINTS.map(c => ({
    ...c,
    id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`,
    clientId: c.clientId.startsWith('demo-') ? c.clientId : `demo-${c.clientId}`
  }));

  const demoInvoicesMapped = INITIAL_INVOICES.map(i => ({
    ...i,
    id: i.id.startsWith('demo-') ? i.id : `demo-${i.id}`,
    clientId: i.clientId.startsWith('demo-') ? i.clientId : `demo-${i.clientId}`,
    recouvrementSteps: (i.recouvrementSteps || []).map(s => ({
      ...s,
      id: s.id.startsWith('demo-') ? s.id : `demo-${s.id}`
    }))
  }));

  const demoLogs = INITIAL_COMMUNICATION_LOGS || [];

  const demoProductsMapped = INITIAL_PRODUCTS.map(p => ({
    ...p,
    id: p.id.startsWith('demo-') ? p.id : `demo-${p.id}`
  }));

  const demoStockMovementsMapped = INITIAL_STOCK_MOVEMENTS.map(s => ({
    ...s,
    id: s.id.startsWith('demo-') ? s.id : `demo-${s.id}`,
    productId: s.productId.startsWith('demo-') ? s.productId : `demo-${s.productId}`
  }));

  const demoCompetitorsMapped = INITIAL_COMPETITORS.map(c => ({
    ...c,
    id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`
  }));

  const demoTaxDeclarationsMapped = INITIAL_TAX_DECLARATIONS.map(t => ({
    ...t,
    id: t.id.startsWith('demo-') ? t.id : `demo-${t.id}`
  }));

  const isInter = companyName?.toLowerCase().includes('inter') || companyName?.toLowerCase().includes('elyssa');
  const cleanDomain = companyName ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) : 'entreprise';
  const domain = isInter ? 'inter-affaires.tn' : `${cleanDomain || 'entreprise'}.tn`;
  const suffix = companyName ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default';

  let demoEmployees: Employee[] = [
    {
      id: `demo-emp_${suffix}_1`,
      name: 'Khaled Ben Amor',
      email: `k.benamor@${domain}`,
      jobTitle: 'Directeur Financier & Recouvrement',
      ssn: '14839211-92',
      rib: '03001010015920038472',
      baseSalary: 2600.000,
      transportAllowance: 180.000,
      presenceAllowance: 80.000,
      otherAllowances: 300.000,
      familySituation: 'Married_2',
      isChefDeFamille: true,
      status: 'Active',
      hiringDate: '2023-01-15',
      company: companyName
    },
    {
      id: `demo-emp_${suffix}_2`,
      name: 'Ines Dridi',
      email: `i.dridi@${domain}`,
      jobTitle: 'Responsable Rapprochement',
      ssn: '20943810-18',
      rib: '08102030026710048259',
      baseSalary: 1750.000,
      transportAllowance: 120.000,
      presenceAllowance: 80.000,
      otherAllowances: 150.000,
      familySituation: 'Single',
      isChefDeFamille: false,
      status: 'Active',
      hiringDate: '2024-03-10',
      company: companyName
    },
    {
      id: `demo-emp_${suffix}_3`,
      name: 'Mohamed Ali Gharbi',
      email: `m.gharbi@${domain}`,
      jobTitle: 'Chargé Clientèle Extérieure',
      ssn: '12554739-44',
      rib: '12004050037840059341',
      baseSalary: 1400.000,
      transportAllowance: 110.000,
      presenceAllowance: 80.000,
      otherAllowances: 100.000,
      familySituation: 'Married_1',
      isChefDeFamille: true,
      status: 'Active',
      hiringDate: '2025-06-18',
      company: companyName
    },
    {
      id: `demo-emp_${suffix}_4`,
      name: 'Amel Ben Soltane',
      email: `a.bensoltane@${domain}`,
      jobTitle: 'Responsable Ressources Humaines',
      ssn: '19483029-45',
      rib: '05201040059283749501',
      baseSalary: 2100.000,
      transportAllowance: 150.000,
      presenceAllowance: 80.000,
      otherAllowances: 200.000,
      familySituation: 'Married_3',
      isChefDeFamille: true,
      status: 'Active',
      hiringDate: '2024-11-01',
      company: companyName
    },
    {
      id: `demo-emp_${suffix}_5`,
      name: 'Sami Mansour',
      email: `s.mansour@${domain}`,
      jobTitle: 'Développeur ERP Principal',
      ssn: '11049382-77',
      rib: '14102030048592837410',
      baseSalary: 3200.000,
      transportAllowance: 200.000,
      presenceAllowance: 80.000,
      otherAllowances: 500.000,
      familySituation: 'Single',
      isChefDeFamille: false,
      status: 'Active',
      hiringDate: '2025-01-10',
      company: companyName
    },
    {
      id: 'EMP-904',
      matricule: 'EMP-904',
      name: 'Sami Ben Ali',
      email: `s.benali@${domain}`,
      jobTitle: 'Commercial IT (Van Sales)',
      department: 'Commercial & Distribution',
      ssn: '14839211-92',
      cin: '08912345',
      rib: '03001010015920038472',
      baseSalary: 1850.000,
      transportAllowance: 150.000,
      presenceAllowance: 80.000,
      otherAllowances: 120.000,
      familySituation: 'Married_2',
      isChefDeFamille: true,
      status: 'Active',
      hiringDate: '2024-01-15',
      company: companyName
    },
    {
      id: 'EMP-912',
      matricule: 'EMP-912',
      name: 'Mohamed Trabelsi',
      email: `m.trabelsi@${domain}`,
      jobTitle: 'Chef de Chantier BTP',
      department: 'Operations Chantier',
      ssn: '12938401-44',
      cin: '07829102',
      rib: '08102030026710048259',
      baseSalary: 2200.000,
      transportAllowance: 180.000,
      presenceAllowance: 80.000,
      otherAllowances: 200.000,
      familySituation: 'Married_1',
      isChefDeFamille: true,
      status: 'Active',
      hiringDate: '2023-09-01',
      company: companyName
    },
    {
      id: 'EMP-920',
      matricule: 'EMP-920',
      name: 'Youssef Mansour',
      email: `y.mansour@${domain}`,
      jobTitle: 'Chauffeur Livreur',
      department: 'Logistique Van Sales',
      ssn: '18294019-33',
      cin: '06928103',
      rib: '12004050037840059341',
      baseSalary: 1450.000,
      transportAllowance: 120.000,
      presenceAllowance: 80.000,
      otherAllowances: 100.000,
      familySituation: 'Single',
      isChefDeFamille: false,
      status: 'Active',
      hiringDate: '2024-05-10',
      company: companyName
    },
    {
      id: 'EMP-935',
      matricule: 'EMP-935',
      name: 'Karem Chaabane',
      email: `k.chaabane@${domain}`,
      jobTitle: 'Technicien de Maintenance Itinérant',
      department: 'Services Techniques',
      ssn: '19382019-55',
      cin: '09182736',
      rib: '05201040059283749501',
      baseSalary: 1650.000,
      transportAllowance: 140.000,
      presenceAllowance: 80.000,
      otherAllowances: 150.000,
      familySituation: 'Married_2',
      isChefDeFamille: true,
      status: 'Active',
      hiringDate: '2024-02-01',
      company: companyName
    },
    {
      id: 'EMP-942',
      matricule: 'EMP-942',
      name: 'Fatma Gharbi',
      email: `f.gharbi@${domain}`,
      jobTitle: 'Inspectrice Qualité Terrain',
      department: 'Assurance Qualité',
      ssn: '20192837-88',
      cin: '08273645',
      rib: '03001010015920038472',
      baseSalary: 1950.000,
      transportAllowance: 160.000,
      presenceAllowance: 80.000,
      otherAllowances: 180.000,
      familySituation: 'Single',
      isChefDeFamille: false,
      status: 'Active',
      hiringDate: '2023-11-15',
      company: companyName
    },
    {
      id: 'emp_drv_01',
      matricule: 'EMP-0101',
      name: 'Kamel Trad',
      email: `k.trad@${domain}`,
      jobTitle: 'Chauffeur Logistique Poids Lourds',
      department: 'Logistique & Transit',
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
      company: companyName
    },
    {
      id: 'emp_drv_02',
      matricule: 'EMP-0102',
      name: 'Hamza Ben Salem',
      email: `h.bensalem@${domain}`,
      jobTitle: 'Livreur / Express',
      department: 'Logistique & Distribution',
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
      company: companyName
    },
    {
      id: 'emp_drv_03',
      matricule: 'EMP-0103',
      name: 'Youssef Chahed',
      email: `y.chahed@${domain}`,
      jobTitle: 'Chauffeur Toupie & Chantier',
      department: 'Operations Chantier',
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
      company: companyName
    },
    {
      id: 'emp_drv_04',
      matricule: 'EMP-0104',
      name: 'Nizar Trabelsi',
      email: `n.trabelsi@${domain}`,
      jobTitle: 'Conducteur Utilitaire',
      department: 'Logistique & Transit',
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
      company: companyName
    }
  ];



  const demoFolders = [
    {
      id: 'demo-imp_1',
      reference: 'IMP-2026-001 (Démo)',
      folderType: 'Import',
      supplierName: 'Marseille Chimie SAS',
      originCountry: 'France',
      incoterm: 'FOB',
      portOfArrival: 'Radès',
      transitterName: 'Société Tunisienne de Transit & Logistique (STTL)',
      status: 'Customs',
      creationDate: '2026-06-01',
      estimatedArrivalDate: '2026-06-30',
      currency: 'EUR',
      exchangeRate: 3.42,
      items: [
        { id: 'demo-item_1', productName: 'Solvant Éco Purifié', quantity: 1500, fobUnitPrice: 4.5, foreignCurrencyRate: 3.42, customsDutyRate: 15, vatRate: 19 }
      ],
      freightCostTND: 4200,
      customsDutiesTND: 8150,
      transitterFeesTND: 1200,
      handlingFeesTND: 850,
      insuranceCostTND: 650,
      otherFeesTND: 300
    }
  ];

  const demoLc = [
    {
      id: 'demo-lc_1',
      importFolderId: 'demo-imp_1',
      folderType: 'Import',
      lcReference: 'BIAT-CDOC-2026-0819 (Démo)',
      proformaInvoiceRef: 'PROFORMA-MC-1029',
      proformaInvoiceDate: '2026-05-25',
      issuingBank: 'Banque Internationale Arabe de Tunisie (BIAT) - Agence Sfax El Jadida',
      beneficiaryName: 'Marseille Chimie SAS',
      beneficiaryAddress: 'Avenue de l\'Exportation, Zone Portuaire, 13002 Marseille, France',
      advisingBank: 'BNP Paribas - Agence Marseille Joliette',
      amount: 16350,
      currency: 'EUR',
      paymentTerms: 'At Sight',
      expiryDate: '2026-08-30',
      shipmentDeadline: '2026-06-30',
      portOfLoading: 'Port de Marseille, France',
      portOfDischarge: 'Radès',
      status: 'Opened',
      requiredDocuments: [
        'Facture Commerciale signée en 3 exemplaires originaux'
      ],
      additionalConditions: 'Expéditions partielles autorisées.',
      creationDate: '2026-05-28'
    }
  ];

  const demoRequisitions = [
    { id: 'demo-req_1', title: 'Achat de 5 tonnes de carton ondulé', requester: 'Sami Mansour (Démo)', department: 'Logistique', estimatedCost: 15000, priority: 'High', status: 'Approved', creationDate: '2026-06-10' }
  ];

  const demoOrders = [
    { id: 'demo-po_1', requisitionId: 'demo-req_1', supplierName: 'SOPAL Tunisie', orderDate: '2026-06-12', totalAmount: 14800, status: 'Sent', paymentTerms: '60 jours fin de mois' }
  ];

  const demoPerformance = [
    { id: 'demo-perf_1', supplierId: 'demo-sup_1', name: 'SOPAL Tunisie', category: 'Plomberie & Chauffage', score: 92, delayRate: 5, nonConformityRate: 2 }
  ];

  const demoNomenclatures = [
    { id: 'demo-nom_1', productName: 'Table de bureau premium', version: 'v1.0', componentsCount: 5, status: 'Approved', lastUpdated: '2026-05-20' }
  ];

  const demoMO = [
    { id: 'demo-mo_1', nomenclatureId: 'demo-nom_1', productName: 'Table de bureau premium', quantity: 50, startDate: '2026-06-15', dueDate: '2026-07-15', status: 'InProgress', supervisor: 'Khaled Ben Amor (Démo)' }
  ];

  const demoAssets = [
    { id: 'demo-ast_1', code: 'IM-2026-001', name: 'Serveur de données Dell PowerEdge', category: 'MaterielInformatique', acquisitionDate: '2026-01-15', acquisitionValue: 8500, status: 'Active', residualValue: 6800 }
  ];

  const isSFE = companyName?.toLowerCase().includes('sfe') || companyName?.toLowerCase().includes('fabrication');
  const isSfax = companyName?.toLowerCase().includes('sfax') || companyName?.toLowerCase().includes('distrib');
  const isSahel = companyName?.toLowerCase().includes('sahel') || companyName?.toLowerCase().includes('batiment');
  const isGTS = companyName?.toLowerCase().includes('gts') || companyName?.toLowerCase().includes('transport');

  // Multi-Tenant Differentiated Employees & GED Docs generator according to exact Pack Cabinet specs:
  // SFE: 18 salariés | Masse brute: 41 200 DT | 14 pièces GED en attente | TEJ: Validée
  // Sfax Distribution: 8 salariés | Masse brute: 16 850 DT | 32 pièces GED en attente | TVA/G50: En retard
  // Bâtiment Sahel: 12 salariés | Masse brute: 24 600 DT | 8 pièces GED en attente | TEJ: En attente
  // GTS: 6 salariés | Masse brute: 12 300 DT | 21 pièces GED en attente | CNSS: À vérifier
  let targetEmpCount = 10;
  let targetMasseBrute = 22000;
  let targetGedCount = 5;

  if (isSFE) {
    targetEmpCount = 18;
    targetMasseBrute = 41200;
    targetGedCount = 14;
  } else if (isSfax) {
    targetEmpCount = 8;
    targetMasseBrute = 16850;
    targetGedCount = 32;
  } else if (isSahel) {
    targetEmpCount = 12;
    targetMasseBrute = 24600;
    targetGedCount = 8;
  } else if (isGTS) {
    targetEmpCount = 6;
    targetMasseBrute = 12300;
    targetGedCount = 21;
  }

  const generatedEmployees: Employee[] = [];
  const basePerEmp = Math.floor((targetMasseBrute * 0.75) / targetEmpCount);
  const allowPerEmp = Math.floor((targetMasseBrute * 0.25) / targetEmpCount);
  const remainder = targetMasseBrute - (basePerEmp + allowPerEmp) * targetEmpCount;

  const rolesList = [
    'Directeur Général', 'Responsable Financier', 'Chef Comptable', 'Ingénieur Qualité',
    'Responsable Transit', 'Chauffeur Poids Lourds', 'Commercial Senior', 'Technicien Maintenance',
    'Magasinier Principal', 'Assistant RH', 'Opérateur Saisie', 'Contrôleur de Gestion',
    'Responsable Achats', 'Chef d\'Atelier', 'Superviseur Logistique', 'Auditeur Interne',
    'Inspecteur Sécurité', 'Chargé Clientèle'
  ];

  for (let i = 0; i < targetEmpCount; i++) {
    const isLast = i === targetEmpCount - 1;
    const baseVal = basePerEmp + (isLast ? remainder : 0);
    generatedEmployees.push({
      id: `demo-emp_${suffix}_${i + 1}`,
      matricule: `EMP-${(100 + i + 1)}`,
      name: `Collaborateur ${i + 1} (${companyName || 'Cabinet'})`,
      email: `emp${i + 1}@${domain}`,
      jobTitle: rolesList[i % rolesList.length],
      department: i % 2 === 0 ? 'Direction Operations' : 'Administration & Finances',
      ssn: `148392${10 + i}-92`,
      cin: `089123${10 + i}`,
      rib: `030010100159200${3800 + i}`,
      baseSalary: baseVal,
      transportAllowance: Math.floor(allowPerEmp * 0.6),
      presenceAllowance: Math.floor(allowPerEmp * 0.4),
      otherAllowances: 0,
      familySituation: i % 2 === 0 ? 'Married_2' : 'Single',
      isChefDeFamille: i % 2 === 0,
      status: 'Active',
      hiringDate: '2023-01-15',
      company: companyName
    });
  }

  const generatedDocs: any[] = [];
  const docCategories = ['Facture Fournisseur', 'Relevé Bancaire', 'Contrat Commercial', 'Déclaration Fiscale', 'Bon de Livraison'];
  for (let k = 0; k < targetGedCount; k++) {
    generatedDocs.push({
      id: `demo-doc_${suffix}_${k + 1}`,
      name: `Pièce_Comptable_EnAttente_${k + 1}_${suffix.toUpperCase()}`,
      type: k % 2 === 0 ? "Invoice" : "Contract",
      fileSize: `${120 + (k * 15)} KB`,
      fileType: "application/pdf",
      uploadDate: `2026-08-${String((k % 12) + 1).padStart(2, '0')}`,
      linkedToType: "Client",
      linkedToId: `cli_${suffix}_1`,
      linkedToName: companyName || "Dossier Client",
      description: `Document numérisé en attente de validation comptable (${docCategories[k % docCategories.length]}).`,
      version: 1,
      status: 'Unprocessed',
      uploadedBy: `contact@${domain}`
    });
  }

  demoEmployees = generatedEmployees;

  const demoContractsList = generatedEmployees.slice(0, 3).map((emp, idx) => ({
    id: `demo-ct_${suffix}_${idx + 1}`,
    employeeId: emp.id,
    employeeName: emp.name,
    contractType: 'CDI',
    startDate: '2023-01-15',
    trialPeriodMonths: 3,
    baseSalary: emp.baseSalary,
    status: 'Signed',
    dutiesDescription: `Poste de ${emp.jobTitle} au sein du dossier client ${companyName}.`,
    generatedAt: '2023-01-15',
    signedAt: '2023-01-15'
  }));

  const demoAbsencesList = [
    {
      id: `demo-abs_${suffix}_1`,
      employeeId: generatedEmployees[0]?.id || `demo-emp_${suffix}_1`,
      employeeName: generatedEmployees[0]?.name || 'Collaborateur 1',
      type: 'SickLeave',
      startDate: '2026-06-02',
      endDate: '2026-06-05',
      daysCount: 4,
      isDeductibleFromSalary: true,
      deductionAmount: 240.000,
      status: 'Approved',
      description: 'Certificat médical transmis et validé'
    }
  ];

  const demoPayslipsList = generatedEmployees.map((emp, idx) => ({
    id: `demo-ps_${suffix}_${idx + 1}_may`,
    employeeId: emp.id,
    employeeName: emp.name,
    month: '2026-07',
    baseSalary: emp.baseSalary,
    grossSalary: emp.baseSalary + (emp.transportAllowance || 0) + (emp.presenceAllowance || 0),
    cnssEmployee: Math.round((emp.baseSalary * 0.0918) * 1000) / 1000,
    cnssEmployer: Math.round((emp.baseSalary * 0.1707) * 1000) / 1000,
    professionalExpenses: 166.667,
    familyDeduction: emp.isChefDeFamille ? 25.000 : 0,
    taxableIncome: emp.baseSalary * 0.9,
    irpp: Math.round((emp.baseSalary * 0.15) * 1000) / 1000,
    css: Math.round((emp.baseSalary * 0.01) * 1000) / 1000,
    netSalary: Math.round((emp.baseSalary * 0.78) * 1000) / 1000,
    allowancesPaid: (emp.transportAllowance || 0) + (emp.presenceAllowance || 0),
    status: 'Paid',
    paymentMethod: 'Virement',
    bankAccountId: 'ba_1',
    paidDate: '2026-07-31'
  }));

  const demoDocs = generatedDocs;

  let customAccounts: any[] = [];
  let customTxs: any[] = [];
  let customTaxDecs: any[] = [];

  if (isSFE) {
    customAccounts = [
      { id: 'bank_sfe_biat', bankName: 'BIAT Tunis Charguia (SFE Industrie)', accountNumber: 'TN59 0800 1482 9301 0000 1111', type: 'Checking', initialBalance: 420500, currentBalance: 420500, currency: 'TND', status: 'Active' },
      { id: 'bank_sfe_stb', bankName: 'STB Ariana Industrie (SFE Industrie)', accountNumber: 'TN59 1000 1482 9302 0000 2222', type: 'Checking', initialBalance: 185200, currentBalance: 185200, currency: 'TND', status: 'Active' },
      { id: 'bank_sfe_cash', bankName: 'Caisse Usine Électrique Charguia', accountNumber: 'CAISSE-SFE-01', type: 'CashBox', initialBalance: 14800, currentBalance: 14800, currency: 'TND', status: 'Active' }
    ];
    customTxs = [
      { id: 'tx_sfe_001', accountId: 'bank_sfe_biat', accountName: 'BIAT Tunis Charguia (SFE Industrie)', date: '2026-07-02', type: 'In', amount: 480000, method: 'Virement', reference: 'VIR-STEG-2026-SFE', beneficiaryOrIssuer: 'STEG', category: 'Vente', description: 'Règlement Facture FA-SFE-2026-001', status: 'Cleared' },
      { id: 'tx_sfe_002', accountId: 'bank_sfe_biat', accountName: 'BIAT Tunis Charguia (SFE Industrie)', date: '2026-07-10', type: 'In', amount: 320000, method: 'Virement', reference: 'VIR-LOUKIL-SFE', beneficiaryOrIssuer: 'Groupe Loukil', category: 'Vente', description: 'Règlement Facture FA-SFE-2026-002', status: 'Cleared' },
      { id: 'tx_sfe_003', accountId: 'bank_sfe_stb', accountName: 'STB Ariana Industrie (SFE Industrie)', date: '2026-07-18', type: 'Out', amount: 180000, method: 'Virement', reference: 'VIR-SIEMENS-FOURN', beneficiaryOrIssuer: 'Siemens Tunisie', category: 'Achat Fournisseur', description: 'Composants disjoncteurs industriels', status: 'Cleared' },
      { id: 'tx_sfe_004', accountId: 'bank_sfe_biat', accountName: 'BIAT Tunis Charguia (SFE Industrie)', date: '2026-07-28', type: 'Out', amount: 62800, method: 'Virement', reference: 'REC-FIN-G50-M06', beneficiaryOrIssuer: 'Recette des Finances', category: 'Impôts & Taxes', description: 'Déclaration fiscale G50 Juin 2026', status: 'Cleared' }
    ];
    customTaxDecs = [
      { id: 'tax_sfe_m06', year: 2026, period: 'M06', periodLabel: 'Mois de Juin 2026 (G50)', tvaCollected: 128000, tvaDeductible: 65200, tvaDue: 62800, withholdingPaid: 12400, withholdingCollected: 0, corporateTaxEstimate: 9420, totalAmountPaid: 75200, status: 'Paid', filedDate: '2026-07-14' },
      { id: 'tax_sfe_m07', year: 2026, period: 'M07', periodLabel: 'Mois de Juillet 2026 (G50)', tvaCollected: 89600, tvaDeductible: 42100, tvaDue: 47500, withholdingPaid: 9800, withholdingCollected: 0, corporateTaxEstimate: 7125, totalAmountPaid: 57300, status: 'Validated', filedDate: '2026-08-08' }
    ];
  } else if (isSfax) {
    customAccounts = [
      { id: 'bank_sfx_attijari', bankName: 'Attijari Bank Sfax 14 Janvier', accountNumber: 'TN59 0400 0948 2151 0000 3333', type: 'Checking', initialBalance: 290800, currentBalance: 290800, currency: 'TND', status: 'Active' },
      { id: 'bank_sfx_amen', bankName: 'Amen Bank Sfax Poudrière', accountNumber: 'TN59 0700 0948 2152 0000 4444', type: 'Checking', initialBalance: 125400, currentBalance: 125400, currency: 'TND', status: 'Active' },
      { id: 'bank_sfx_cash', bankName: 'Caisse Showroom Grossiste Sfax', accountNumber: 'CAISSE-SFX-01', type: 'CashBox', initialBalance: 8900, currentBalance: 8900, currency: 'TND', status: 'Active' }
    ];
    customTxs = [
      { id: 'tx_sfx_001', accountId: 'bank_sfx_attijari', accountName: 'Attijari Bank Sfax 14 Janvier', date: '2026-07-05', type: 'In', amount: 220000, method: 'Virement', reference: 'VIR-MG-SFAX', beneficiaryOrIssuer: 'Magasin Général Sfax', category: 'Vente', description: 'Livraison gros produits alimentaires FA-SFX-2026-010', status: 'Cleared' },
      { id: 'tx_sfx_002', accountId: 'bank_sfx_attijari', accountName: 'Attijari Bank Sfax 14 Janvier', date: '2026-07-12', type: 'In', amount: 310000, method: 'Virement', reference: 'VIR-CARREFOUR-SFAX', beneficiaryOrIssuer: 'Carrefour Market Sfax', category: 'Vente', description: 'Règlement facture FA-SFX-2026-011', status: 'Cleared' },
      { id: 'tx_sfx_003', accountId: 'bank_sfx_amen', accountName: 'Amen Bank Sfax Poudrière', date: '2026-07-20', type: 'Out', amount: 195000, method: 'Virement', reference: 'VIR-FOURN-POULINA', beneficiaryOrIssuer: 'Poulina Agro Sfax', category: 'Achat Fournisseur', description: 'Stock marchandises grossiste', status: 'Cleared' }
    ];
    customTaxDecs = [
      { id: 'tax_sfx_m06', year: 2026, period: 'M06', periodLabel: 'Mois de Juin 2026 (G50)', tvaCollected: 84621, tvaDeductible: 48200, tvaDue: 36421, withholdingPaid: 8400, withholdingCollected: 0, corporateTaxEstimate: 5463, totalAmountPaid: 44821, status: 'Paid', filedDate: '2026-07-15' },
      { id: 'tax_sfx_m07', year: 2026, period: 'M07', periodLabel: 'Mois de Juillet 2026 (G50)', tvaCollected: 78200, tvaDeductible: 31000, tvaDue: 47200, withholdingPaid: 7900, withholdingCollected: 0, corporateTaxEstimate: 7080, totalAmountPaid: 55100, status: 'Draft', filedDate: undefined }
    ];
  } else if (isSahel) {
    customAccounts = [
      { id: 'bank_bs_bna', bankName: 'BNA Sousse Kantaoui (Batiment Sahel)', accountNumber: 'TN59 0300 1209 3841 0000 5555', type: 'Checking', initialBalance: 780000, currentBalance: 780000, currency: 'TND', status: 'Active' },
      { id: 'bank_bs_uib', bankName: 'UIB Monastir BTP (Batiment Sahel)', accountNumber: 'TN59 1200 1209 3842 0000 6666', type: 'Checking', initialBalance: 340500, currentBalance: 340500, currency: 'TND', status: 'Active' },
      { id: 'bank_bs_cash', bankName: 'Caisse Chantiers Sousse & Sahel', accountNumber: 'CAISSE-SAHEL-01', type: 'CashBox', initialBalance: 22100, currentBalance: 22100, currency: 'TND', status: 'Active' }
    ];
    customTxs = [
      { id: 'tx_bs_001', accountId: 'bank_bs_bna', accountName: 'BNA Sousse Kantaoui (Batiment Sahel)', date: '2026-07-08', type: 'In', amount: 1120000, method: 'Virement', reference: 'VIR-MIN-EQUIP', beneficiaryOrIssuer: 'Ministère Équipement', category: 'Vente', description: 'Décompte Autoroute A1 FA-BS-2026-088', status: 'Cleared' },
      { id: 'tx_bs_002', accountId: 'bank_bs_bna', accountName: 'BNA Sousse Kantaoui (Batiment Sahel)', date: '2026-07-16', type: 'In', amount: 650000, method: 'Virement', reference: 'VIR-SOC-IMMOB', beneficiaryOrIssuer: 'Société Immobilière Sousse', category: 'Vente', description: 'Gros Œuvres Résidence Les Palmiers', status: 'Cleared' },
      { id: 'tx_bs_003', accountId: 'bank_bs_uib', accountName: 'UIB Monastir BTP (Batiment Sahel)', date: '2026-07-22', type: 'Out', amount: 410000, method: 'Virement', reference: 'VIR-CIMENTS-BIZERTE', beneficiaryOrIssuer: 'Les Ciments de Bizerte', category: 'Achat Fournisseur', description: 'Ciment Portland & Briques structure', status: 'Cleared' }
    ];
    customTaxDecs = [
      { id: 'tax_bs_m06', year: 2026, period: 'M06', periodLabel: 'Mois de Juin 2026 (G50)', tvaCollected: 282604, tvaDeductible: 142100, tvaDue: 140504, withholdingPaid: 22400, withholdingCollected: 0, corporateTaxEstimate: 21075, totalAmountPaid: 162904, status: 'Paid', filedDate: '2026-07-12' },
      { id: 'tax_bs_m07', year: 2026, period: 'M07', periodLabel: 'Mois de Juillet 2026 (G50)', tvaCollected: 168000, tvaDeductible: 85000, tvaDue: 83000, withholdingPaid: 14500, withholdingCollected: 0, corporateTaxEstimate: 12450, totalAmountPaid: 97500, status: 'Validated', filedDate: '2026-08-09' }
    ];
  } else if (isGTS) {
    customAccounts = [
      { id: 'bank_gts_atb', bankName: 'ATB Radès Port (GTS Logistique)', accountNumber: 'TN59 0100 1654 3211 0000 7777', type: 'Checking', initialBalance: 210300, currentBalance: 210300, currency: 'TND', status: 'Active' },
      { id: 'bank_gts_bh', bankName: 'BH Bank Transit Sousse (GTS Logistique)', accountNumber: 'TN59 1400 1654 3212 0000 8888', type: 'Checking', initialBalance: 95600, currentBalance: 95600, currency: 'TND', status: 'Active' },
      { id: 'bank_gts_cash', bankName: 'Caisse Guichet Douane Radès', accountNumber: 'CAISSE-GTS-01', type: 'CashBox', initialBalance: 6400, currentBalance: 6400, currency: 'TND', status: 'Active' }
    ];
    customTxs = [
      { id: 'tx_gts_001', accountId: 'bank_gts_atb', accountName: 'ATB Radès Port (GTS Logistique)', date: '2026-07-04', type: 'In', amount: 280000, method: 'Virement', reference: 'VIR-EXPRESS-EUR', beneficiaryOrIssuer: 'Express Transport Europe', category: 'Vente', description: 'Prestation transit fret maritime Radès', status: 'Cleared' },
      { id: 'tx_gts_002', accountId: 'bank_gts_atb', accountName: 'ATB Radès Port (GTS Logistique)', date: '2026-07-14', type: 'In', amount: 210000, method: 'Virement', reference: 'VIR-LOG-SFAX', beneficiaryOrIssuer: 'Logistique Portuaire Sfax', category: 'Vente', description: 'Acheminement conteneurs frigo', status: 'Cleared' },
      { id: 'tx_gts_003', accountId: 'bank_gts_atb', accountName: 'ATB Radès Port (GTS Logistique)', date: '2026-07-25', type: 'Out', amount: 84000, method: 'Virement', reference: 'VIR-SNDP-AGIL', beneficiaryOrIssuer: 'SNDP Agil Radès', category: 'Autre', description: 'Carburant flotte camions poids lourds', status: 'Cleared' }
    ];
    customTaxDecs = [
      { id: 'tax_gts_m06', year: 2026, period: 'M06', periodLabel: 'Mois de Juin 2026 (G50)', tvaCollected: 78234, tvaDeductible: 42100, tvaDue: 36134, withholdingPaid: 6800, withholdingCollected: 0, corporateTaxEstimate: 5420, totalAmountPaid: 42934, status: 'Paid', filedDate: '2026-07-15' },
      { id: 'tax_gts_m07', year: 2026, period: 'M07', periodLabel: 'Mois de Juillet 2026 (G50)', tvaCollected: 62000, tvaDeductible: 34000, tvaDue: 28000, withholdingPaid: 5400, withholdingCollected: 0, corporateTaxEstimate: 4200, totalAmountPaid: 33400, status: 'Validated', filedDate: '2026-08-10' }
    ];
  }

  const demoAccounts = customAccounts.length > 0 ? customAccounts : [
    { id: 'demo-ba_1', bankName: 'BIAT', accountNumber: '03001010015920038472', accountType: 'Courant', balance: 145250.620, currency: 'TND' }
  ];

  const demoTxs = customTxs.length > 0 ? customTxs : [
    { id: 'demo-tx_1', accountId: 'demo-ba_1', date: '2026-06-01', amount: 12500, type: 'In', category: 'Vente', description: 'Virement client Poulina Group Holding', status: 'Cleared', method: 'Virement', reference: 'AV-10043' }
  ];

  const finalTaxDeclarations = customTaxDecs.length > 0 ? customTaxDecs : demoTaxDeclarationsMapped;

  return {
    clients: demoClientsMapped,
    complaints: demoComplaintsMapped,
    invoices: demoInvoicesMapped,
    visitReports: demoVisitReportsMapped,
    competitors: demoCompetitorsMapped,
    suppliers: INITIAL_SUPPLIERS || [],
    products: demoProductsMapped,
    stockMovements: demoStockMovementsMapped,
    smtpSettings: DEFAULT_SMTP_SETTINGS,
    imapSettings: DEFAULT_IMAP_SETTINGS,
    incomingEmails: [],
    emailTemplates: companyTemplates,
    communicationLogs: demoLogs,
    bankAccounts: demoAccounts,
    bankTransactions: demoTxs,
    taxDeclarations: finalTaxDeclarations,
    yearEndClosings: [],
    documents: demoDocs,
    employees: demoEmployees,
    contracts: demoContractsList,
    absences: demoAbsencesList,
    payslips: demoPayslipsList,
    assets: demoAssets,
    cessionEntries: [],
    nomenclatures: demoNomenclatures,
    manufacturingOrders: demoMO,
    purchaseRequisitions: demoRequisitions,
    purchaseOrders: demoOrders,
    supplierPerformance: demoPerformance,
    importFolders: demoFolders,
    lcRequests: demoLc,
    vehicles: DEFAULT_FLEET_VEHICLES,
    missions: DEFAULT_FLEET_MISSIONS,
    expenses: DEFAULT_FLEET_EXPENSES,
    incidents: DEFAULT_FLEET_INCIDENTS,
    fuelBons: DEFAULT_FLEET_EXPENSES,
    interventions: DEFAULT_FLEET_MISSIONS,
    insurances: DEFAULT_FLEET_INCIDENTS,
    hasLoadedTrialDemo: true,
    lastUpdated: Date.now()
  };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    // 1. Bypass sandbox storage isolation when opening top-level tabs for printing
    const params = new URLSearchParams(window.location.search);
    const urlSession = params.get('session');
    let sessionObj: UserSession | null = null;
    if (urlSession) {
      try {
        const decoded = decodeURIComponent(atob(urlSession));
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.email && parsed.role) {
          localStorage.setItem('carthage_session', decoded);
          sessionObj = parsed;
        }
      } catch (e) {
        console.error('Failed to restore session from URL parameter', e);
      }
    }

    // 2. Fall back to standard local storage
    if (!sessionObj) {
      const saved = localStorage.getItem('carthage_session');
      if (saved) {
        try {
          sessionObj = JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing session', e);
        }
      }
    }

    // Auto-migrate old emails to contact@elyssa.pro and ensure SuperAdmin role
    if (sessionObj) {
      const emailLower = sessionObj.email?.toLowerCase();
      const isPlatform = emailLower === 'admin@elyssa.pro' || 
                         emailLower === 'contact@elyssa.pro' || 
                         emailLower === 'ziedbenmiled3@gmail.com' || 
                         emailLower === 'admin@carthage.tn' ||
                         emailLower === 'contact@nexuswp.pro' ||
                         emailLower === 'contact@carthage.tn';

      if (isPlatform) {
        sessionObj.role = 'SuperAdmin';
        if (emailLower === 'contact@nexuswp.pro' || emailLower === 'ziedbenmiled3@gmail.com' || emailLower === 'contact@carthage.tn' || emailLower === 'admin@carthage.tn') {
          sessionObj.email = (emailLower === 'admin@carthage.tn') ? 'admin@elyssa.pro' : 'contact@elyssa.pro';
        }
        localStorage.setItem('carthage_session', JSON.stringify(sessionObj));
      }
    }
    return sessionObj;
  });

  const [superAdminOverride, setSuperAdminOverride] = useState<boolean>(() => {
    return localStorage.getItem('elyssa_superadmin_all_unlocked') !== 'false';
  });

  const isPlatformAdmin = useMemo(() => {
    if (!currentUser) return false;
    const emailLower = currentUser.email?.toLowerCase();
    return currentUser.role === 'SuperAdmin' || 
           emailLower === 'admin@elyssa.pro' || 
           emailLower === 'contact@elyssa.pro' ||
           emailLower === 'ziedbenmiled3@gmail.com';
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;

    // Auto-land platform admin directly on the SaaS Exploitation Console!
    const saved = localStorage.getItem('carthage_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const emailLower = parsed.email?.toLowerCase();
          const isPlatform = parsed.role === 'SuperAdmin' || 
                             emailLower === 'admin@elyssa.pro' || 
                             emailLower === 'contact@elyssa.pro' ||
                             emailLower === 'ziedbenmiled3@gmail.com';
          if (isPlatform) {
            return 'saas_config';
          }
        }
      } catch (e) {}
    }
    return 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [autoSaveToast, setAutoSaveToast] = useState<{ show: boolean; timestamp: string } | null>(null);
  const [showDemoClearedToast, setShowDemoClearedToast] = useState(false);
  const [accessErrorToast, setAccessErrorToast] = useState<{ show: boolean; moduleName: string } | null>(null);
  const [emptyModuleToast, setEmptyModuleToast] = useState<{ show: boolean; moduleKey: string; moduleLabel: string } | null>(null);
  const [trialTimeLeftStr, setTrialTimeLeftStr] = useState<string>('');
  const [isCompanyDataLoading, setIsCompanyDataLoading] = useState(false);
  const [purgeReport, setPurgeReport] = useState<any>(null);

  // Active company name configuration
  const [activeCompanyName, setActiveCompanyName] = useState<string>(() => {
    const savedSession = localStorage.getItem('carthage_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed) {
          if (parsed.role === 'SuperAdmin') {
            return localStorage.getItem('carthage_active_company_simulated') || 'Inter-Affaires';
          }
          if (parsed.companyName) {
            return parsed.companyName;
          }
          // Collaborator fallback
          const collabsSaved = localStorage.getItem('carthage_collaborators');
          if (collabsSaved) {
            const collabs = JSON.parse(collabsSaved);
            const found = collabs.find((c: any) => c?.email?.toLowerCase() === parsed?.email?.toLowerCase());
            if (found && found.company) {
              return found.company;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return 'Inter-Affaires';
  });

  // Expert-Comptable / Cabinet Dossier Context
  const [accountantClientContext, setAccountantClientContext] = useState<{
    isAccountantMode: boolean;
    clientName: string;
    mf: string;
    tenantId: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('carthage_expert_accountant_mode');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const handleSwitchToAccountantClient = (companyName: string, tenantId?: string, mf?: string) => {
    const resolvedTenantId = tenantId || companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    setActiveCompanyName(companyName);
    localStorage.setItem('carthage_active_company_simulated', companyName);
    
    const context = {
      isAccountantMode: true,
      clientName: companyName,
      mf: mf || '1482930/A/A/M/000',
      tenantId: resolvedTenantId
    };
    setAccountantClientContext(context);
    localStorage.setItem('carthage_expert_accountant_mode', JSON.stringify(context));
    setActiveTab('finance');
  };

  const handleResetAccountantMode = () => {
    setAccountantClientContext(null);
    localStorage.removeItem('carthage_expert_accountant_mode');
    setActiveCompanyName('Inter-Affaires');
    localStorage.setItem('carthage_active_company_simulated', 'Inter-Affaires');
    setActiveTab('accountant_portal');
  };

  const copilot = useAiCopilot(activeCompanyName || "default");

  const { fetchData: runDirectFirestoreFetch, loading: isDirectFetchLoading } = useFetchData(activeCompanyName);

  // Subscription Configuration State
  const [subscriptionPack, setSubscriptionPack] = useState<string>(() => {
    return localStorage.getItem('carthage_sub_pack') || 'independent'; // Default to 'independent' for trial
  });

  // Keep track of publisher clients dynamically (moved to be reactive)
  const [publisherClients, rawSetPublisherClients] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('carthage_publisher_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Permanently prune pc-inter-affaires and ABK (the test client that user wants to delete)
          let filtered = parsed.filter((c: any) => {
            if (!c) return false;
            
            const sessionStr = localStorage.getItem('carthage_session');
            if (sessionStr) {
              try {
                const session = JSON.parse(sessionStr);
                if (session && (session.companyId === c.id || session.companyName === c.companyName)) {
                  return true;
                }
              } catch (e) {}
            }

            const nameUpper = String(c.companyName || '').trim().toUpperCase();
            const idLower = String(c.id || '').toLowerCase();
            const isGep = nameUpper === 'GEP' || idLower.includes('gep') || c.id === 'pc-1784366783440';
            const isParent = nameUpper === 'INTER-AFFAIRES' || nameUpper === 'ELYSSA ENTREPRISES S.A.' || idLower.includes('interaffaires') || c.id === 'pc-parent-elyssa';

            return isGep || isParent;
          });
          
          localStorage.setItem('carthage_publisher_clients', JSON.stringify(filtered));
          return filtered;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'pc-1784366783440', companyName: 'GEP', location: '12 Avenue 2 Mars, Borj Baccouche Ariana', packId: 'custom', paymentGateway: 'Versement', status: 'active', joinedDate: '2026-07-18' },
      { id: 'pc-interaffaires', companyName: 'Inter-Affaires', location: 'Tunis', packId: 'standard', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-07-26' }
    ];
  });

  const setPublisherClients = useCallback((val: any) => {
    rawSetPublisherClients((prev: any[]) => {
      const resolved = typeof val === 'function' ? val(prev) : val;
      if (!Array.isArray(resolved)) return resolved;
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      return resolved.filter((c: any) => {
        if (!c) return false;
        const idKey = String(c.id || '').toLowerCase().trim();
        const nameKey = String(c.companyName || '').toLowerCase().trim();
        if (!idKey || !nameKey) return false;
        if (seenIds.has(idKey) || seenNames.has(nameKey)) return false;
        seenIds.add(idKey);
        seenNames.add(nameKey);
        return true;
      });
    });
  }, []);

  const handleUpdatePublisherClients = (updated: any) => {
    setPublisherClients(updated);
    localStorage.setItem('carthage_publisher_clients', JSON.stringify(updated));
  };

  const getActiveSubscriptionPackId = (): string => {
    if (!currentUser) {
      return 'full';
    }
    const company = activeCompanyName;
    if (company === 'Inter-Affaires' || company === 'Elyssa Entreprises S.A.') {
      return 'full';
    }
    const client = publisherClients.find(c => c && c.companyName?.toLowerCase() === company?.toLowerCase());
    if (client) {
      const licenseStatus = client.license_status || (client.status === 'trial' ? 'trial' : 'paid');
      if (licenseStatus === 'paid' && client.packId === 'trial') {
        return 'custom';
      }
      return client.packId;
    }
    if (company === 'Jackson Five') {
      return 'custom';
    }
    return 'independent';
  };

  // Cache version control - Reset client cache if local version is outdated compared to server
  useEffect(() => {
    const checkCacheVersionAndReset = async () => {
      try {
        const res = await fetchWithRetry('/api/db/status', {}, 2, 1000);
        if (res && res.ok) {
          const status = await res.json();
          const serverVersion = status.cacheVersion || "1.0";
          const localVersion = window.localStorage.getItem('elyssa_cache_version');
          
          if (localVersion !== serverVersion) {
            console.log(`[Cache Version Mismatch] Server: ${serverVersion}, Local: ${localVersion}. Forcing full local storage cleanup...`);
            resetAllStates();
            window.localStorage.setItem('elyssa_cache_version', serverVersion);
            // Force reload to apply clean state
            window.location.reload();
          }
        }
      } catch (err) {
        console.warn('[Cache Version Check Skipped - Server Starting]', err);
      }
    };
    checkCacheVersionAndReset();
  }, []);

  // Keep subscriptionPack in sync with active simulated company
  useEffect(() => {
    const activePack = getActiveSubscriptionPackId();
    setSubscriptionPack(activePack);
  }, [activeCompanyName, publisherClients]);


  const [trialDurationDays, setTrialDurationDays] = useState<number>(() => {
    return parseInt(localStorage.getItem('carthage_trial_duration_days') || '7', 10);
  });

  const handleUpdateTrialDurationDays = (days: number) => {
    setTrialDurationDays(days);
    localStorage.setItem('carthage_trial_duration_days', String(days));
  };

  // Dynamic subscription packages state managed by the Publisher Console
  const [customPacks, setCustomPacks] = useState(() => {
    try {
      const saved = localStorage.getItem('carthage_custom_packs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const merged = parsed.filter(p => p && typeof p === 'object' && p.id);
          PACKS_DEFINITIONS.forEach(def => {
            const index = merged.findIndex(p => p && p.id === def.id);
            if (index === -1) {
              merged.push(def);
            } else {
              // Keep user updates but align base definitions for default packs
              merged[index] = { 
                ...def, 
                ...merged[index], 
                name: def.name, 
                desc: def.desc, 
                price: def.price, 
                modules: def.modules, 
                badge: def.badge 
              };
            }
          });
          return merged;
        }
      }
    } catch (e) {
      console.error('Failed to load custom packs:', e);
    }
    return PACKS_DEFINITIONS;
  });

  const finalCustomPacks = useMemo(() => {
    return customPacks.map(p => {
      if (p && p.id === 'trial') {
        return {
          ...p,
          desc: `Accès complet de ${trialDurationDays} jours sans engagement à tous les modules opérationnels d'Elyssa.`,
          badge: `Essai ${trialDurationDays} Jours`
        };
      }
      return p;
    });
  }, [customPacks, trialDurationDays]);

  const handleUpdateCustomPacks = (newPacks: typeof PACKS_DEFINITIONS) => {
    setCustomPacks(newPacks);
    localStorage.setItem('carthage_custom_packs', JSON.stringify(newPacks));
  };

  const [purchasedModules, setPurchasedModules] = useState<string[]>([]);

  // Load company-specific purchased modules dynamically when the company name changes or publisherClients updates
  useEffect(() => {
    if (!activeCompanyName) return;
    const key = `carthage_purchased_modules_${activeCompanyName}`;
    
    // 1. Check if there are modules defined in the server-side client record in publisherClients
    const clientRecord = publisherClients.find(
      c => c && (c.id === activeCompanyName || c.companyName?.toLowerCase() === activeCompanyName.toLowerCase())
    );
    let serverModules: string[] = [];
    if (clientRecord && Array.isArray(clientRecord.modules)) {
      serverModules = clientRecord.modules;
    }

    // 2. Proactively sync modules from any approved or emitted custom license requests saved locally
    let reqsModules: string[] = [];
    const savedReqsStr = localStorage.getItem('carthage_licence_requests');
    if (savedReqsStr) {
      try {
        const reqs = JSON.parse(savedReqsStr);
        if (Array.isArray(reqs)) {
          const activeCustomReqs = reqs.filter(
            (r: any) =>
              r.companyName?.toLowerCase() === activeCompanyName.toLowerCase() &&
              (r.status === 'approved' || r.status === 'key_emitted') &&
              r.packId === 'custom' &&
              Array.isArray(r.modules) &&
              r.modules.length > 0
          );
          reqsModules = activeCustomReqs.flatMap((r: any) => r.modules);
        }
      } catch (e) {
        console.error('Error auto-syncing purchased modules in App.tsx:', e);
      }
    }

    // 3. Load existing local storage modules
    let localModules: string[] = [];
    const savedStr = localStorage.getItem(key);
    if (savedStr) {
      try {
        localModules = JSON.parse(savedStr);
      } catch (e) {}
    } else {
      // Migrate legacy Jackson Five modules if needed
      const legacySaved = localStorage.getItem('carthage_purchased_modules');
      if (legacySaved && activeCompanyName === 'Jackson Five') {
        try {
          localModules = JSON.parse(legacySaved);
        } catch (e) {}
      }
    }

    // 4. Merge all sources: server record modules, request modules, and local storage modules
    const merged = Array.from(new Set([
      ...localModules,
      ...serverModules,
      ...reqsModules
    ]));

    // 5. Update localStorage and state if there is any difference or update needed
    const savedMergedStr = JSON.stringify(merged);
    if (savedStr !== savedMergedStr) {
      localStorage.setItem(key, savedMergedStr);
    }
    
    setPurchasedModules(merged);

    // 6. Auto-register active company in publisherClients if missing so it appears in publisher console and retains settings
    if (!clientRecord && activeCompanyName && activeCompanyName.toLowerCase() !== 'elyssa entreprises s.a.') {
      const autoClient = {
        id: `pc-${activeCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'new'}`,
        companyName: activeCompanyName,
        location: 'Tunis',
        packId: merged.length > 0 ? 'custom' : 'standard',
        paymentGateway: 'Virement',
        status: 'active',
        license_status: 'paid',
        joinedDate: new Date().toISOString().split('T')[0],
        modules: merged
      };
      setPublisherClients((prev: any[]) => {
        if (!prev) return [autoClient];
        const exists = prev.some(c => c && (c.id === autoClient.id || c.companyName?.toLowerCase() === autoClient.companyName.toLowerCase()));
        return exists ? prev : [...prev, autoClient];
      });
    }
  }, [activeCompanyName, publisherClients, setPublisherClients]);

  const [hideLockedModules, setHideLockedModules] = useState<boolean>(() => {
    const val = localStorage.getItem('carthage_hide_locked_modules');
    return val === null ? true : val === 'true';
  });

  const checkAccess = (moduleId: string, companyId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SuperAdmin') return true;
    if (isSimulationActive || companyId?.toLowerCase() === 'elyssa entreprises s.a.' || companyId?.toLowerCase() === 'inter-affaires') {
      return true;
    }

    // Core modules (Paramètres de l'entreprise, TEJ, Admin, Copilot) are always accessible
    if (['saas_config', 'admin', 'company_settings', 'tej', 'copilot'].includes(moduleId)) {
      return true;
    }

    // When in Accountant / Cabinet Mode, Cabinet has full default access to Cabinet ERP suite modules (Comptabilité, Paie, TEJ, etc.) on client dossiers
    if (accountantClientContext?.isAccountantMode) {
      if (['accountant_portal', 'finance', 'comptabilite', 'payroll', 'collaborators', 'attendance', 'tej', 'billing', 'facturation', 'asset', 'ged', 'juridique', 'company_settings', 'dashboard', 'executive_dashboard', 'reports'].includes(moduleId)) {
        return true;
      }
    }

    let client = publisherClients.find(c => 
      c && (c.id === companyId || c.companyName?.toLowerCase() === companyId?.toLowerCase())
    );

    // If no client record exists yet for companyId, construct a fallback active client record
    if (!client) {
      if (companyId?.toLowerCase() === 'elyssa entreprises s.a.') {
        return true;
      }
      client = {
        id: `pc-${companyId?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'default'}`,
        companyName: companyId,
        packId: 'standard',
        status: 'active',
        license_status: 'paid',
        modules: []
      };
    }

    // Determine license status (checking field license_status first, falling back to active/trial check)
    const licenseStatus = client.license_status || (client.status === 'trial' ? 'trial' : 'paid');

    const isCurrentActive = companyId?.toLowerCase() === activeCompanyName?.toLowerCase();
    const customMods = Array.from(new Set([
      ...(Array.isArray(client.modules) ? client.modules : []),
      ...(isCurrentActive && Array.isArray(purchasedModules) ? purchasedModules : [])
    ]));

    // Règle prioritaire Transverse : L'accès en période d'essai (statut trial) restreint au pack trial
    if (client.status === 'trial' || licenseStatus === 'trial') {
      const packId = client.packId || 'trial';
      return canAccess(moduleId, packId, customMods);
    }

    if (licenseStatus === 'paid') {
      let packId = client.packId || 'standard';
      if (packId === 'trial') {
        packId = 'custom';
      }
      return canAccess(moduleId, packId, customMods);
    }

    return false;
  };

  const isModuleUnlockedState = (tabId: string): boolean => {
    // If super admin override is active, unlock everything
    if (currentUser?.role === 'SuperAdmin' && superAdminOverride) {
      return true;
    }
    // core modules are always free and unlocked
    if (['admin', 'saas_config', 'company_settings', 'tej'].includes(tabId)) {
      return true;
    }
    
    // Delegate to checkAccess for strict compartmentalization
    return checkAccess(tabId, activeCompanyName);
  };

  const isDemoCompany = activeCompanyName.toLowerCase() === "elyssa entreprises s.a." || activeCompanyName.toLowerCase() === "inter-affaires";

  const handleSidebarItemClick = (tabId: string) => {
    if (tabId === 'copilot') {
      copilot.openChat();
      setMobileMenuOpen(false);
      return;
    }
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Auto print if URL has print=true & handles target cloning for high-fidelity printing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const print = params.get('print');
    const printTarget = params.get('printTarget');
    if (print === 'true') {
      const timer = setTimeout(() => {
        if (printTarget) {
          const printContent = document.getElementById(printTarget);
          if (printContent) {
            // Clean up any existing temp root
            const oldRoot = document.getElementById('temp-print-root');
            if (oldRoot) oldRoot.remove();

            const clone = printContent.cloneNode(true) as HTMLElement;
            clone.id = 'temp-print-root';
            // strip hidden class from clone
            clone.className = 'temp-print-root ' + (printContent.className || '').replace(/\bhidden\b/g, '');
            document.body.appendChild(clone);
            document.body.classList.add('print-mode-active');
          }
        }
        try {
          window.print();
        } catch (e) {
          console.error('Auto-print error:', e);
        } finally {
          if (printTarget) {
            document.body.classList.remove('print-mode-active');
            const tempElement = document.getElementById('temp-print-root');
            if (tempElement) {
              try {
                document.body.removeChild(tempElement);
              } catch (err) {
                console.error('Cleanup print element failed:', err);
              }
            }
          }
        }
      }, 1500); // Allow extra rendering time for sub-components/charts
      return () => clearTimeout(timer);
    }
  }, [activeTab]);
  
  // Force one-time cache invalidation and clean fetch on reload
  if (typeof window !== 'undefined' && !sessionStorage.getItem('elyssa_erp_cache_purged')) {
    clearAppCache();
    sessionStorage.setItem('elyssa_erp_cache_purged', 'true');
  }

  const [trialRegisteredCompany, setTrialRegisteredCompany] = useState<any>(() => {
    const saved = localStorage.getItem('carthage_trial_registered_prospect');
    return saved ? JSON.parse(saved) : null;
  });

  const [collaborators, setCollaborators] = useState<CollaboratorAccount[]>(() => {
    const saved = localStorage.getItem('carthage_collaborators');
    let list: CollaboratorAccount[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Permanently prune any collaborators belonging to INTER AFFAIRES or with old administrative emails
          list = parsed.filter(c => 
            c.company !== 'INTER AFFAIRES' && 
            c.email?.toLowerCase() !== 'contact@nexuswp.pro' && 
            c.email?.toLowerCase() !== 'ziedbenmiled3@gmail.com'
          ).map(c => {
            if (c.email?.toLowerCase() === 'contact@carthage.tn') {
              return { ...c, email: 'contact@elyssa.pro' };
            }
            return c;
          });
        }
      } catch (e) {
        console.error('Error parsing collaborators', e);
      }
    }
    const defaults = [
      {
        id: 'collab_carthage_1',
        name: 'MED ZIED BEN MILED',
        email: 'contact@elyssa.pro',
        password: 'bochra1985',
        role: 'Manager' as const,
        status: 'Active' as const,
        company: 'Inter-Affaires',
        assignedTasks: [],
        createdDate: '2026-06-22'
      }
    ];

    if (list.length === 0) {
      return defaults;
    }

    // Merge missing essential zied admins to existing list to make sure they are always present!
    const keyEmails = ['contact@elyssa.pro'];
    const companies = ['Inter-Affaires', 'Elyssa Entreprises S.A.'];
    
    let updated = [...list];
    companies.forEach(comp => {
      keyEmails.forEach(email => {
        const found = updated.find(c => c?.email?.toLowerCase() === email.toLowerCase() && c?.company === comp);
        if (!found) {
          updated.push({
            id: `collab_auto_${comp.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${email.replace(/[@.]/g, '_')}`,
            name: 'MED ZIED BEN MILED',
            email: email,
            password: 'bochra1985',
            role: 'Manager',
            status: 'Active',
            company: comp,
            assignedTasks: [],
            createdDate: '2026-06-22'
          });
        }
      });
    });

    const seenCollabIds = new Set<string>();
    return updated.filter(c => {
      if (!c || !c.id || seenCollabIds.has(c.id)) return false;
      seenCollabIds.add(c.id);
      return true;
    });
  });

  const [hasLoadedClientsFromServer, setHasLoadedClientsFromServer] = useState(false);
  const [hasLoadedCollaboratorsFromServer, setHasLoadedCollaboratorsFromServer] = useState(false);

  // 1. Initial Load from Server
  useEffect(() => {
    const loadServerData = async () => {
      try {
        const clientsRes = await fetchWithRetry('/api/db/publisher-clients', {
          headers: getAuthHeaders()
        });
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          if (Array.isArray(clientsData)) {
            setPublisherClients((prev: any[]) => {
              const mergedMap = new Map<string, any>();
              if (Array.isArray(prev)) {
                prev.forEach((c: any) => c && c.companyName && mergedMap.set(c.companyName.toLowerCase(), c));
              }
              clientsData.forEach((c: any) => c && c.companyName && mergedMap.set(c.companyName.toLowerCase(), c));
              const merged = Array.from(mergedMap.values());
              localStorage.setItem('carthage_publisher_clients', JSON.stringify(merged));
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching publisher-clients from server:', err);
      } finally {
        setHasLoadedClientsFromServer(true);
      }

      try {
        const reqsRes = await fetchWithRetry('/api/db/licence-requests', {
          headers: getAuthHeaders()
        });
        if (reqsRes.ok) {
          const reqsData = await reqsRes.json();
          if (Array.isArray(reqsData)) {
            // Load current clients to clean up ghost requests
            let clientsList: any[] = [];
            const savedClients = localStorage.getItem('carthage_publisher_clients');
            if (savedClients) {
              try { clientsList = JSON.parse(savedClients); } catch (e) {}
            }
            const cleaned = reqsData.filter((req: any) => {
              const correspondingClient = clientsList.find(
                (c: any) => c.companyName?.toLowerCase() === req.companyName?.toLowerCase()
              );
              if (correspondingClient && correspondingClient.status === 'trial') {
                if (req.packId === 'full' && req.price === 199 && (req.status === 'pending' || req.status === 'key_emitted')) {
                  return false;
                }
              }
              return true;
            });

            localStorage.setItem('carthage_licence_requests', JSON.stringify(cleaned));
            
            // If we removed ghost requests, update the server as well
            if (cleaned.length !== reqsData.length) {
              fetchWithRetry('/api/db/licence-requests', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(cleaned)
              }).catch(err => console.warn('Failed to sync cleaned licence requests to server:', err));
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching licence-requests from server:', err);
      }

      try {
        const collabsRes = await fetchWithRetry('/api/db/collaborators', {
          headers: getAuthHeaders()
        });
        if (collabsRes.ok) {
          const collabsData = await collabsRes.json();
          if (Array.isArray(collabsData)) {
            const seen = new Set<string>();
            const unique = collabsData.filter((c: any) => {
              if (!c || !c.id || seen.has(c.id)) return false;
              seen.add(c.id);
              return true;
            });
            setCollaborators(unique);
            localStorage.setItem('carthage_collaborators', JSON.stringify(unique));
          }
        }
      } catch (err) {
        console.warn('Error fetching collaborators from server:', err);
      } finally {
        setHasLoadedCollaboratorsFromServer(true);
      }

      try {
        const settingsRes = await fetchWithRetry('/api/db/admin-settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData && settingsData.companyName) {
            setAdminSettings(settingsData);
            localStorage.setItem('carthage_admin_settings', JSON.stringify(settingsData));
          }
        }
      } catch (err) {
        console.warn('Error fetching admin-settings from server:', err);
      }
    };

    loadServerData();
  }, []);

  // 2. Sync client changes to Server
  useEffect(() => {
    if (!hasLoadedClientsFromServer) return;
    
    localStorage.setItem('carthage_publisher_clients', JSON.stringify(publisherClients));
    fetchWithRetry('/api/db/publisher-clients', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(publisherClients)
    }).catch(err => console.warn('Failed to sync publisher clients to server:', err));
  }, [publisherClients, hasLoadedClientsFromServer]);

  // 3. Sync collaborator changes to Server
  useEffect(() => {
    if (!hasLoadedCollaboratorsFromServer) return;
    
    localStorage.setItem('carthage_collaborators', JSON.stringify(collaborators));
    
    // Security: Filter out parent admins on the frontend if we are not authenticated as SuperAdmin / parent
    const isParentCompany = currentUser?.role === 'SuperAdmin' || activeCompanyName === 'Inter-Affaires' || activeCompanyName === 'Elyssa Entreprises S.A.';
    const filteredCollabs = isParentCompany 
      ? collaborators 
      : collaborators.filter(c => c && c.email?.toLowerCase() !== 'contact@elyssa.pro' && c.id !== 'collab_carthage_1');

    fetchWithRetry('/api/db/collaborators', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(filteredCollabs)
    }).catch(err => console.warn('Failed to sync collaborators to server:', err));
  }, [collaborators, hasLoadedCollaboratorsFromServer, currentUser, activeCompanyName]);

  // Performance Contracts (MPO/OKR) state
  const [performanceContracts, setPerformanceContracts] = useState<PerformanceContract[]>(() => {
    const saved = localStorage.getItem('carthage_performance_contracts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_DEMO_PERFORMANCE_CONTRACTS;
  });

  const handleUpdatePerformanceContracts = (contracts: PerformanceContract[]) => {
    setPerformanceContracts(contracts);
    localStorage.setItem('carthage_performance_contracts', JSON.stringify(contracts));
  };

  // Sync active company name with loaded collaborators to handle db-level renames gracefully
  useEffect(() => {
    if (!collaborators || collaborators.length === 0 || !currentUser) return;
    if (currentUser.role === 'SuperAdmin') return;
    const found = collaborators.find(c => c?.email?.toLowerCase() === currentUser?.email?.toLowerCase());
    if (found && found.company && found.company !== activeCompanyName) {
      console.log(`[STATE HEAL] Automatically updated activeCompanyName from '${activeCompanyName}' to '${found.company}' to match database.`);
      setActiveCompanyName(found.company);
    }
  }, [collaborators, currentUser, activeCompanyName]);

  const handleLoginSuccess = (session: UserSession) => {
    // Resolve activeCompany on login
    const emailLower = session.email?.toLowerCase();
    const isPlatform = session.role === 'SuperAdmin' || 
                       emailLower === 'admin@elyssa.pro' || 
                       emailLower === 'contact@elyssa.pro' ||
                       emailLower === 'ziedbenmiled3@gmail.com';

    if (isPlatform) {
      session.role = 'SuperAdmin';
    }

    setCurrentUser(session);
    localStorage.setItem('carthage_session', JSON.stringify(session));
    
    if (isPlatform) {
      const simulated = localStorage.getItem('carthage_active_company_simulated') || 'Inter-Affaires';
      setActiveCompanyName(simulated);
      setActiveTab('saas_config');
    } else {
      const sessionCompany = session.companyName;
      if (sessionCompany) {
        setActiveCompanyName(sessionCompany);
      } else {
        const found = collaborators.find(c => c?.email?.toLowerCase() === session?.email?.toLowerCase());
        setActiveCompanyName(found?.company || 'Inter-Affaires');
      }
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('carthage_session');
    
    // Clear prospect, local publisher clients cache, collaborators cache, and reset them
    localStorage.removeItem('carthage_trial_registered_prospect');
    localStorage.removeItem('carthage_publisher_clients');
    localStorage.removeItem('carthage_collaborators');
    localStorage.removeItem('carthage_active_company_simulated');
    
    setActiveTab('dashboard');
    setActiveCompanyName('Inter-Affaires');
    
    // Force clean page reload to completely reset any react states and caches
    window.location.reload();
  };

  const handleTrialSignup = (newTrialInfo: any) => {
    // 1. Save prospect details & reset any leftover trial expired simulations from previous tests
    localStorage.setItem('carthage_trial_registered_prospect', JSON.stringify(newTrialInfo));
    localStorage.removeItem('carthage_trial_expired_override');
    localStorage.setItem('carthage_trial_expired_override', 'false');
    setTrialRegisteredCompany(newTrialInfo);

    // Clear any previous purchased modules state for this company name to start trial completely fresh
    localStorage.removeItem(`carthage_purchased_modules_${newTrialInfo.companyName}`);
    localStorage.removeItem(`carthage_purchased_modules_${newTrialInfo.companyName?.toLowerCase()}`);
    setPurchasedModules([]);

    // 2. Invoke single-transaction backend signup endpoint for trial registration
    fetch('/api/auth/trial-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: newTrialInfo.companyName,
        email: newTrialInfo.email.toLowerCase(),
        password: newTrialInfo.password,
        pin: newTrialInfo.pin || '123456',
        firstName: newTrialInfo.firstName,
        lastName: newTrialInfo.lastName,
        address: newTrialInfo.address
      })
    })
    .then(async res => {
      if (res.ok) {
        const data = await res.json();
        console.log('[Trial Signup] Server signup transaction completed successfully:', data);
        
        // Sync publisher clients list with newly generated ID from server
        const newTrialClientId = data.companyId;
        const newTrialClient = {
          id: newTrialClientId,
          companyName: newTrialInfo.companyName,
          email: newTrialInfo.email.toLowerCase(),
          location: newTrialInfo.address,
          packId: 'trial', 
          paymentGateway: 'Flouci',
          status: 'trial',
          joinedDate: new Date().toISOString().split('T')[0],
          password: newTrialInfo.password,
          pin: newTrialInfo.pin || '123456'
        };
        const updatedPubClients = [newTrialClient, ...publisherClients];
        localStorage.setItem('carthage_publisher_clients', JSON.stringify(updatedPubClients));
        handleUpdatePublisherClients(updatedPubClients);

        // Sync collaborators state with returned records from server (which have correctly saved plainPassword properties)
        if (Array.isArray(data.collaborators)) {
          setCollaborators(prev => {
            const incomingIds = new Set(data.collaborators.map((c: any) => c.id));
            const filtered = prev.filter(c => !incomingIds.has(c.id));
            return [...data.collaborators, ...filtered];
          });
        }

        // Clear any previous licence/purchase requests for this company to start completely fresh
        const savedReqs = localStorage.getItem('carthage_licence_requests');
        let requestsList: any[] = [];
        if (savedReqs) {
          try { requestsList = JSON.parse(savedReqs); } catch (e) { }
        }
        requestsList = requestsList.filter((r: any) => r?.companyName?.toLowerCase() !== newTrialInfo.companyName?.toLowerCase());
        localStorage.setItem('carthage_licence_requests', JSON.stringify(requestsList));

        // Bring up the login portal page instantly
        setShowLogin(true);
      } else {
        const errData = await res.json();
        console.error('[Trial Signup] Server signup failed:', errData.error);
      }
    })
    .catch(err => {
      console.error('[Trial Signup] Network error during signup:', err);
    });
  };

  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('carthage_admin_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.companyName === "Carthage Entreprises S.A." || parsed.companyName === "Carthage Entreprises" || !parsed.companyName) {
          parsed.companyName = "Inter-Affaires";
          parsed.companyEmail = "commercial@elyssa.pro";
          localStorage.setItem('carthage_admin_settings', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing admin settings', e);
      }
    }
    return INITIAL_ADMIN_SETTINGS;
  });

  // State to trigger tenant-settings updates and keep views in sync
  const [tenantSettingsTrigger, setTenantSettingsTrigger] = useState(0);

  // Dynamically resolve settings for the active tenant (client company)
  const activeCompanySettings = useMemo(() => {
    const companyName = activeCompanyName || 'Inter-Affaires';
    if (companyName === 'Inter-Affaires' || companyName === 'Elyssa Entreprises S.A.') {
      return adminSettings;
    }
    
    const saved = localStorage.getItem(`carthage_admin_settings_${companyName}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing tenant settings', e);
      }
    }
    return {
      ...adminSettings,
      companyName: companyName,
      companyLogo: "", // default empty to incentivize upload
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      companyMF: "",
      legalForm: "",
      shareCapital: 0,
      rneNumber: "",
      legalRepresentative: "",
      cityZipCode: "",
      website: "",
    };
  }, [adminSettings, activeCompanyName, tenantSettingsTrigger]);

  const handleUpdateSettings = (newSettings: AdminSettings) => {
    const targetCompany = activeCompanyName || 'Inter-Affaires';
    const docId = targetCompany.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (!currentUser || currentUser.role === 'SuperAdmin') {
      setAdminSettings(newSettings);
      localStorage.setItem('carthage_admin_settings', JSON.stringify(newSettings));
      
      // Save to server
      fetch('/api/db/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      }).catch(err => console.error('Failed to sync admin settings to server:', err));
    } else {
      const companyName = collaborators.find(c => c?.email?.toLowerCase() === currentUser?.email?.toLowerCase())?.company || targetCompany;
      localStorage.setItem(`carthage_admin_settings_${companyName}`, JSON.stringify(newSettings));
      setTenantSettingsTrigger(prev => prev + 1);
    }

    // Save to Firestore tenant document (company_erp_data) for BYOK Gemini API key and company settings
    try {
      const docRef = doc(db, 'company_erp_data', docId);
      setDoc(docRef, {
        geminiApiKey: newSettings.geminiApiKey || '',
        admin_settings: newSettings,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.warn('Notice: Firestore tenant settings sync skipped:', err));
    } catch (e) {
      console.warn('Notice: Firestore tenant settings sync error:', e);
    }
  };

  // Dynamically inject Google Analytics & Ads tags on settings change
  useEffect(() => {
    const gaId = adminSettings.googleAnalyticsId;
    const gAdsId = adminSettings.googleAdsId;
    
    if (gaId && gaId.startsWith('G-')) {
      // 1. Remove existing tag scripts if any to prevent duplicates
      const existingScript = document.getElementById('google-tag-manager-script');
      if (existingScript) existingScript.remove();
      
      const existingConfig = document.getElementById('google-tag-config-script');
      if (existingConfig) existingConfig.remove();

      // 2. Add gtag.js script
      const script = document.createElement('script');
      script.id = 'google-tag-manager-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      // 3. Configure window dataLayer and gtag
      const configScript = document.createElement('script');
      configScript.id = 'google-tag-config-script';
      configScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${gaId}');
        ${gAdsId ? `gtag('config', '${gAdsId}');` : ''}
      `;
      document.head.appendChild(configScript);
      
      console.log("🚀 Client: Dynamically loaded Google Analytics Tag: " + gaId);
    }
  }, [adminSettings.googleAnalyticsId, adminSettings.googleAdsId]);

  // Real-time Active Presence Heartbeat for the Radar Console
  useEffect(() => {
    if (!currentUser) return;
    
    const sendHeartbeat = () => {
      let friendlyPath = activeTab;
      switch (activeTab) {
        case 'dashboard': friendlyPath = "Trésorerie & Statistiques"; break;
        case 'clients': friendlyPath = "Portefeuille Clients"; break;
        case 'invoices': friendlyPath = "Factures & Devis"; break;
        case 'billing': friendlyPath = "Gestion de Facturation"; break;
        case 'recouvrement': friendlyPath = "Relance & Recouvrement"; break;
        case 'crm': friendlyPath = "Gestion Relation Client (CRM)"; break;
        case 'compliance': friendlyPath = "TVA & Retenue Source"; break;
        case 'admin': friendlyPath = "Console Administration ERP"; break;
        case 'saas': friendlyPath = "Abonnements Elyssa SaaS"; break;
        default: friendlyPath = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      }

      fetch('/api/db/active-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role,
          company: activeCompanySettings.companyName || "Inter-Affaires",
          activePath: friendlyPath
        })
      }).catch(err => console.warn('Presence heartbeat failed:', err));
    };

    // Send immediately on mount / tab change
    sendHeartbeat();

    // Repeat every 25 seconds
    const interval = setInterval(sendHeartbeat, 25000);
    return () => clearInterval(interval);
  }, [currentUser, activeTab, activeCompanySettings.companyName]);

  // --- AUTOMATIC CLEARANCE OF ALL DEMO/MOCK DATA UPON PORTAL PACK ACTIVATION / PURGE ---
  const isDemoRecord = (item: any): boolean => {
    if (!item) return false;
    if (item.is_demo === true || item.isDemo === true) return true;
    const id = String(item.id || '').toLowerCase();
    if (id.startsWith('demo-') || id.startsWith('demo_') || id.startsWith('pc-demo-') || id.startsWith('collab_demo_')) return true;

    const isMockPattern = 
      (id.startsWith('cli_') && /^\d{1,2}$/.test(id.substring(4))) ||
      (id.startsWith('inv_') && /^\d{1,2}$/.test(id.substring(4))) ||
      (id.startsWith('emp_') && /^\d{1,2}$/.test(id.substring(4))) ||
      (id.startsWith('rec_') && /^\d{1,2}$/.test(id.substring(4))) ||
      (id.startsWith('vis_') && /^\d{1,2}$/.test(id.substring(4))) ||
      (id.startsWith('comp_') && /^\d{1,2}$/.test(id.substring(5))) ||
      (id.startsWith('sup_') && /^\d{1,2}$/.test(id.substring(4))) ||
      (id.startsWith('prod_') && /^\d{1,2}$/.test(id.substring(5))) ||
      (id.startsWith('mov_') && /^\d{1,2}$/.test(id.substring(4))) ||
      (id.startsWith('doc_init_') && /^\d{1,2}$/.test(id.substring(9))) ||
      id.startsWith('mail-00') ||
      id.startsWith('bc-2026-') ||
      id.startsWith('req-2026-') ||
      id.startsWith('da-2026-') ||
      id.startsWith('of-2026-') ||
      id.startsWith('asset-') ||
      id.startsWith('mo-') ||
      id.startsWith('ct_') ||
      id.startsWith('cess-') ||
      id.startsWith('imp_') ||
      id.startsWith('lc_') ||
      id.startsWith('v_') ||
      id.startsWith('inc_') ||
      id.startsWith('exp_') ||
      id.startsWith('nom-');

    return isMockPattern;
  };

  const clearDemoData = () => {
    setClients(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_clients', JSON.stringify(filtered));
      return filtered;
    });
    setComplaints(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_complaints', JSON.stringify(filtered));
      return filtered;
    });
    setInvoices(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_invoices', JSON.stringify(filtered));
      return filtered;
    });
    setVisitReports(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_visit_reports', JSON.stringify(filtered));
      return filtered;
    });
    setCompetitors(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_competitors', JSON.stringify(filtered));
      return filtered;
    });
    setSuppliers(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_suppliers', JSON.stringify(filtered));
      return filtered;
    });
    setProducts(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_products', JSON.stringify(filtered));
      return filtered;
    });
    setStockMovements(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_stock_movements', JSON.stringify(filtered));
      return filtered;
    });
    setIncomingEmails(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_incoming_emails', JSON.stringify(filtered));
      return filtered;
    });
    setEmailTemplates(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_email_templates', JSON.stringify(filtered));
      return filtered;
    });
    setCommunicationLogs(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_communication_logs', JSON.stringify(filtered));
      return filtered;
    });
    setBankAccounts(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_bank_accounts', JSON.stringify(filtered));
      return filtered;
    });
    setBankTransactions(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_bank_transactions', JSON.stringify(filtered));
      return filtered;
    });
    setTaxDeclarations(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_tax_declarations', JSON.stringify(filtered));
      return filtered;
    });
    setYearEndClosings(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_year_end_closings', JSON.stringify(filtered));
      return filtered;
    });
    setDocuments(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_documents', JSON.stringify(filtered));
      return filtered;
    });
    setEmployees(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_employees', JSON.stringify(filtered));
      return filtered;
    });
    setContracts(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_contracts', JSON.stringify(filtered));
      return filtered;
    });
    setAbsences(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_absences', JSON.stringify(filtered));
      return filtered;
    });
    setPayslips(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_payslips', JSON.stringify(filtered));
      return filtered;
    });
    setAssets(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_assets_immobilisations', JSON.stringify(filtered));
      return filtered;
    });
    setCessionEntries(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_cession_entries', JSON.stringify(filtered));
      return filtered;
    });
    setNomenclatures(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_production_nomenclatures', JSON.stringify(filtered));
      return filtered;
    });
    setManufacturingOrders(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_production_manufacturing_orders', JSON.stringify(filtered));
      return filtered;
    });
    setPurchaseRequisitions(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_purchasing_requisitions', JSON.stringify(filtered));
      return filtered;
    });
    setPurchaseOrders(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_purchasing_orders', JSON.stringify(filtered));
      return filtered;
    });
    setSupplierPerformance(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_purchasing_suppliers_performance', JSON.stringify(filtered));
      return filtered;
    });
    setImportFolders(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_import_folders', JSON.stringify(filtered));
      return filtered;
    });
    setLcRequests(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_lc_requests', JSON.stringify(filtered));
      return filtered;
    });
    setVehicles(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_fleet_vehicles', JSON.stringify(filtered));
      return filtered;
    });
    setMissions(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_fleet_missions', JSON.stringify(filtered));
      return filtered;
    });
    setExpenses(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_fleet_expenses', JSON.stringify(filtered));
      return filtered;
    });
    setIncidents(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('carthage_fleet_incidents', JSON.stringify(filtered));
      return filtered;
    });
    setCompanyLocations(prev => {
      const filtered = prev.filter(item => !isDemoRecord(item));
      localStorage.setItem('elyssa_company_locations', JSON.stringify(filtered));
      return filtered;
    });

    setCollaborators(prevCollabs => {
      const filtered = prevCollabs.filter(c => {
        const isSupervisor = c?.email?.toLowerCase() === 'contact@elyssa.pro';
        const isCurrentSessionUser = c?.email?.toLowerCase() === currentUser?.email?.toLowerCase();
        const belongsToActiveCompany = c?.company?.toLowerCase() === activeCompanyName?.toLowerCase();
        return isSupervisor || isCurrentSessionUser || (belongsToActiveCompany && !isDemoRecord(c));
      });
      localStorage.setItem('carthage_collaborators', JSON.stringify(filtered));
      return filtered;
    });

    const filterKey = (key: string) => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(item => !isDemoRecord(item));
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        } catch (e) {
          console.error(`Error filtering key ${key}:`, e);
        }
      }
    };

    filterKey('carthage_treasury_cheques_effects');
    filterKey('carthage_treasury_bank_audits');
    filterKey('carthage_juridique_shareholders');
    filterKey('carthage_juridique_deadlines');
    filterKey('carthage_juridique_documents');
    filterKey('elyssa_company_locations');
    filterKey('carthage_company_transfer_audits');
    filterKey('carthage_dataroom');
    filterKey('carthage_fuel_bons');
    filterKey('carthage_trs_logs');
    filterKey('carthage_accounting_entries');
    filterKey('carthage_mobile_devices');
    filterKey('carthage_field_sessions');
    filterKey('carthage_offline_orders');
    filterKey('carthage_mobile_orders');
    filterKey('carthage_mobile_punches');
    filterKey('carthage_van_sales_logs');
    filterKey('elyssa_mobile_fleet');
    filterKey('carthage_mobile_logs');
    filterKey('carthage_attendance_logs');
    filterKey('carthage_attendance_records');
    filterKey('elyssa_pocket_punches');
    const suffix = activeCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    filterKey(`elyssa_attendance_records_${suffix}`);
    filterKey(`elyssa_payroll_pending_adjustments_${suffix}`);
    filterKey('elyssa_pos_transactions');

    setIsSimulationActive(false);
    localStorage.setItem('carthage_demo_simulation_active', 'false');
  };

  const handleUpdateSubscriptionPack = (newPack: string) => {
    const clientRecord = publisherClients.find(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
    const wasTrial = clientRecord?.status === 'trial' || subscriptionPack === 'independent';
    const isPaidPack = newPack !== 'trial' && newPack !== 'independent';

    if (wasTrial && isPaidPack) {
      clearDemoData();
      setShowDemoClearedToast(true);
      setTimeout(() => {
        setShowDemoClearedToast(false);
      }, 10000);
    }
    setSubscriptionPack(newPack);
    localStorage.setItem('carthage_sub_pack', newPack);
  };

  // Re-verify on status transitions (such as admin approving the activation request from centralized hub)
  const prevStatusRef = useRef<string>('');

  useEffect(() => {
    const clientRecord = publisherClients.find(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
    const currentStatus = clientRecord?.status || 'none';
    
    // If active company transitions from trial to active subscription
    if (prevStatusRef.current === 'trial' && currentStatus === 'active') {
      clearDemoData();
      setShowDemoClearedToast(true);
      setTimeout(() => {
        setShowDemoClearedToast(false);
      }, 10000);
    }
    prevStatusRef.current = currentStatus;
  }, [activeCompanyName, publisherClients]);

  // Keep track of publisher clients dynamically as state defined earlier in the file

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('carthage_clients');
    return saved ? JSON.parse(saved) : [];
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('carthage_complaints');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('carthage_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [visitReports, setVisitReports] = useState<VisitReport[]>(() => {
    const saved = localStorage.getItem('carthage_visit_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [competitors, setCompetitors] = useState<CompetitorReport[]>(() => {
    const saved = localStorage.getItem('carthage_competitors');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('carthage_suppliers');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('carthage_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('carthage_stock_movements');
    return saved ? JSON.parse(saved) : [];
  });

  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(() => {
    const saved = localStorage.getItem('carthage_smtp_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SMTP_SETTINGS;
  });

  const [imapSettings, setImapSettings] = useState<ImapSettings>(() => {
    const saved = localStorage.getItem('carthage_imap_settings');
    return saved ? JSON.parse(saved) : DEFAULT_IMAP_SETTINGS;
  });

  const [incomingEmails, setIncomingEmails] = useState<IncomingEmail[]>(() => {
    const saved = localStorage.getItem('carthage_incoming_emails');
    return saved ? JSON.parse(saved) : [];
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('carthage_email_templates');
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_TEMPLATES;
  });

  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>(() => {
    const saved = localStorage.getItem('carthage_communication_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('carthage_bank_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('carthage_bank_transactions');
    if (!saved) return [];
    try {
      const txs = JSON.parse(saved);
      if (Array.isArray(txs)) {
        return txs.map((tx: any) => {
          const updated = { ...tx };
          
          if (tx.type === 'Credit') {
            updated.type = 'In';
          }
          if (tx.type === 'Debit') {
            updated.type = 'Out';
          }
          
          if (tx.status === 'Reconciled' || !tx.status) {
            updated.status = 'Cleared';
          }
          
          if (!updated.method) {
            if (tx.description && tx.description.includes('[CASH]')) {
              updated.method = 'Especes';
            } else if (tx.description && tx.description.includes('[CHEQUE]')) {
              updated.method = 'Cheque';
            } else if (tx.description && (tx.description.includes('[CARD]') || tx.description.includes('[FLOUCI]') || tx.description.includes('[CREDIT]'))) {
              updated.method = 'Autre';
            } else {
              updated.method = 'Especes';
            }
          }
          
          if (!updated.reference) {
            const match = tx.description ? tx.description.match(/(TK-\d+|AV-\d+)/) : null;
            if (match) {
              updated.reference = match[1];
            } else if (tx.invoiceRef) {
              updated.reference = tx.invoiceRef;
            } else {
              updated.reference = 'POS-TX';
            }
          }

          if (updated.category === 'Vente de Marchandises' || updated.category === 'Avoirs accordés / Retours') {
            updated.category = updated.category === 'Vente de Marchandises' ? 'Vente' : 'Autre';
          }
          
          return updated;
        });
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [taxDeclarations, setTaxDeclarations] = useState<TaxDeclaration[]>(() => {
    const saved = localStorage.getItem('carthage_tax_declarations');
    return saved ? JSON.parse(saved) : [];
  });

  const [yearEndClosings, setYearEndClosings] = useState<YearEndClosing[]>(() => {
    const saved = localStorage.getItem('carthage_year_end_closings');
    return saved ? JSON.parse(saved) : [];
  });

  const [assets, setAssets] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_assets_immobilisations');
    return saved ? JSON.parse(saved) : [];
  });

  const [cessionEntries, setCessionEntries] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_cession_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [nomenclatures, setNomenclatures] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_production_nomenclatures');
    return saved ? JSON.parse(saved) : [];
  });

  const [manufacturingOrders, setManufacturingOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_production_manufacturing_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseRequisitions, setPurchaseRequisitions] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_purchasing_requisitions');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_purchasing_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [supplierPerformance, setSupplierPerformance] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_purchasing_suppliers_performance');
    return saved ? JSON.parse(saved) : [];
  });

  const [importFolders, setImportFolders] = useState<ImportFolder[]>(() => {
    const saved = localStorage.getItem('carthage_import_folders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* ignore */ }
    }
    return DEFAULT_IMPORT_FOLDERS;
  });

  const [lcRequests, setLcRequests] = useState<LCRequest[]>(() => {
    const saved = localStorage.getItem('carthage_lc_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* ignore */ }
    }
    return DEFAULT_LC_REQUESTS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('carthage_fleet_vehicles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((v: any) => v.id));
          const missing = DEFAULT_FLEET_VEHICLES.filter(v => !ids.has(v.id));
          return missing.length > 0 ? [...parsed, ...missing] : parsed;
        }
      } catch { /* ignore */ }
    }
    return DEFAULT_FLEET_VEHICLES;
  });

  const [missions, setMissions] = useState<MissionOrder[]>(() => {
    const saved = localStorage.getItem('carthage_fleet_missions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((m: any) => m.id));
          const missing = DEFAULT_FLEET_MISSIONS.filter(m => !ids.has(m.id));
          return missing.length > 0 ? [...parsed, ...missing] : parsed;
        }
      } catch { /* ignore */ }
    }
    return DEFAULT_FLEET_MISSIONS;
  });

  const [expenses, setExpenses] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_fleet_expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* ignore */ }
    }
    return DEFAULT_FLEET_EXPENSES;
  });

  const [incidents, setIncidents] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_fleet_incidents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* ignore */ }
    }
    return DEFAULT_FLEET_INCIDENTS;
  });

  // --- SIMULATION / DEMO MODE CRM INJECTION ENGINE ---
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(() => {
    return localStorage.getItem('carthage_demo_simulation_active') === 'true';
  });

  const injectCrmDemoData = () => {
    const demoClientsMapped = INITIAL_CLIENTS.map(c => ({
      ...c,
      id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`,
      engagements: (c.engagements || []).map(e => ({
        ...e,
        id: e.id.startsWith('demo-') ? e.id : `demo-${e.id}`
      }))
    }));
    
    const demoComplaintsMapped = INITIAL_COMPLAINTS.map(c => ({
      ...c,
      id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`,
      clientId: c.clientId.startsWith('demo-') ? c.clientId : `demo-${c.clientId}`
    }));

    const demoInvoicesMapped = INITIAL_INVOICES.map(i => ({
      ...i,
      id: i.id.startsWith('demo-') ? i.id : `demo-${i.id}`,
      clientId: i.clientId.startsWith('demo-') ? i.clientId : `demo-${i.clientId}`,
      recouvrementSteps: (i.recouvrementSteps || []).map(s => ({
        ...s,
        id: s.id.startsWith('demo-') ? s.id : `demo-${s.id}`
      }))
    }));

    const demoVisitReportsMapped = INITIAL_VISIT_REPORTS.map(v => ({
      ...v,
      id: v.id.startsWith('demo-') ? v.id : `demo-${v.id}`,
      clientId: v.clientId.startsWith('demo-') ? v.clientId : `demo-${v.clientId}`
    }));

    const demoCompetitorsMapped = INITIAL_COMPETITORS.map(c => ({
      ...c,
      id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`
    }));

    const demoSuppliersMapped = INITIAL_SUPPLIERS.map(s => ({
      ...s,
      id: s.id.startsWith('demo-') ? s.id : `demo-${s.id}`
    }));

    const demoProductsMapped = INITIAL_PRODUCTS.map(p => ({
      ...p,
      id: p.id.startsWith('demo-') ? p.id : `demo-${p.id}`,
      supplierId: p.supplierId ? (p.supplierId.startsWith('demo-') ? p.supplierId : `demo-${p.supplierId}`) : undefined
    }));

    const demoStockMovementsMapped = INITIAL_STOCK_MOVEMENTS.map(s => ({
      ...s,
      id: s.id.startsWith('demo-') ? s.id : `demo-${s.id}`,
      productId: s.productId.startsWith('demo-') ? s.productId : `demo-${s.productId}`
    }));

    const demoBankAccountsMapped = INITIAL_BANK_ACCOUNTS.map(b => ({
      ...b,
      id: b.id.startsWith('demo-') ? b.id : `demo-${b.id}`
    }));

    const demoBankTransactionsMapped = INITIAL_BANK_TRANSACTIONS.map(b => ({
      ...b,
      id: b.id.startsWith('demo-') ? b.id : `demo-${b.id}`,
      accountId: b.accountId.startsWith('demo-') ? b.accountId : `demo-${b.accountId}`
    }));

    const demoTaxDeclarationsMapped = INITIAL_TAX_DECLARATIONS.map(t => ({
      ...t,
      id: t.id.startsWith('demo-') ? t.id : `demo-${t.id}`
    }));

    const demoYearEndClosingsMapped = INITIAL_YEAR_END_CLOSINGS.map(y => ({
      ...y,
      id: y.id.startsWith('demo-') ? y.id : `demo-${y.id}`
    }));

    // HR Demo Data Definition
    const demoEmployees: Employee[] = [
      {
        id: 'demo-emp_1',
        name: 'Khaled Ben Amor (Démo)',
        email: 'k.benamor@carthage.com.tn',
        jobTitle: 'Directeur Financier & Recouvrement',
        ssn: '14839211-92',
        rib: '03001010015920038472',
        baseSalary: 2600.000,
        transportAllowance: 180.000,
        presenceAllowance: 80.000,
        otherAllowances: 300.000,
        familySituation: 'Married_2',
        isChefDeFamille: true,
        status: 'Active',
        hiringDate: '2023-01-15'
      },
      {
        id: 'demo-emp_2',
        name: 'Ines Dridi (Démo)',
        email: 'i.dridi@carthage.com.tn',
        jobTitle: 'Responsable Rapprochement',
        ssn: '20943810-18',
        rib: '08102030026710048259',
        baseSalary: 1750.000,
        transportAllowance: 120.000,
        presenceAllowance: 80.000,
        otherAllowances: 150.000,
        familySituation: 'Single',
        isChefDeFamille: false,
        status: 'Active',
        hiringDate: '2024-03-10'
      },
      {
        id: 'demo-emp_3',
        name: 'Mohamed Ali Gharbi (Démo)',
        email: 'm.gharbi@carthage.com.tn',
        jobTitle: 'Chargé Clientèle Extérieure',
        ssn: '12554739-44',
        rib: '12004050037840059341',
        baseSalary: 1400.000,
        transportAllowance: 110.000,
        presenceAllowance: 80.000,
        otherAllowances: 100.000,
        familySituation: 'Married_1',
        isChefDeFamille: true,
        status: 'Active',
        hiringDate: '2025-06-18'
      },
      {
        id: 'demo-emp_4',
        name: 'Amel Ben Soltane (Démo)',
        email: 'a.bensoltane@carthage.com.tn',
        jobTitle: 'Responsable Ressources Humaines',
        ssn: '19483029-45',
        rib: '05201040059283749501',
        baseSalary: 2100.000,
        transportAllowance: 150.000,
        presenceAllowance: 80.000,
        otherAllowances: 200.000,
        familySituation: 'Married_3',
        isChefDeFamille: true,
        status: 'Active',
        hiringDate: '2024-11-01'
      },
      {
        id: 'demo-emp_5',
        name: 'Sami Mansour (Démo)',
        email: 's.mansour@carthage.com.tn',
        jobTitle: 'Développeur ERP Principal',
        ssn: '11049382-77',
        rib: '14102030048592837410',
        baseSalary: 3200.000,
        transportAllowance: 200.000,
        presenceAllowance: 80.000,
        otherAllowances: 500.000,
        familySituation: 'Single',
        isChefDeFamille: false,
        status: 'Active',
        hiringDate: '2025-01-10'
      }
    ];

    const demoContracts: WorkContract[] = [
      {
        id: 'demo-ct_1',
        employeeId: 'demo-emp_1',
        employeeName: 'Khaled Ben Amor (Démo)',
        contractType: 'CDI',
        startDate: '2023-01-15',
        trialPeriodMonths: 3,
        baseSalary: 2600.000,
        status: 'Signed',
        dutiesDescription: 'Superviser l\'ensemble des processus financiers, élaboration du budget annuel, pilotage de la trésorerie et reporting réglementaire de Elyssa S.A. auprès de la Banque Centrale de Tunisie.',
        generatedAt: '2023-01-15',
        signedAt: '2023-01-15'
      },
      {
        id: 'demo-ct_2',
        employeeId: 'demo-emp_2',
        employeeName: 'Ines Dridi (Démo)',
        contractType: 'CDD',
        startDate: '2024-03-10',
        endDate: '2026-03-09',
        trialPeriodMonths: 2,
        baseSalary: 1750.000,
        status: 'Signed',
        dutiesDescription: 'Contrôler les opérations de rapprochement bancaire, auditer les pièces comptables de paie et s\'assurer du respect des règles fiscales de retenue à la source en Tunisie.',
        generatedAt: '2024-03-05',
        signedAt: '2024-03-10'
      },
      {
        id: 'demo-ct_3',
        employeeId: 'demo-emp_3',
        employeeName: 'Mohamed Ali Gharbi (Démo)',
        contractType: 'CIVP',
        startDate: '2025-06-18',
        endDate: '2026-06-17',
        trialPeriodMonths: 1,
        baseSalary: 1400.000,
        status: 'Signed',
        dutiesDescription: 'Assister les clients de Elyssa S.A., préparer la documentation de prospection commerciale et de service extérieur pour la zone industrielle de Charguia et Ben Arous.',
        generatedAt: '2025-06-15',
        signedAt: '2025-06-18'
      },
      {
        id: 'demo-ct_4',
        employeeId: 'demo-emp_4',
        employeeName: 'Amel Ben Soltane (Démo)',
        contractType: 'CDI',
        startDate: '2024-11-01',
        trialPeriodMonths: 3,
        baseSalary: 2100.000,
        status: 'Signed',
        dutiesDescription: 'Gérer l\'ensemble des dossiers administratifs du personnel, l\'élaboration de la paie mensuelle, le suivi des recrutements et des relations avec la CNSS et l\'Inspection du Travail.',
        generatedAt: '2024-10-25',
        signedAt: '2024-11-01'
      },
      {
        id: 'demo-ct_5',
        employeeId: 'demo-emp_5',
        employeeName: 'Sami Mansour (Démo)',
        contractType: 'CDI',
        startDate: '2025-01-10',
        trialPeriodMonths: 3,
        baseSalary: 3200.000,
        status: 'Signed',
        dutiesDescription: 'Concevoir et développer de nouveaux modules logiciels pour l\'ERP Elyssa, assurer la maintenance corrective et évolutive des applications, et optimiser les performances de la base de données.',
        generatedAt: '2025-01-05',
        signedAt: '2025-01-10'
      }
    ];

    const demoAbsences: AbsenceRecord[] = [
      {
        id: 'demo-abs_1',
        employeeId: 'demo-emp_2',
        employeeName: 'Ines Dridi (Démo)',
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
        id: 'demo-abs_2',
        employeeId: 'demo-emp_3',
        employeeName: 'Mohamed Ali Gharbi (Démo)',
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
        id: 'demo-abs_3',
        employeeId: 'demo-emp_1',
        employeeName: 'Khaled Ben Amor (Démo)',
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

    const demoPayslips: Payslip[] = [
      {
        id: 'demo-ps_1_may',
        employeeId: 'demo-emp_1',
        employeeName: 'Khaled Ben Amor (Démo)',
        month: '2026-05',
        baseSalary: 2600.000,
        grossSalary: 3160.000,
        cnssEmployee: 290.088,
        cnssEmployer: 539.412,
        professionalExpenses: 166.667,
        familyDeduction: 41.667,
        taxableIncome: 2661.578,
        irpp: 582.345,
        css: 26.616,
        netSalary: 2260.951,
        allowancesPaid: 560.000,
        status: 'Paid',
        paymentMethod: 'Virement',
        bankAccountId: 'ba_1',
        paidDate: '2026-05-31'
      },
      {
        id: 'demo-ps_2_may',
        employeeId: 'demo-emp_2',
        employeeName: 'Ines Dridi (Démo)',
        month: '2026-05',
        baseSalary: 1750.000,
        grossSalary: 2100.000,
        cnssEmployee: 192.780,
        cnssEmployer: 358.470,
        professionalExpenses: 166.667,
        familyDeduction: 0.000,
        taxableIncome: 1740.553,
        irpp: 312.450,
        css: 17.406,
        netSalary: 1577.364,
        allowancesPaid: 350.000,
        status: 'Paid',
        paymentMethod: 'Virement',
        bankAccountId: 'ba_1',
        paidDate: '2026-05-31'
      },
      {
        id: 'demo-ps_3_may',
        employeeId: 'demo-emp_3',
        employeeName: 'Mohamed Ali Gharbi (Démo)',
        month: '2026-05',
        baseSalary: 1400.000,
        grossSalary: 1690.000,
        cnssEmployee: 155.142,
        cnssEmployer: 288.483,
        professionalExpenses: 153.486,
        familyDeduction: 33.333,
        taxableIncome: 1348.039,
        irpp: 202.150,
        css: 13.480,
        netSalary: 1319.228,
        allowancesPaid: 290.000,
        status: 'Paid',
        paymentMethod: 'Virement',
        bankAccountId: 'ba_1',
        paidDate: '2026-05-31'
      },
      {
        id: 'demo-ps_4_may',
        employeeId: 'demo-emp_4',
        employeeName: 'Amel Ben Soltane (Démo)',
        month: '2026-05',
        baseSalary: 2100.000,
        grossSalary: 2530.000,
        cnssEmployee: 232.254,
        cnssEmployer: 431.871,
        professionalExpenses: 166.667,
        familyDeduction: 50.000,
        taxableIncome: 2081.079,
        irpp: 412.350,
        css: 20.811,
        netSalary: 1864.585,
        allowancesPaid: 430.000,
        status: 'Paid',
        paymentMethod: 'Virement',
        bankAccountId: 'ba_1',
        paidDate: '2026-05-31'
      },
      {
        id: 'demo-ps_5_may',
        employeeId: 'demo-emp_5',
        employeeName: 'Sami Mansour (Démo)',
        month: '2026-05',
        baseSalary: 3200.000,
        grossSalary: 3980.000,
        cnssEmployee: 365.364,
        cnssEmployer: 679.386,
        professionalExpenses: 166.667,
        familyDeduction: 0.000,
        taxableIncome: 3447.969,
        irpp: 825.400,
        css: 34.480,
        netSalary: 2754.756,
        allowancesPaid: 780.000,
        status: 'Paid',
        paymentMethod: 'Virement',
        bankAccountId: 'ba_1',
        paidDate: '2026-05-31'
      },
      {
        id: 'demo-ps_1_june',
        employeeId: 'demo-emp_1',
        employeeName: 'Khaled Ben Amor (Démo)',
        month: '2026-06',
        baseSalary: 2600.000,
        grossSalary: 3160.000,
        cnssEmployee: 290.088,
        cnssEmployer: 539.412,
        professionalExpenses: 166.667,
        familyDeduction: 41.667,
        taxableIncome: 2661.578,
        irpp: 582.345,
        css: 26.616,
        netSalary: 2260.951,
        allowancesPaid: 560.000,
        status: 'Approved',
        paymentMethod: 'Virement',
        bankAccountId: 'ba_1'
      },
      {
        id: 'demo-ps_2_june',
        employeeId: 'demo-emp_2',
        employeeName: 'Ines Dridi (Démo)',
        month: '2026-06',
        baseSalary: 1750.000,
        grossSalary: 1860.000,
        cnssEmployee: 170.748,
        cnssEmployer: 317.502,
        professionalExpenses: 155.333,
        familyDeduction: 0.000,
        taxableIncome: 1533.919,
        irpp: 252.350,
        css: 15.339,
        netSalary: 1421.563,
        allowancesPaid: 350.000,
        absencesDeduction: 240.000,
        absenceDaysTracked: 4,
        status: 'Approved',
        paymentMethod: 'Virement',
        bankAccountId: 'ba_1'
      },
      {
        id: 'demo-ps_3_june',
        employeeId: 'demo-emp_3',
        employeeName: 'Mohamed Ali Gharbi (Démo)',
        month: '2026-06',
        baseSalary: 1400.000,
        grossSalary: 1690.000,
        cnssEmployee: 155.142,
        cnssEmployer: 288.483,
        professionalExpenses: 153.486,
        familyDeduction: 33.333,
        taxableIncome: 1348.039,
        irpp: 202.150,
        css: 13.480,
        netSalary: 1319.228,
        allowancesPaid: 290.000,
        status: 'Draft',
        paymentMethod: 'Virement',
        bankAccountId: 'ba_1'
      }
    ];

    const demoDocuments: GedDocument[] = [
      {
        id: "demo-doc_1",
        name: "Contrat_CDI_Khaled_Ben_Amor_Signed",
        type: "Contract",
        fileSize: "245 KB",
        fileType: "application/pdf",
        uploadDate: "2023-01-15",
        linkedToType: "Employee",
        linkedToId: "demo-emp_1",
        linkedToName: "Khaled Ben Amor (Démo)",
        description: "Contrat de travail permanent en qualité de Directeur Financier & Recouvrement.",
        version: 1,
        uploadedBy: "contact@elyssa.pro"
      },
      {
        id: "demo-doc_2",
        name: "Attestation_Ines_Dridi_ID",
        type: "Other",
        fileSize: "112 KB",
        fileType: "image/png",
        uploadDate: "2024-03-10",
        linkedToType: "Employee",
        linkedToId: "demo-emp_2",
        linkedToName: "Ines Dridi (Démo)",
        description: "Copie scannée de la Carte d'Identité Nationale (CIN).",
        version: 1,
        uploadedBy: "contact@elyssa.pro"
      },
      {
        id: "demo-doc_3",
        name: "Contrat_CIVP_Mohamed_Ali_Gharbi_Signed",
        type: "Contract",
        fileSize: "185 KB",
        fileType: "application/pdf",
        uploadDate: "2025-06-18",
        linkedToType: "Employee",
        linkedToId: "demo-emp_3",
        linkedToName: "Mohamed Ali Gharbi (Démo)",
        description: "Contrat d'insertion CIVP visé par l'ANETI.",
        version: 1,
        uploadedBy: "contact@elyssa.pro"
      },
      {
        id: "demo-doc_4",
        name: "Fiche_Paie_Khaled_Ben_Amor_Mai_2026",
        type: "Other",
        fileSize: "85 KB",
        fileType: "application/pdf",
        uploadDate: "2026-05-31",
        linkedToType: "Employee",
        linkedToId: "demo-emp_1",
        linkedToName: "Khaled Ben Amor (Démo)",
        description: "Fiche de paie numérique certifiée conforme pour Mai 2026.",
        version: 1,
        uploadedBy: "contact@elyssa.pro"
      }
    ];

    const demoClientIds = new Set(demoClientsMapped.map(x => x.id));
    const demoComplaintIds = new Set(demoComplaintsMapped.map(x => x.id));
    const demoInvoiceIds = new Set(demoInvoicesMapped.map(x => x.id));
    const demoVisitReportIds = new Set(demoVisitReportsMapped.map(x => x.id));
    const demoCompetitorIds = new Set(demoCompetitorsMapped.map(x => x.id));
    const demoSupplierIds = new Set(demoSuppliersMapped.map(x => x.id));
    const demoProductIds = new Set(demoProductsMapped.map(x => x.id));
    const demoStockMovementIds = new Set(demoStockMovementsMapped.map(x => x.id));
    const demoBankAccountIds = new Set(demoBankAccountsMapped.map(x => x.id));
    const demoBankTransactionIds = new Set(demoBankTransactionsMapped.map(x => x.id));
    const demoTaxDeclarationIds = new Set(demoTaxDeclarationsMapped.map(x => x.id));
    const demoYearEndClosingIds = new Set(demoYearEndClosingsMapped.map(x => x.id));

    setClients(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoClientIds.has(`demo-${x.id}`));
      return [...demoClientsMapped, ...filtered];
    });
    setComplaints(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoComplaintIds.has(`demo-${x.id}`));
      return [...demoComplaintsMapped, ...filtered];
    });
    setInvoices(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoInvoiceIds.has(`demo-${x.id}`));
      return [...demoInvoicesMapped, ...filtered];
    });
    setVisitReports(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoVisitReportIds.has(`demo-${x.id}`));
      return [...demoVisitReportsMapped, ...filtered];
    });
    setCompetitors(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoCompetitorIds.has(`demo-${x.id}`));
      return [...demoCompetitorsMapped, ...filtered];
    });
    setSuppliers(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoSupplierIds.has(`demo-${x.id}`));
      return [...demoSuppliersMapped, ...filtered];
    });
    setProducts(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoProductIds.has(`demo-${x.id}`));
      return [...demoProductsMapped, ...filtered];
    });
    setStockMovements(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoStockMovementIds.has(`demo-${x.id}`));
      return [...demoStockMovementsMapped, ...filtered];
    });
    setBankAccounts(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoBankAccountIds.has(`demo-${x.id}`));
      return [...demoBankAccountsMapped, ...filtered];
    });
    setBankTransactions(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoBankTransactionIds.has(`demo-${x.id}`));
      return [...demoBankTransactionsMapped, ...filtered];
    });
    setTaxDeclarations(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoTaxDeclarationIds.has(`demo-${x.id}`));
      return [...demoTaxDeclarationsMapped, ...filtered];
    });
    setYearEndClosings(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-') && !demoYearEndClosingIds.has(`demo-${x.id}`));
      return [...demoYearEndClosingsMapped, ...filtered];
    });

    // Inject and save Human Resources Demo data
    setEmployees(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-'));
      const combined = [...demoEmployees, ...filtered];
      localStorage.setItem('carthage_employees', JSON.stringify(combined));
      return combined;
    });

    setDocuments(prev => {
      const filtered = prev.filter(x => !x.id.startsWith('demo-'));
      const combined = [...demoDocuments, ...filtered];
      localStorage.setItem('carthage_documents', JSON.stringify(combined));
      return combined;
    });

    const savedContracts = localStorage.getItem('carthage_contracts');
    let contractsList = savedContracts ? JSON.parse(savedContracts) : [];
    contractsList = contractsList.filter((c: any) => !c.id.startsWith('demo-'));
    localStorage.setItem('carthage_contracts', JSON.stringify([...demoContracts, ...contractsList]));

    const savedAbsences = localStorage.getItem('carthage_absences');
    let absencesList = savedAbsences ? JSON.parse(savedAbsences) : [];
    absencesList = absencesList.filter((a: any) => !a.id.startsWith('demo-'));
    localStorage.setItem('carthage_absences', JSON.stringify([...demoAbsences, ...absencesList]));

    const savedPayslips = localStorage.getItem('carthage_payslips');
    let payslipsList = savedPayslips ? JSON.parse(savedPayslips) : [];
    payslipsList = payslipsList.filter((p: any) => !p.id.startsWith('demo-'));
    localStorage.setItem('carthage_payslips', JSON.stringify([...demoPayslips, ...payslipsList]));
  };

  const clearCrmDemoData = () => {
    clearDemoData();
  };

  const handleSuperAdminInsertDemos = () => {
    // 1. SaaS clients
    const demoClients = [
      { id: 'pc-demo-1', companyName: 'STE CARTHAGE IMPORT-EXPORT', email: 'carthage@import.tn', password: 'Carthage2026!', location: 'Nabeul', packId: 'full', paymentGateway: 'Virement', status: 'trial', joinedDate: '2026-06-24', interval: 'yearly' },
      { id: 'pc-demo-2', companyName: 'EL KEF AGRICOLE COOPERATIVE', email: 'kef@agri.tn', password: 'Carthage2026!', location: 'El Kef', packId: 'logistics', paymentGateway: 'Virement', status: 'active', joinedDate: '2026-06-24', interval: 'quarterly' },
      { id: 'pc-demo-3', companyName: 'BIZERTE MARITIME & DOCKING', email: 'contact@bizerte-maritime.com', password: 'Carthage2026!', location: 'Bizerte', packId: 'independent', paymentGateway: 'Flouci', status: 'active', joinedDate: '2026-06-24', interval: 'monthly' },
      { id: 'pc-demo-4', companyName: 'DJERBA RECEPTIFS TOURISME', email: 'djerba@tourisme.tn', password: 'Carthage2026!', location: 'Djerba', packId: 'custom', paymentGateway: 'Wafacash', status: 'active', joinedDate: '2026-06-24', interval: 'yearly' }
    ];

    const existingIds = new Set(publisherClients.map(c => c.id));
    const newClients = [...publisherClients];
    demoClients.forEach(demo => {
      if (!existingIds.has(demo.id)) {
        newClients.unshift(demo);
      }
    });
    setPublisherClients(newClients);
    localStorage.setItem('carthage_publisher_clients', JSON.stringify(newClients));

    // 2. SaaS Requests
    const demoRequests = [
      { id: 'demo-req-1', companyName: 'STE CARTHAGE IMPORT-EXPORT', packId: 'full', interval: 'yearly', price: 199, requestDate: '2026-06-24', status: 'pending', contactEmail: 'carthage@import.tn' },
      { id: 'demo-req-2', companyName: 'BIZERTE MARITIME & DOCKING', packId: 'custom', interval: 'monthly', price: 90, requestDate: '2026-06-24', status: 'pending', contactEmail: 'contact@bizerte-maritime.com', modules: ['steering', 'reports', 'cession', 'business_plan', 'juridique'] }
    ];
    let existingRequests: any[] = [];
    try {
      const saved = localStorage.getItem('carthage_licence_requests');
      if (saved) existingRequests = JSON.parse(saved);
    } catch (e) {}
    const existingReqIds = new Set(existingRequests.map((r: any) => r.id));
    demoRequests.forEach(req => {
      if (!existingReqIds.has(req.id)) {
        existingRequests.unshift(req);
      }
    });
    localStorage.setItem('carthage_licence_requests', JSON.stringify(existingRequests));

    // 3. SaaS Alerts
    const demoAlerts = [
      { id: 'demo-al-1', type: 'registration', message: 'Nouvelle demande d\'activation reçue de la part de : "STE CARTHAGE IMPORT-EXPORT" (Formule Elyssa Intégrale).', date: '2026-06-24 10:15' },
      { id: 'demo-al-2', type: 'registration', message: 'Inscription de compte d\'essai : "EL KEF AGRICOLE COOPERATIVE" (Formule Logistique & Distribution).', date: '2026-06-24 11:30' }
    ];
    let existingAlerts: any[] = [];
    try {
      const saved = localStorage.getItem('carthage_admin_alerts');
      if (saved) existingAlerts = JSON.parse(saved);
    } catch (e) {}
    const existingAlertIds = new Set(existingAlerts.map((a: any) => a.id));
    demoAlerts.forEach(alert => {
      if (!existingAlertIds.has(alert.id)) {
        existingAlerts.unshift(alert);
      }
    });
    localStorage.setItem('carthage_admin_alerts', JSON.stringify(existingAlerts));

    // 4. Demo Collabs
    const demoCollabs = [
      {
        id: 'collab_demo_carthage_owner',
        name: 'Dirigeant Carthage',
        email: 'carthage@import.tn',
        password: '123456',
        role: 'Manager' as const,
        status: 'Active',
        company: 'STE CARTHAGE IMPORT-EXPORT',
        assignedTasks: [],
        createdDate: '2026-06-24'
      },
      {
        id: 'collab_demo_kef_owner',
        name: 'Dirigeant El Kef',
        email: 'kef@agri.tn',
        password: '123456',
        role: 'Manager' as const,
        status: 'Active',
        company: 'EL KEF AGRICOLE COOPERATIVE',
        assignedTasks: [],
        createdDate: '2026-06-24'
      },
      {
        id: 'collab_demo_bizerte_owner',
        name: 'Dirigeant Bizerte',
        email: 'contact@bizerte-maritime.com',
        password: '123456',
        role: 'Manager' as const,
        status: 'Active',
        company: 'BIZERTE MARITIME & DOCKING',
        assignedTasks: [],
        createdDate: '2026-06-24'
      },
      {
        id: 'collab_demo_djerba_owner',
        name: 'Dirigeant Djerba',
        email: 'djerba@tourisme.tn',
        password: '123456',
        role: 'Manager' as const,
        status: 'Active',
        company: 'DJERBA RECEPTIFS TOURISME',
        assignedTasks: [],
        createdDate: '2026-06-24'
      }
    ];
    const existingCollabIds = new Set(collaborators.map(c => c.id));
    const newCollabs = [...collaborators];
    demoCollabs.forEach(collab => {
      if (!existingCollabIds.has(collab.id)) {
        newCollabs.unshift(collab as any);
      }
    });
    setCollaborators(newCollabs);
    localStorage.setItem('carthage_collaborators', JSON.stringify(newCollabs));

    // 5. Activate Simulation
    setIsSimulationActive(true);
    localStorage.setItem('carthage_demo_simulation_active', 'true');
  };

  const handleSuperAdminDeleteDemos = () => {
    // 1. SaaS clients
    const cleanedClients = publisherClients.filter(c => !c.id.startsWith('pc-demo-') && !['pc-1', 'pc-2', 'pc-3', 'pc-4', 'pc-5'].includes(c.id));
    setPublisherClients(cleanedClients);
    localStorage.setItem('carthage_publisher_clients', JSON.stringify(cleanedClients));

    // 2. SaaS Requests
    let existingRequests: any[] = [];
    try {
      const saved = localStorage.getItem('carthage_licence_requests');
      if (saved) existingRequests = JSON.parse(saved);
    } catch (e) {}
    const cleanedRequests = existingRequests.filter((r: any) => !r.id.startsWith('demo-') && r.id !== 'req_1');
    localStorage.setItem('carthage_licence_requests', JSON.stringify(cleanedRequests));

    // 3. SaaS Alerts
    let existingAlerts: any[] = [];
    try {
      const saved = localStorage.getItem('carthage_admin_alerts');
      if (saved) existingAlerts = JSON.parse(saved);
    } catch (e) {}
    const cleanedAlerts = existingAlerts.filter((a: any) => !a.id.startsWith('demo-'));
    localStorage.setItem('carthage_admin_alerts', JSON.stringify(cleanedAlerts));

    // 4. Collabs
    const cleanedCollabs = collaborators.filter(c => !c.id.startsWith('collab_demo_'));
    setCollaborators(cleanedCollabs);
    localStorage.setItem('carthage_collaborators', JSON.stringify(cleanedCollabs));

    // 5. Deactivate Simulation
    setIsSimulationActive(false);
    localStorage.setItem('carthage_demo_simulation_active', 'false');
  };

  const [isDemoDataLoading, setIsDemoDataLoading] = useState<boolean>(false);

  const loadCompanyDemoData = async () => {
    if (!activeCompanyName) return;
    setIsDemoDataLoading(true);
    try {
      // 1. Load SaaS publisher/presentational demos
      handleSuperAdminInsertDemos();

      // 2. Inject Hyper-Connected Scenario directly into Firestore subcollections & LocalStorage
      const seeded = await seedHyperConnectedDemoData(activeCompanyName);

      // 3. Call backend reload endpoint
      const response = await fetch('/api/db/load-demo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: activeCompanyName })
      });
      const result = await response.json();

      if (response.ok && result.success) {
        clearAppCache();
        const u = result.updatedData;
        if (u) {
          if (Array.isArray(u.clients)) setClients(u.clients);
          if (Array.isArray(u.complaints)) setComplaints(u.complaints);
          if (Array.isArray(u.invoices)) setInvoices(u.invoices);
          if (Array.isArray(u.visitReports)) setVisitReports(u.visitReports);
          if (Array.isArray(u.competitors)) setCompetitors(u.competitors);
          if (Array.isArray(u.suppliers)) setSuppliers(u.suppliers);
          if (Array.isArray(u.products)) setProducts(u.products);
          if (Array.isArray(u.stockMovements)) setStockMovements(u.stockMovements);
          if (Array.isArray(u.bankAccounts)) setBankAccounts(u.bankAccounts);
          if (Array.isArray(u.bankTransactions)) setBankTransactions(u.bankTransactions);
          if (Array.isArray(u.taxDeclarations)) setTaxDeclarations(u.taxDeclarations);
          if (Array.isArray(u.yearEndClosings)) setYearEndClosings(u.yearEndClosings);
          if (Array.isArray(u.employees)) setEmployees(u.employees);
          if (Array.isArray(u.contracts)) setContracts(u.contracts);
          if (Array.isArray(u.absences)) setAbsences(u.absences);
          if (Array.isArray(u.payslips)) setPayslips(u.payslips);
          if (Array.isArray(u.documents)) setDocuments(u.documents);
          if (Array.isArray(u.assets)) setAssets(u.assets);
          if (Array.isArray(u.cessionEntries)) setCessionEntries(u.cessionEntries);
          if (Array.isArray(u.nomenclatures)) setNomenclatures(u.nomenclatures);
          if (Array.isArray(u.manufacturingOrders)) setManufacturingOrders(u.manufacturingOrders);
          if (Array.isArray(u.purchaseRequisitions)) setPurchaseRequisitions(u.purchaseRequisitions);
          if (Array.isArray(u.purchaseOrders)) setPurchaseOrders(u.purchaseOrders);
          if (Array.isArray(u.supplierPerformance)) setSupplierPerformance(u.supplierPerformance);
          if (Array.isArray(u.importFolders)) setImportFolders(u.importFolders);
          if (Array.isArray(u.lcRequests)) setLcRequests(u.lcRequests);
          if (Array.isArray(u.vehicles)) setVehicles(u.vehicles);
          if (Array.isArray(u.missions)) setMissions(u.missions);
          if (Array.isArray(u.expenses)) setExpenses(u.expenses);
          if (Array.isArray(u.incidents)) setIncidents(u.incidents);
        }
      }

      // Ensure state has hyper-connected items even if backend data missing some
      if (seeded) {
        if (Array.isArray(seeded.employees)) {
          setEmployees(prev => {
            const existingIds = new Set(prev.map(e => e.id));
            const fresh = seeded.employees.filter(e => !existingIds.has(e.id));
            return [...fresh, ...prev];
          });
        }
        if (Array.isArray(seeded.invoices)) {
          setInvoices(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const fresh = seeded.invoices.filter(i => !existingIds.has(i.id));
            return [...fresh, ...prev];
          });
        }
        if (Array.isArray(seeded.fleetVehicles)) {
          setVehicles(prev => {
            const existingIds = new Set(prev.map((v: any) => v.id));
            const fresh = (seeded.fleetVehicles as any[]).filter(v => !existingIds.has(v.id));
            return [...fresh, ...prev];
          });
        }
        if (Array.isArray(seeded.incomingEmails)) {
          setIncomingEmails(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const fresh = seeded.incomingEmails.filter(m => !existingIds.has(m.id));
            return [...fresh, ...prev];
          });
        }
      }

      setIsSimulationActive(true);
      localStorage.setItem('carthage_demo_simulation_active', 'true');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('elyssa_demo_reloaded', { detail: { tenantId: activeCompanyName } }));
      }
    } catch (err) {
      console.error('Error during loadCompanyDemoData:', err);
    } finally {
      setIsDemoDataLoading(false);
    }
  };

  const purgeCompanyDemoData = async () => {
    if (!activeCompanyName) return;
    setIsDemoDataLoading(true);
    try {
      // Purge SaaS publisher/presentational demos too
      handleSuperAdminDeleteDemos();

      // Execute full tenant purge across all 27+ module sub-collections
      const report = await purgeTenantData(activeCompanyName);

      // Zero out React state for all business modules immediately
      setClients([]);
      setComplaints([]);
      setInvoices([]);
      setVisitReports([]);
      setCompetitors([]);
      setSuppliers([]);
      setProducts([]);
      setStockMovements([]);
      setBankAccounts([]);
      setBankTransactions([]);
      setTaxDeclarations([]);
      setYearEndClosings([]);
      setEmployees([]);
      setContracts([]);
      setAbsences([]);
      setPayslips([]);
      setDocuments([]);
      setAssets([]);
      setCessionEntries([]);
      setNomenclatures([]);
      setManufacturingOrders([]);
      setPurchaseRequisitions([]);
      setPurchaseOrders([]);
      setSupplierPerformance([]);
      setImportFolders([]);
      setLcRequests([]);
      setVehicles([]);
      setMissions([]);
      setExpenses([]);
      setIncidents([]);
      setCompanyLocations([]);

      clearDemoData();
      clearAppCache();
      setPurgeReport(report || {});
    } catch (err) {
      console.error('Error during purgeCompanyDemoData:', err);
    } finally {
      setIsDemoDataLoading(false);
    }
  };

  const ensureValidEmployee = (emp: any, index: number = 0): Employee => {
    const hash = Math.abs(String(emp?.id || emp?.name || index).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    const ssnNum = (14000000 + (hash * 83719) % 80000000).toString();
    const cinNum = (9000000 + (hash * 12345) % 90000000).toString();
    return {
      ...emp,
      id: emp?.id || `emp_${index}`,
      name: emp?.name || 'Collaborateur',
      email: emp?.email || '',
      phone: emp?.phone || '',
      role: emp?.role || 'Agent',
      jobTitle: emp?.jobTitle || emp?.role || 'Collaborateur',
      ssn: emp?.ssn || `${ssnNum.substring(0, 8)}-92`,
      cin: emp?.cin || cinNum.substring(0, 8),
      rib: emp?.rib || '03001010015920038472',
      baseSalary: typeof emp?.baseSalary === 'number' && !isNaN(emp.baseSalary) ? emp.baseSalary : 1800.000,
      transportAllowance: typeof emp?.transportAllowance === 'number' && !isNaN(emp.transportAllowance) ? emp.transportAllowance : 150.000,
      presenceAllowance: typeof emp?.presenceAllowance === 'number' && !isNaN(emp.presenceAllowance) ? emp.presenceAllowance : 80.000,
      otherAllowances: typeof emp?.otherAllowances === 'number' && !isNaN(emp.otherAllowances) ? emp.otherAllowances : 100.000,
      familySituation: emp?.familySituation || 'Single',
      isChefDeFamille: emp?.isChefDeFamille ?? false,
      status: emp?.status || 'Active',
      hiringDate: emp?.hiringDate || emp?.hireDate || '2024-01-15',
      hireDate: emp?.hireDate || emp?.hiringDate || '2024-01-15',
      department: emp?.department || 'Direction & Exploitation',
    };
  };

  // GED Electronic Documents State & Employees Sync for GED
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('carthage_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((e: any, idx: number) => ensureValidEmployee(e, idx));
        }
      } catch (e) { }
    }
    return [];
  });

  const [companyLocations, setCompanyLocations] = useState<any[]>(() => {
    const saved = localStorage.getItem('elyssa_company_locations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'loc-maman', name: 'Siège MAMAN (Connexion Mère)', lat: 36.8065, lng: 10.1815, radius: 150, isMaman: true },
      { id: 'loc-sfax', name: 'Succursale Sfax - Zone Industrielle Poudrière', lat: 34.7405, lng: 10.7603, radius: 150 },
      { id: 'loc-sousse', name: 'Agence Sousse - Boulevard 14 Janvier', lat: 35.8256, lng: 10.6369, radius: 150 }
    ];
  });

  const [documents, setDocuments] = useState<GedDocument[]>(() => {
    const saved = localStorage.getItem('carthage_documents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [contracts, setContracts] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_contracts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
  });

  const [absences, setAbsences] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_absences');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
  });

  const [payslips, setPayslips] = useState<any[]>(() => {
    const saved = localStorage.getItem('carthage_payslips');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
  });

  // Periodically refresh employees whenever activeTab switches to keep sync
  useEffect(() => {
    const savedEmp = localStorage.getItem('carthage_employees');
    if (savedEmp) {
      try { setEmployees(JSON.parse(savedEmp)); } catch (e) {}
    }
    const savedCt = localStorage.getItem('carthage_contracts');
    if (savedCt) {
      try { setContracts(JSON.parse(savedCt)); } catch (e) {}
    }
    const savedAb = localStorage.getItem('carthage_absences');
    if (savedAb) {
      try { setAbsences(JSON.parse(savedAb)); } catch (e) {}
    }
    const savedPs = localStorage.getItem('carthage_payslips');
    if (savedPs) {
      try { setPayslips(JSON.parse(savedPs)); } catch (e) {}
    }
    const savedLocs = localStorage.getItem('elyssa_company_locations');
    if (savedLocs) {
      try { setCompanyLocations(JSON.parse(savedLocs)); } catch (e) {}
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('elyssa_company_locations', JSON.stringify(companyLocations));
  }, [companyLocations]);

  // Bi-directional synchronization disabled to prevent resurrecting deleted collaborators/employees
  // Clean additions or deletions are handled directly by their respective UI action handlers.

  // Utility function to check if a specific module is empty
  const isModuleEmpty = (moduleKey: string): boolean => {
    switch (moduleKey) {
      case 'clients':
        return clients.length === 0;
      case 'complaints':
        return complaints.length === 0;
      case 'billing':
        return invoices.length === 0;
      case 'communication':
        return communicationLogs.length === 0;
      case 'stock':
        return stockMovements.length === 0 && products.length === 0;
      case 'market':
        return competitors.length === 0;
      case 'finance':
        return taxDeclarations.length === 0;
      case 'payroll':
        return payslips.length === 0;
      case 'ged':
        return documents.length === 0;
      case 'fleet': {
        const saved = localStorage.getItem('carthage_fleet_vehicles');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            return !Array.isArray(list) || list.length === 0;
          } catch (e) {}
        }
        return true;
      }
      case 'transit_logistique': {
        const saved = localStorage.getItem('carthage_import_folders');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            return !Array.isArray(list) || list.length === 0;
          } catch (e) {}
        }
        return true;
      }
      case 'lc_manager': {
        const saved = localStorage.getItem('carthage_lc_requests');
        if (saved) {
          try {
            const list = JSON.parse(saved);
            return !Array.isArray(list) || list.length === 0;
          } catch (e) {}
        }
        return true;
      }
      case 'purchasing':
        return purchaseOrders.length === 0 && purchaseRequisitions.length === 0;
      case 'production':
        return manufacturingOrders.length === 0 && nomenclatures.length === 0;
      case 'asset':
        return assets.length === 0;
      case 'treasury':
        return bankAccounts.length === 0 && bankTransactions.length === 0;
      default:
        return false;
    }
  };

  // Get French label for each module
  const getModuleLabel = (moduleKey: string): string => {
    switch (moduleKey) {
      case 'clients': return "CRM / Contacts Clients";
      case 'complaints': return "Réclamations Clients";
      case 'billing': return "Facturation & Règlements";
      case 'communication': return "Communication Multicanale";
      case 'stock': return "Mouvements de Stock & Articles";
      case 'market': return "Veille Concurrentielle";
      case 'finance': return "Déclarations Fiscales & IR";
      case 'payroll': return "Fiches de Paie & Absences";
      case 'ged': return "Documents Electroniques (GED)";
      case 'fleet': return "Parc Automobile & Flotte";
      case 'transit_logistique': return "Transit & Logistique Import";
      case 'lc_manager': return "Lettre de Crédit (Crédoc)";
      case 'purchasing': return "Gestion des Achats & Fournisseurs";
      case 'production': return "GPAO & Ordres de Production";
      case 'asset': return "Gestion des Immobilisations";
      case 'treasury': return "Trésorerie & Banque";
      default: return moduleKey;
    }
  };

  // Suggestions of loading demo data are disabled per user request
  useEffect(() => {
    setEmptyModuleToast(null);
  }, [activeTab]);

  // Import demo data for a specific module
  const importDemoDataForModule = (moduleKey: string) => {
    switch (moduleKey) {
      case 'clients': {
        const demoClientsMapped = INITIAL_CLIENTS.map(c => ({
          ...c,
          id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`,
          engagements: (c.engagements || []).map(e => ({
            ...e,
            id: e.id.startsWith('demo-') ? e.id : `demo-${e.id}`
          }))
        }));
        const demoVisitReportsMapped = INITIAL_VISIT_REPORTS.map(v => ({
          ...v,
          id: v.id.startsWith('demo-') ? v.id : `demo-${v.id}`,
          clientId: v.clientId.startsWith('demo-') ? v.clientId : `demo-${v.clientId}`
        }));
        setClients(demoClientsMapped);
        setVisitReports(demoVisitReportsMapped);
        localStorage.setItem('carthage_clients', JSON.stringify(demoClientsMapped));
        localStorage.setItem('carthage_visit_reports', JSON.stringify(demoVisitReportsMapped));
        break;
      }
      case 'complaints': {
        const demoComplaintsMapped = INITIAL_COMPLAINTS.map(c => ({
          ...c,
          id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`,
          clientId: c.clientId.startsWith('demo-') ? c.clientId : `demo-${c.clientId}`
        }));
        setComplaints(demoComplaintsMapped);
        localStorage.setItem('carthage_complaints', JSON.stringify(demoComplaintsMapped));
        break;
      }
      case 'billing': {
        const demoInvoicesMapped = INITIAL_INVOICES.map(i => ({
          ...i,
          id: i.id.startsWith('demo-') ? i.id : `demo-${i.id}`,
          clientId: i.clientId.startsWith('demo-') ? i.clientId : `demo-${i.clientId}`,
          recouvrementSteps: (i.recouvrementSteps || []).map(s => ({
            ...s,
            id: s.id.startsWith('demo-') ? s.id : `demo-${s.id}`
          }))
        }));
        setInvoices(demoInvoicesMapped);
        localStorage.setItem('carthage_invoices', JSON.stringify(demoInvoicesMapped));
        break;
      }
      case 'communication': {
        const demoLogs = INITIAL_COMMUNICATION_LOGS || [];
        setCommunicationLogs(demoLogs);
        localStorage.setItem('carthage_communication_logs', JSON.stringify(demoLogs));
        break;
      }
      case 'stock': {
        const demoProductsMapped = INITIAL_PRODUCTS.map(p => ({
          ...p,
          id: p.id.startsWith('demo-') ? p.id : `demo-${p.id}`
        }));
        const demoStockMovementsMapped = INITIAL_STOCK_MOVEMENTS.map(s => ({
          ...s,
          id: s.id.startsWith('demo-') ? s.id : `demo-${s.id}`,
          productId: s.productId.startsWith('demo-') ? s.productId : `demo-${s.productId}`
        }));
        setProducts(demoProductsMapped);
        setStockMovements(demoStockMovementsMapped);
        localStorage.setItem('carthage_products', JSON.stringify(demoProductsMapped));
        localStorage.setItem('carthage_stock_movements', JSON.stringify(demoStockMovementsMapped));
        break;
      }
      case 'market': {
        const demoCompetitorsMapped = INITIAL_COMPETITORS.map(c => ({
          ...c,
          id: c.id.startsWith('demo-') ? c.id : `demo-${c.id}`
        }));
        setCompetitors(demoCompetitorsMapped);
        localStorage.setItem('carthage_competitors', JSON.stringify(demoCompetitorsMapped));
        break;
      }
      case 'finance': {
        const demoTaxDeclarationsMapped = INITIAL_TAX_DECLARATIONS.map(t => ({
          ...t,
          id: t.id.startsWith('demo-') ? t.id : `demo-${t.id}`
        }));
        setTaxDeclarations(demoTaxDeclarationsMapped);
        localStorage.setItem('carthage_tax_declarations', JSON.stringify(demoTaxDeclarationsMapped));
        break;
      }
      case 'payroll': {
        const demoEmployees: Employee[] = [
          {
            id: 'demo-emp_1',
            name: 'Khaled Ben Amor (Démo)',
            email: 'k.benamor@carthage.com.tn',
            jobTitle: 'Directeur Financier & Recouvrement',
            ssn: '14839211-92',
            rib: '03001010015920038472',
            baseSalary: 2600.000,
            transportAllowance: 180.000,
            presenceAllowance: 80.000,
            otherAllowances: 300.000,
            familySituation: 'Married_2',
            isChefDeFamille: true,
            status: 'Active',
            hiringDate: '2023-01-15'
          },
          {
            id: 'demo-emp_2',
            name: 'Ines Dridi (Démo)',
            email: 'i.dridi@carthage.com.tn',
            jobTitle: 'Responsable Rapprochement',
            ssn: '20943810-18',
            rib: '08102030026710048259',
            baseSalary: 1750.000,
            transportAllowance: 120.000,
            presenceAllowance: 80.000,
            otherAllowances: 150.000,
            familySituation: 'Single',
            isChefDeFamille: false,
            status: 'Active',
            hiringDate: '2024-03-10'
          }
        ];
        const demoContractsList = [
          {
            id: 'demo-ct_1',
            employeeId: 'demo-emp_1',
            employeeName: 'Khaled Ben Amor (Démo)',
            contractType: 'CDI',
            startDate: '2023-01-15',
            trialPeriodMonths: 3,
            baseSalary: 2600.000,
            status: 'Signed',
            dutiesDescription: 'Superviser l\'ensemble des processus financiers, élaboration du budget annuel, pilotage de la trésorerie et reporting réglementaire auprès de la Banque Centrale de Tunisie.',
            generatedAt: '2023-01-15',
            signedAt: '2023-01-15'
          }
        ];
        const demoAbsencesList = [
          {
            id: 'demo-abs_1',
            employeeId: 'demo-emp_2',
            employeeName: 'Ines Dridi (Démo)',
            type: 'SickLeave',
            startDate: '2026-06-02',
            endDate: '2026-06-05',
            daysCount: 4,
            isDeductibleFromSalary: true,
            deductionAmount: 240.000,
            status: 'Approved',
            description: 'Grippe saisonnière sévère - Certificat médical transmis'
          }
        ];
        const demoPayslipsList = [
          {
            id: 'demo-ps_1_may',
            employeeId: 'demo-emp_1',
            employeeName: 'Khaled Ben Amor (Démo)',
            month: '2026-05',
            baseSalary: 2600.000,
            grossSalary: 3160.000,
            cnssEmployee: 290.088,
            cnssEmployer: 539.412,
            professionalExpenses: 166.667,
            familyDeduction: 41.667,
            taxableIncome: 2661.578,
            irpp: 582.345,
            css: 26.616,
            netSalary: 2260.951,
            allowancesPaid: 560.000,
            status: 'Paid',
            paymentMethod: 'Virement',
            bankAccountId: 'ba_1',
            paidDate: '2026-05-31'
          }
        ];
        setEmployees(demoEmployees);
        setContracts(demoContractsList);
        setAbsences(demoAbsencesList);
        setPayslips(demoPayslipsList);
        localStorage.setItem('carthage_employees', JSON.stringify(demoEmployees));
        localStorage.setItem('carthage_contracts', JSON.stringify(demoContractsList));
        localStorage.setItem('carthage_absences', JSON.stringify(demoAbsencesList));
        localStorage.setItem('carthage_payslips', JSON.stringify(demoPayslipsList));
        break;
      }
      case 'ged': {
        const demoDocs: GedDocument[] = [
          {
            id: "demo-doc_1",
            name: "Contrat_CDI_Khaled_Ben_Amor_Signed",
            type: "Contract",
            fileSize: "245 KB",
            fileType: "application/pdf",
            uploadDate: "2023-01-15",
            linkedToType: "Employee",
            linkedToId: "demo-emp_1",
            linkedToName: "Khaled Ben Amor (Démo)",
            description: "Contrat de travail permanent en qualité de Directeur Financier & Recouvrement.",
            version: 1,
            uploadedBy: "contact@elyssa.pro"
          }
        ];
        setDocuments(demoDocs);
        localStorage.setItem('carthage_documents', JSON.stringify(demoDocs));
        break;
      }
      case 'fleet': {
        const demoVehicles = DEFAULT_FLEET_VEHICLES;
        const demoMissions = DEFAULT_FLEET_MISSIONS;
        const demoExpenses = DEFAULT_FLEET_EXPENSES;
        const demoIncidents = [
          {
            id: 'demo-inc_1',
            date: '2026-06-08',
            vehicleId: 'demo-v_4',
            vehicleLabel: 'Renault Clio 5 (204 TUN 1542) (Démo)',
            employeeId: 'demo-emp_3',
            driverName: 'Mohamed Ali Gharbi (Démo)',
            description: 'Choc arrière mineur au rond-point Charguia II avec un véhicule tiers',
            safetyInquiry: 'Le chauffeur prétend avoir été surpris par le freinage brusque du tiers. Constat amiable rédigé.',
            sanctionsApplied: 'Avertissement verbal sérieux rappelé. Pas de responsabilité pécuniaire directe retenue.',
            severity: 'Medium',
            status: 'Resolved'
          }
        ];
        setVehicles(demoVehicles as any);
        setMissions(demoMissions as any);
        setExpenses(demoExpenses as any);
        setIncidents(demoIncidents as any);
        localStorage.setItem('carthage_fleet_vehicles', JSON.stringify(demoVehicles));
        localStorage.setItem('carthage_fleet_missions', JSON.stringify(demoMissions));
        localStorage.setItem('carthage_fleet_expenses', JSON.stringify(demoExpenses));
        localStorage.setItem('carthage_fleet_incidents', JSON.stringify(demoIncidents));
        localStorage.setItem('carthage_demo_simulation_active', 'true');
        setIsSimulationActive(true);

        const payload = {
          clients,
          complaints,
          invoices,
          visitReports,
          competitors,
          suppliers,
          products,
          stockMovements,
          smtpSettings,
          imapSettings,
          incomingEmails,
          emailTemplates,
          communicationLogs,
          bankAccounts,
          bankTransactions,
          taxDeclarations,
          yearEndClosings,
          documents,
          employees,
          contracts,
          absences,
          payslips,
          assets,
          cessionEntries,
          nomenclatures,
          manufacturingOrders,
          purchaseRequisitions,
          purchaseOrders,
          supplierPerformance,
          importFolders,
          lcRequests,
          vehicles: demoVehicles,
          missions: demoMissions,
          expenses: demoExpenses,
          incidents: demoIncidents,
          fuelBons: demoExpenses,
          interventions: demoMissions,
          insurances: demoIncidents,
          lastUpdated: Date.now()
        };
        if (activeCompanyName) {
          fetch('/api/db/company-data', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ company: activeCompanyName, data: payload })
          }).catch(err => console.warn(err));
        }
        break;
      }
      case 'transit_logistique': {
        const demoFolders = DEFAULT_IMPORT_FOLDERS;
        const demoLc = DEFAULT_LC_REQUESTS;
        setImportFolders(demoFolders as any);
        setLcRequests(demoLc as any);
        localStorage.setItem('carthage_import_folders', JSON.stringify(demoFolders));
        localStorage.setItem('carthage_lc_requests', JSON.stringify(demoLc));
        localStorage.setItem('carthage_demo_simulation_active', 'true');
        setIsSimulationActive(true);

        const payload = {
          clients,
          complaints,
          invoices,
          visitReports,
          competitors,
          suppliers,
          products,
          stockMovements,
          smtpSettings,
          imapSettings,
          incomingEmails,
          emailTemplates,
          communicationLogs,
          bankAccounts,
          bankTransactions,
          taxDeclarations,
          yearEndClosings,
          documents,
          employees,
          contracts,
          absences,
          payslips,
          assets,
          cessionEntries,
          nomenclatures,
          manufacturingOrders,
          purchaseRequisitions,
          purchaseOrders,
          supplierPerformance,
          importFolders: demoFolders,
          lcRequests: demoLc,
          vehicles,
          missions,
          expenses,
          incidents,
          fuelBons: expenses,
          interventions: missions,
          insurances: incidents,
          lastUpdated: Date.now()
        };
        if (activeCompanyName) {
          fetch('/api/db/company-data', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ company: activeCompanyName, data: payload })
          }).catch(err => console.warn(err));
        }
        break;
      }
      case 'lc_manager': {
        const demoFolders = DEFAULT_IMPORT_FOLDERS;
        const demoLc = DEFAULT_LC_REQUESTS;
        setImportFolders(demoFolders as any);
        setLcRequests(demoLc as any);
        localStorage.setItem('carthage_import_folders', JSON.stringify(demoFolders));
        localStorage.setItem('carthage_lc_requests', JSON.stringify(demoLc));
        localStorage.setItem('carthage_demo_simulation_active', 'true');
        setIsSimulationActive(true);

        const payload = {
          clients,
          complaints,
          invoices,
          visitReports,
          competitors,
          suppliers,
          products,
          stockMovements,
          smtpSettings,
          imapSettings,
          incomingEmails,
          emailTemplates,
          communicationLogs,
          bankAccounts,
          bankTransactions,
          taxDeclarations,
          yearEndClosings,
          documents,
          employees,
          contracts,
          absences,
          payslips,
          assets,
          cessionEntries,
          nomenclatures,
          manufacturingOrders,
          purchaseRequisitions,
          purchaseOrders,
          supplierPerformance,
          importFolders,
          lcRequests: demoLc,
          vehicles,
          missions,
          expenses,
          incidents,
          fuelBons: expenses,
          interventions: missions,
          insurances: incidents,
          lastUpdated: Date.now()
        };
        if (activeCompanyName) {
          fetch('/api/db/company-data', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ company: activeCompanyName, data: payload })
          }).catch(err => console.warn(err));
        }
        break;
      }
      case 'purchasing': {
        const demoRequisitions = [
          { id: 'demo-req_1', title: 'Achat de 5 tonnes de carton ondulé', requester: 'Sami Mansour (Démo)', department: 'Logistique', estimatedCost: 15000, priority: 'High', status: 'Approved', creationDate: '2026-06-10' }
        ];
        const demoOrders = [
          { id: 'demo-po_1', requisitionId: 'demo-req_1', supplierName: 'SOPAL Tunisie', orderDate: '2026-06-12', totalAmount: 14800, status: 'Sent', paymentTerms: '60 jours fin de mois' }
        ];
        const demoPerformance = [
          { id: 'demo-perf_1', supplierId: 'demo-sup_1', name: 'SOPAL Tunisie', category: 'Plomberie & Chauffage', score: 92, delayRate: 5, nonConformityRate: 2 }
        ];
        setPurchaseRequisitions(demoRequisitions);
        setPurchaseOrders(demoOrders);
        setSupplierPerformance(demoPerformance);
        localStorage.setItem('carthage_purchasing_requisitions', JSON.stringify(demoRequisitions));
        localStorage.setItem('carthage_purchasing_orders', JSON.stringify(demoOrders));
        localStorage.setItem('carthage_purchasing_suppliers_performance', JSON.stringify(demoPerformance));
        break;
      }
      case 'production': {
        const demoNomenclatures = [
          { id: 'demo-nom_1', productName: 'Table de bureau premium', version: 'v1.0', componentsCount: 5, status: 'Approved', lastUpdated: '2026-05-20' }
        ];
        const demoMO = [
          { id: 'demo-mo_1', nomenclatureId: 'demo-nom_1', productName: 'Table de bureau premium', quantity: 50, startDate: '2026-06-15', dueDate: '2026-07-15', status: 'InProgress', supervisor: 'Khaled Ben Amor (Démo)' }
        ];
        setNomenclatures(demoNomenclatures);
        setManufacturingOrders(demoMO);
        localStorage.setItem('carthage_production_nomenclatures', JSON.stringify(demoNomenclatures));
        localStorage.setItem('carthage_production_manufacturing_orders', JSON.stringify(demoMO));
        break;
      }
      case 'asset': {
        const demoAssets = [
          { id: 'demo-ast_1', code: 'IM-2026-001', name: 'Serveur de données Dell PowerEdge', category: 'MaterielInformatique', acquisitionDate: '2026-01-15', acquisitionValue: 8500, status: 'Active', residualValue: 6800 }
        ];
        setAssets(demoAssets);
        localStorage.setItem('carthage_assets_immobilisations', JSON.stringify(demoAssets));
        break;
      }
      case 'treasury': {
        const demoAccounts = [
          { id: 'demo-ba_1', bankName: 'BIAT', accountNumber: '03001010015920038472', accountType: 'Courant', balance: 145250.620, currency: 'TND' }
        ];
        const demoTxs = [
          { id: 'demo-tx_1', accountId: 'demo-ba_1', date: '2026-06-01', amount: 12500, type: 'In', category: 'Vente', description: 'Virement client Poulina Group Holding', status: 'Cleared', method: 'Virement', reference: 'AV-10043' }
        ];
        setBankAccounts(demoAccounts as any);
        setBankTransactions(demoTxs as any);
        localStorage.setItem('carthage_bank_accounts', JSON.stringify(demoAccounts));
        localStorage.setItem('carthage_bank_transactions', JSON.stringify(demoTxs));
        break;
      }
      default:
        break;
    }
  };

  // Dynamic empty tab suggestion notifications are disabled per user request
  useEffect(() => {
    setEmptyModuleToast(null);
  }, [activeTab]);

  // Synchronize company locations and employees list to public attendance_settings in Firestore
  useEffect(() => {
    const handleLocationsUpdated = () => {
      const savedLocs = localStorage.getItem('elyssa_company_locations');
      if (savedLocs) {
        try {
          const parsed = JSON.parse(savedLocs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCompanyLocations(parsed);
          }
        } catch (e) {}
      }
    };

    window.addEventListener('elyssa_locations_updated', handleLocationsUpdated);
    window.addEventListener('storage', handleLocationsUpdated);
    return () => {
      window.removeEventListener('elyssa_locations_updated', handleLocationsUpdated);
      window.removeEventListener('storage', handleLocationsUpdated);
    };
  }, []);

  useEffect(() => {
    if (!activeCompanyName || isCompanyDataLoading) return;
    
    const syncAttendanceSettings = async () => {
      try {
        const docId = activeCompanyName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const docRef = doc(db, 'attendance_settings', docId);
        
        // Load existing qrConfig & companyLocations to avoid overwriting calibrated GPS coordinates
        let qrConfig = {
          companyName: activeCompanyName,
          regenTime: '05:00',
          currentToken: 'ELY-QR-INITIAL',
          lastRegenDate: ''
        };
        let effectiveCompanyLocations = companyLocations;

        const savedLocs = localStorage.getItem('elyssa_company_locations');
        if (savedLocs) {
          try {
            const parsed = JSON.parse(savedLocs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              effectiveCompanyLocations = parsed;
            }
          } catch (e) {}
        }

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const existingData = docSnap.data();
          if (existingData.qrConfig) {
            qrConfig = existingData.qrConfig;
          }
          if (existingData.companyLocations && Array.isArray(existingData.companyLocations) && existingData.companyLocations.length > 0) {
            effectiveCompanyLocations = existingData.companyLocations;
          }
        }

        await setDoc(docRef, {
          companyLocations: effectiveCompanyLocations,
          qrConfig,
          employees: employees.map(e => ({
            id: e.id,
            name: e.name,
            jobTitle: e.jobTitle,
            status: e.status || 'Active',
            branchId: e.branchId || 'loc-maman'
          })),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("☁️ Global synchronizer: companyLocations and employees list synced to public attendance_settings in Firestore.");
      } catch (err) {
        console.error("Error in global attendance sync:", err);
      }
    };

    const timeoutId = setTimeout(syncAttendanceSettings, 3000);
    return () => clearTimeout(timeoutId);
  }, [activeCompanyName, companyLocations, employees, isCompanyDataLoading]);

  // Load Company ERP Data from server / Firebase when activeCompanyName changes
  useEffect(() => {
    if (!activeCompanyName) return;

    const loadCompanyData = async () => {
      setIsCompanyDataLoading(true);
      setClients([]);
      setComplaints([]);
      setInvoices([]);
      setVisitReports([]);
      setCompetitors([]);
      setSuppliers([]);
      setProducts([]);
      setStockMovements([]);
      setIncomingEmails([]);
      setCommunicationLogs([]);
      setBankAccounts([]);
      setBankTransactions([]);
      setTaxDeclarations([]);
      setYearEndClosings([]);
      setDocuments([]);
      setEmployees([]);
      setContracts([]);
      setAbsences([]);
      setPayslips([]);
      setAssets([]);
      setCessionEntries([]);
      setNomenclatures([]);
      setManufacturingOrders([]);
      setPurchaseRequisitions([]);
      setPurchaseOrders([]);
      setSupplierPerformance([]);
      setImportFolders([]);
      setLcRequests([]);
      setVehicles([]);
      setMissions([]);
      setExpenses([]);
      setIncidents([]);

      let freshClients = publisherClients;
      try {
        // Force refreshing of the license status from Firestore at every company/page load
        const clientsRes = await fetchWithRetry('/api/db/publisher-clients', {
          headers: getAuthHeaders()
        });
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          if (Array.isArray(clientsData)) {
            freshClients = clientsData;
            setPublisherClients(clientsData);
            localStorage.setItem('carthage_publisher_clients', JSON.stringify(clientsData));
          }
        }
      } catch (err) {
        console.warn('Error forcing license status refresh from Firestore:', err);
      }

      try {
        // Execute systematic direct GET query on Firestore via useFetchData hook
        await runDirectFirestoreFetch(
          async (resData) => {
            if (resData && !resData.empty) {
              if (Array.isArray(resData.clients)) setClients(resData.clients);
                if (Array.isArray(resData.complaints)) setComplaints(resData.complaints);
                if (Array.isArray(resData.invoices)) setInvoices(resData.invoices);
                if (Array.isArray(resData.visitReports)) setVisitReports(resData.visitReports);
                if (Array.isArray(resData.competitors)) setCompetitors(resData.competitors);
                if (Array.isArray(resData.suppliers)) setSuppliers(resData.suppliers);
                if (Array.isArray(resData.products)) setProducts(resData.products);
                if (Array.isArray(resData.stockMovements)) setStockMovements(resData.stockMovements);
                if (resData.smtpSettings) setSmtpSettings(resData.smtpSettings);
                if (resData.imapSettings) setImapSettings(resData.imapSettings);
                if (Array.isArray(resData.incomingEmails)) setIncomingEmails(resData.incomingEmails);
                if (Array.isArray(resData.emailTemplates)) setEmailTemplates(resData.emailTemplates);
                if (Array.isArray(resData.communicationLogs)) setCommunicationLogs(resData.communicationLogs);
                if (Array.isArray(resData.bankAccounts)) setBankAccounts(resData.bankAccounts);
                if (Array.isArray(resData.bankTransactions)) setBankTransactions(resData.bankTransactions);
                if (Array.isArray(resData.taxDeclarations)) setTaxDeclarations(resData.taxDeclarations);
                if (Array.isArray(resData.yearEndClosings)) setYearEndClosings(resData.yearEndClosings);
                if (Array.isArray(resData.documents)) setDocuments(resData.documents);
                if (Array.isArray(resData.employees)) setEmployees(resData.employees);
                if (Array.isArray(resData.contracts)) setContracts(resData.contracts);
                if (Array.isArray(resData.absences)) setAbsences(resData.absences);
                if (Array.isArray(resData.payslips)) setPayslips(resData.payslips);
                if (Array.isArray(resData.assets)) setAssets(resData.assets);
                if (Array.isArray(resData.cessionEntries)) setCessionEntries(resData.cessionEntries);
                if (Array.isArray(resData.nomenclatures)) setNomenclatures(resData.nomenclatures);
                if (Array.isArray(resData.manufacturingOrders)) setManufacturingOrders(resData.manufacturingOrders);
                if (Array.isArray(resData.purchaseRequisitions)) setPurchaseRequisitions(resData.purchaseRequisitions);
                if (Array.isArray(resData.purchaseOrders)) setPurchaseOrders(resData.purchaseOrders);
                if (Array.isArray(resData.supplierPerformance)) setSupplierPerformance(resData.supplierPerformance);
                if (Array.isArray(resData.importFolders)) setImportFolders(resData.importFolders);
                if (Array.isArray(resData.lcRequests)) setLcRequests(resData.lcRequests);
                if (Array.isArray(resData.vehicles)) setVehicles(resData.vehicles);
                if (Array.isArray(resData.missions)) setMissions(resData.missions);
                if (Array.isArray(resData.expenses)) setExpenses(resData.expenses);
                if (Array.isArray(resData.incidents)) setIncidents(resData.incidents);
              } else {
                const clientRecord = freshClients.find(c => c && (c.id === activeCompanyName || c.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()));
                const companyLower = activeCompanyName.toLowerCase();
                const isDemoOrTrialPattern = companyLower.includes('carthage') || 
                                              companyLower.includes('kef') || 
                                              companyLower.includes('bizerte') || 
                                              companyLower.includes('djerba') || 
                                              companyLower.includes('demo') || 
                                              companyLower.includes('affaires') || 
                                              companyLower.includes('elyssa') ||
                                              companyLower.includes('sfe') ||
                                              companyLower.includes('sfax') ||
                                              companyLower.includes('sahel') ||
                                              companyLower.includes('gts') ||
                                              companyLower.includes('dos-') ||
                                              !!accountantClientContext?.isAccountantMode;
                const isCustomPackActive = clientRecord?.pack === 'CUSTOM' || clientRecord?.pack === 'full' || clientRecord?.status === 'active' || companyLower === 'gep';
                const isTrialClient = !isCustomPackActive && ((clientRecord?.status === 'trial') || isSimulationActive || isDemoCompany || isDemoOrTrialPattern);
                const hasDemoLoaded = !!resData.hasLoadedTrialDemo;

                if (isTrialClient || hasDemoLoaded) {
                  if (!resData.hasLoadedTrialDemo && isTrialClient) {
                    console.log("[Trial Auto-load] Loading all demo data for trial company:", activeCompanyName);
                    const demoPayload = getCompleteDemoPayload(activeCompanyName);
                    setClients(demoPayload.clients);
                    setComplaints(demoPayload.complaints);
                    setInvoices(demoPayload.invoices);
                    setVisitReports(demoPayload.visitReports);
                    setCompetitors(demoPayload.competitors);
                    setSuppliers(demoPayload.suppliers);
                    setProducts(demoPayload.products);
                    setStockMovements(demoPayload.stockMovements);
                    setSmtpSettings(demoPayload.smtpSettings);
                    setImapSettings(demoPayload.imapSettings);
                    setIncomingEmails(demoPayload.incomingEmails);
                    setEmailTemplates(demoPayload.emailTemplates);
                    setCommunicationLogs(demoPayload.communicationLogs);
                    setBankAccounts((demoPayload.bankAccounts as any));
                    setBankTransactions((demoPayload.bankTransactions as any));
                    setTaxDeclarations(demoPayload.taxDeclarations);
                    setYearEndClosings(demoPayload.yearEndClosings);
                    setDocuments((demoPayload.documents as any));
                    setEmployees(demoPayload.employees);
                    setContracts(demoPayload.contracts);
                    setAbsences(demoPayload.absences);
                    setPayslips(demoPayload.payslips);
                    setAssets(demoPayload.assets);
                    setCessionEntries(demoPayload.cessionEntries);
                    setNomenclatures(demoPayload.nomenclatures);
                    setManufacturingOrders(demoPayload.manufacturingOrders);
                    setPurchaseRequisitions(demoPayload.purchaseRequisitions);
                    setPurchaseOrders(demoPayload.purchaseOrders);
                    setSupplierPerformance(demoPayload.supplierPerformance);
                    setImportFolders((demoPayload.importFolders as any) || []);
                    setLcRequests((demoPayload.lcRequests as any) || []);
                    setVehicles((demoPayload.vehicles as any) || []);
                    setMissions((demoPayload.missions as any) || []);
                    setExpenses((demoPayload.expenses as any) || []);
                    setIncidents((demoPayload.incidents as any) || []);

                    await fetch('/api/db/company-data', {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({
                        company: activeCompanyName,
                        data: demoPayload
                      })
                    });
                  } else {
                    setClients(resData.clients || []);
                    setComplaints(resData.complaints || []);
                    setInvoices(resData.invoices || []);
                    setVisitReports(resData.visitReports || []);
                    setCompetitors(resData.competitors || []);
                    setSuppliers(resData.suppliers || []);
                    setProducts(resData.products || []);
                    setStockMovements(resData.stockMovements || []);
                    if (resData.smtpSettings) setSmtpSettings(resData.smtpSettings);
                    if (resData.imapSettings) setImapSettings(resData.imapSettings);
                    setIncomingEmails(resData.incomingEmails || []);
                    if (Array.isArray(resData.emailTemplates)) {
                      const companyTemplates = resData.emailTemplates.map((t: any) => ({
                        ...t,
                        subject: t.subject ? t.subject.replace(/Elyssa Entreprises S\.A\./g, activeCompanyName) : "",
                        body: t.body ? t.body.replace(/Elyssa Entreprises S\.A\./g, activeCompanyName) : ""
                      }));
                      setEmailTemplates(companyTemplates);
                    } else {
                      setEmailTemplates([]);
                    }
                    setCommunicationLogs(resData.communicationLogs || []);
                    setBankAccounts(resData.bankAccounts || []);
                    setBankTransactions(resData.bankTransactions || []);
                    setTaxDeclarations(resData.taxDeclarations || []);
                    setYearEndClosings(resData.yearEndClosings || []);
                    setDocuments(resData.documents || []);
                    setEmployees(resData.employees || []);
                    setContracts(resData.contracts || []);
                    setAbsences(resData.absences || []);
                    setPayslips(resData.payslips || []);
                    setAssets(resData.assets || []);
                    setCessionEntries(resData.cessionEntries || []);
                    setNomenclatures(resData.nomenclatures || []);
                    setManufacturingOrders(resData.manufacturingOrders || []);
                    setPurchaseRequisitions(resData.purchaseRequisitions || []);
                    setPurchaseOrders(resData.purchaseOrders || []);
                    setSupplierPerformance(resData.supplierPerformance || []);
                    setImportFolders(resData.importFolders || []);
                    setLcRequests(resData.lcRequests || []);
                    setVehicles(resData.vehicles || []);
                    setMissions(resData.missions || []);
                    setExpenses(resData.expenses || []);
                    setIncidents(resData.incidents || []);
                  }
                } else {
                  // Self-cleaning filter to wipe any leaked demo elements from real tenant records
                  const cleanClients = Array.isArray(resData.clients) ? resData.clients.filter((c: any) => !c.id?.startsWith('demo-') && c.id !== 'cli_1' && c.id !== 'cli_2' && c.id !== 'cli_3' && c.id !== 'cli_4' && c.name !== 'Poulina Group Holding') : [];
                  const cleanInvoices = Array.isArray(resData.invoices) ? resData.invoices.filter((i: any) => !i.id?.startsWith('demo-') && i.id !== 'inv_1' && i.id !== 'inv_2' && i.id !== 'inv_3' && i.id !== 'inv_4' && i.id !== 'inv_5') : [];
                  const cleanComplaints = Array.isArray(resData.complaints) ? resData.complaints.filter((c: any) => !c.id?.startsWith('demo-') && c.id !== 'rec_1' && c.id !== 'rec_2' && c.id !== 'rec_3') : [];
                  const cleanVisitReports = Array.isArray(resData.visitReports) ? resData.visitReports.filter((v: any) => !v.id?.startsWith('demo-') && v.id !== 'vis_1' && v.id !== 'vis_2') : [];
                  const cleanCompetitors = Array.isArray(resData.competitors) ? resData.competitors.filter((c: any) => !c.id?.startsWith('demo-') && c.id !== 'comp_1' && c.id !== 'comp_2') : [];
                  const cleanSuppliers = Array.isArray(resData.suppliers) ? resData.suppliers.filter((s: any) => !s.id?.startsWith('demo-') && s.id !== 'sup_1' && s.id !== 'sup_2' && s.id !== 'sup_3') : [];
                  const cleanProducts = Array.isArray(resData.products) ? resData.products.filter((p: any) => !p.id?.startsWith('demo-') && p.id !== 'prod_1' && p.id !== 'prod_2' && p.id !== 'prod_3' && p.id !== 'prod_4') : [];
                  const cleanStockMovements = Array.isArray(resData.stockMovements) ? resData.stockMovements.filter((s: any) => !s.id?.startsWith('demo-') && s.id !== 'mov_1' && s.id !== 'mov_2' && s.id !== 'mov_3' && s.id !== 'mov_4') : [];
                  const cleanIncomingEmails = Array.isArray(resData.incomingEmails) ? resData.incomingEmails.filter((m: any) => !m.id?.startsWith('demo-') && m.id !== 'mail-001' && m.id !== 'mail-002' && m.id !== 'mail-003' && m.id !== 'mail-004' && m.id !== 'mail-005') : [];
                  const cleanCommunicationLogs = Array.isArray(resData.communicationLogs) ? resData.communicationLogs.filter((l: any) => !l.id?.startsWith('demo-')) : [];
                  const cleanBankAccounts = Array.isArray(resData.bankAccounts) ? resData.bankAccounts.filter((b: any) => !b.id?.startsWith('demo-') && b.id !== 'bank_biat' && b.id !== 'bank_attijari' && b.id !== 'bank_uib_savings' && b.id !== 'bank_caisse_cash') : [];
                  const cleanBankTransactions = Array.isArray(resData.bankTransactions) ? resData.bankTransactions.filter((t: any) => !t.id?.startsWith('demo-') && !/^tx_\d{3}$/.test(t.id || '')) : [];
                  const cleanTaxDeclarations = Array.isArray(resData.taxDeclarations) ? resData.taxDeclarations.filter((t: any) => !t.id?.startsWith('demo-')) : [];
                  const cleanYearEndClosings = Array.isArray(resData.yearEndClosings) ? resData.yearEndClosings.filter((y: any) => !y.id?.startsWith('demo-')) : [];
                  const cleanDocuments = Array.isArray(resData.documents) ? resData.documents.filter((d: any) => !d.id?.startsWith('demo-') && d.id !== 'doc_init_1' && d.id !== 'doc_init_2') : [];
                  const cleanEmployees = Array.isArray(resData.employees) ? resData.employees.filter((e: any) => !e.id?.startsWith('demo-') && e.id !== 'emp_1' && e.id !== 'emp_2' && e.id !== 'emp_3') : [];
                  const cleanContracts = Array.isArray(resData.contracts) ? resData.contracts.filter((c: any) => !c.id?.startsWith('demo-') && c.id !== 'ct_1' && c.id !== 'ct_2' && c.id !== 'ct_3') : [];
                  const cleanAbsences = Array.isArray(resData.absences) ? resData.absences.filter((a: any) => !a.id?.startsWith('demo-')) : [];
                  const cleanPayslips = Array.isArray(resData.payslips) ? resData.payslips.filter((p: any) => !p.id?.startsWith('demo-')) : [];
                  const cleanAssets = Array.isArray(resData.assets) ? resData.assets.filter((a: any) => !a.id?.startsWith('demo-')) : [];
                  const cleanCessionEntries = Array.isArray(resData.cessionEntries) ? resData.cessionEntries.filter((c: any) => !c.id?.startsWith('demo-')) : [];
                  const cleanNomenclatures = Array.isArray(resData.nomenclatures) ? resData.nomenclatures.filter((n: any) => !n.id?.startsWith('demo-')) : [];
                  const cleanManufacturingOrders = Array.isArray(resData.manufacturingOrders) ? resData.manufacturingOrders.filter((m: any) => !m.id?.startsWith('demo-')) : [];
                  const cleanPurchaseRequisitions = Array.isArray(resData.purchaseRequisitions) ? resData.purchaseRequisitions.filter((r: any) => !r.id?.startsWith('demo-')) : [];
                  const cleanPurchaseOrders = Array.isArray(resData.purchaseOrders) ? resData.purchaseOrders.filter((o: any) => !o.id?.startsWith('demo-')) : [];
                  const cleanSupplierPerformance = Array.isArray(resData.supplierPerformance) ? resData.supplierPerformance.filter((s: any) => !s.id?.startsWith('demo-')) : [];
                  const cleanImportFolders = Array.isArray(resData.importFolders) ? resData.importFolders.filter((f: any) => !f.id?.startsWith('demo-')) : [];
                  const cleanLcRequests = Array.isArray(resData.lcRequests) ? resData.lcRequests.filter((l: any) => !l.id?.startsWith('demo-')) : [];
                  const cleanVehicles = Array.isArray(resData.vehicles) ? resData.vehicles.filter((v: any) => !v.id?.startsWith('demo-')) : [];
                  const cleanMissions = Array.isArray(resData.missions) ? resData.missions.filter((m: any) => !m.id?.startsWith('demo-')) : [];
                  const cleanExpenses = Array.isArray(resData.expenses) ? resData.expenses.filter((e: any) => !e.id?.startsWith('demo-')) : [];
                  const cleanIncidents = Array.isArray(resData.incidents) ? resData.incidents.filter((i: any) => !i.id?.startsWith('demo-')) : [];

                  setClients(cleanClients);
                  setComplaints(cleanComplaints);
                  setInvoices(cleanInvoices);
                  setVisitReports(cleanVisitReports);
                  setCompetitors(cleanCompetitors);
                  setSuppliers(cleanSuppliers);
                  setProducts(cleanProducts);
                  setStockMovements(cleanStockMovements);
                  if (resData.smtpSettings) setSmtpSettings(resData.smtpSettings);
                  if (resData.imapSettings) setImapSettings(resData.imapSettings);
                  setIncomingEmails(cleanIncomingEmails);
                  if (Array.isArray(resData.emailTemplates)) {
                    const companyTemplates = resData.emailTemplates.map((t: any) => ({
                      ...t,
                      subject: t.subject ? t.subject.replace(/Elyssa Entreprises S\.A\./g, activeCompanyName) : "",
                      body: t.body ? t.body.replace(/Elyssa Entreprises S\.A\./g, activeCompanyName) : ""
                    }));
                    setEmailTemplates(companyTemplates);
                  }
                  setCommunicationLogs(cleanCommunicationLogs);
                  setBankAccounts(cleanBankAccounts);
                  setBankTransactions(cleanBankTransactions);
                  setTaxDeclarations(cleanTaxDeclarations);
                  setYearEndClosings(cleanYearEndClosings);
                  setDocuments(cleanDocuments);
                  setEmployees(cleanEmployees);
                  setContracts(cleanContracts);
                  setAbsences(cleanAbsences);
                  setPayslips(cleanPayslips);
                  setAssets(cleanAssets);
                  setCessionEntries(cleanCessionEntries);
                  setNomenclatures(cleanNomenclatures);
                  setManufacturingOrders(cleanManufacturingOrders);
                  setPurchaseRequisitions(cleanPurchaseRequisitions);
                  setPurchaseOrders(cleanPurchaseOrders);
                  setSupplierPerformance(cleanSupplierPerformance);
                  setImportFolders(cleanImportFolders);
                  setLcRequests(cleanLcRequests);
                  setVehicles(cleanVehicles);
                  setMissions(cleanMissions);
                  setExpenses(cleanExpenses);
                  setIncidents(cleanIncidents);
                }
              }
          },
          (collabsData) => {
            if (Array.isArray(collabsData)) {
              const seen = new Set<string>();
              const unique = collabsData.filter((c: any) => {
                if (!c || !c.id || seen.has(c.id)) return false;
                seen.add(c.id);
                return true;
              });
              setCollaborators(unique);
            }
          }
        );
      } catch (error) {
        console.error('Error syncing company-data from/to server:', error);
      } finally {
        setIsCompanyDataLoading(false);
      }
    };

    loadCompanyData();
  }, [activeCompanyName, runDirectFirestoreFetch]);

  // Ensure Director General (MED ZIED BEN MILED) is always registered as an employee for parent company
  useEffect(() => {
    if (!activeCompanyName || isCompanyDataLoading) return;
    if (activeCompanyName === 'Inter-Affaires' || activeCompanyName === 'Elyssa Entreprises S.A.') {
      setEmployees(prev => {
        const ziedEmployee: Employee = {
          id: 'collab_carthage_1',
          name: 'MED ZIED BEN MILED',
          email: 'contact@elyssa.pro',
          jobTitle: 'Directeur Général',
          ssn: '12345678-90',
          rib: '03001010015920038472',
          baseSalary: 10000.000,
          transportAllowance: 500.000,
          presenceAllowance: 80.000,
          otherAllowances: 1000.000,
          familySituation: 'Married_2',
          isChefDeFamille: true,
          status: 'Active',
          hiringDate: '2026-06-22',
          matricule: 'DG-001'
        };

        const hasZied = prev.some(e => e.id === 'collab_carthage_1' || e.email?.toLowerCase() === 'contact@elyssa.pro');
        const list = hasZied ? prev : [ziedEmployee, ...prev];
        
        // Deduplicate list by id
        const seen = new Set<string>();
        return list.filter(e => {
          if (!e || !e.id || seen.has(e.id)) return false;
          seen.add(e.id);
          return true;
        });
      });
    }
  }, [activeCompanyName, isCompanyDataLoading]);

  // Synchronize company ERP data dynamically with debounce to Firebase/Firestore
  useEffect(() => {
    if (!activeCompanyName) return;
    if (isCompanyDataLoading) return;

    // Protection against auto-save during license transition countdown
    if (localStorage.getItem('elyssa_sync_blocked') === 'true') {
      console.log("[Sync] Auto-save skipped: Sync is blocked because an activation transition is in progress.");
      return;
    }

    const syncTimeout = setTimeout(async () => {
      try {
        const payload = {
          clients,
          complaints,
          invoices,
          visitReports,
          competitors,
          suppliers,
          products,
          stockMovements,
          smtpSettings,
          imapSettings,
          incomingEmails,
          emailTemplates,
          communicationLogs,
          bankAccounts,
          bankTransactions,
          taxDeclarations,
          yearEndClosings,
          documents,
          employees,
          contracts,
          absences,
          payslips,
          assets,
          cessionEntries,
          nomenclatures,
          manufacturingOrders,
          purchaseRequisitions,
          purchaseOrders,
          supplierPerformance,
          importFolders,
          lcRequests,
          vehicles,
          missions,
          expenses,
          incidents,
          fuelBons: expenses,
          interventions: missions,
          insurances: incidents,
          lastUpdated: Date.now()
        };

        await fetch('/api/db/company-data', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            company: activeCompanyName,
            data: payload
          })
        });
      } catch (err) {
        console.warn("Firebase Sync skipped or deferred (transient background condition):", err);
      }
    }, 4000); // Debounce of 4 seconds

    return () => clearTimeout(syncTimeout);
  }, [
    activeCompanyName, isCompanyDataLoading, clients, complaints, invoices, visitReports, competitors, suppliers,
    products, stockMovements, smtpSettings, imapSettings, incomingEmails, emailTemplates, communicationLogs,
    bankAccounts, bankTransactions, taxDeclarations, yearEndClosings, documents, employees, contracts, absences, payslips,
    assets, cessionEntries, nomenclatures, manufacturingOrders, purchaseRequisitions, purchaseOrders, supplierPerformance,
    importFolders, lcRequests, vehicles, missions, expenses, incidents
  ]);

  useEffect(() => {
    localStorage.setItem('carthage_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('carthage_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('carthage_absences', JSON.stringify(absences));
  }, [absences]);

  useEffect(() => {
    localStorage.setItem('carthage_payslips', JSON.stringify(payslips));
  }, [payslips]);

  // Keep LocalStorage synchronized on changes
  useEffect(() => {
    localStorage.setItem('carthage_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('carthage_bank_transactions', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  useEffect(() => {
    localStorage.setItem('carthage_tax_declarations', JSON.stringify(taxDeclarations));
  }, [taxDeclarations]);

  useEffect(() => {
    localStorage.setItem('carthage_year_end_closings', JSON.stringify(yearEndClosings));
  }, [yearEndClosings]);

  useEffect(() => {
    localStorage.setItem('carthage_admin_settings', JSON.stringify(adminSettings));
  }, [adminSettings]);

  useEffect(() => {
    localStorage.setItem('carthage_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('carthage_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('carthage_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('carthage_visit_reports', JSON.stringify(visitReports));
  }, [visitReports]);

  useEffect(() => {
    localStorage.setItem('carthage_competitors', JSON.stringify(competitors));
  }, [competitors]);

  useEffect(() => {
    localStorage.setItem('carthage_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('carthage_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('carthage_stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem('carthage_smtp_settings', JSON.stringify(smtpSettings));
  }, [smtpSettings]);

  useEffect(() => {
    localStorage.setItem('carthage_imap_settings', JSON.stringify(imapSettings));
  }, [imapSettings]);

  useEffect(() => {
    localStorage.setItem('carthage_incoming_emails', JSON.stringify(incomingEmails));
  }, [incomingEmails]);

  useEffect(() => {
    localStorage.setItem('carthage_email_templates', JSON.stringify(emailTemplates));
  }, [emailTemplates]);

  useEffect(() => {
    localStorage.setItem('carthage_communication_logs', JSON.stringify(communicationLogs));
  }, [communicationLogs]);

  useEffect(() => {
    localStorage.setItem('carthage_assets_immobilisations', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('carthage_cession_entries', JSON.stringify(cessionEntries));
  }, [cessionEntries]);

  useEffect(() => {
    localStorage.setItem('carthage_production_nomenclatures', JSON.stringify(nomenclatures));
  }, [nomenclatures]);

  useEffect(() => {
    localStorage.setItem('carthage_production_manufacturing_orders', JSON.stringify(manufacturingOrders));
  }, [manufacturingOrders]);

  useEffect(() => {
    localStorage.setItem('carthage_purchasing_requisitions', JSON.stringify(purchaseRequisitions));
  }, [purchaseRequisitions]);

  useEffect(() => {
    localStorage.setItem('carthage_purchasing_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('carthage_purchasing_suppliers_performance', JSON.stringify(supplierPerformance));
  }, [supplierPerformance]);

  useEffect(() => {
    localStorage.setItem('carthage_import_folders', JSON.stringify(importFolders));
  }, [importFolders]);

  useEffect(() => {
    localStorage.setItem('carthage_lc_requests', JSON.stringify(lcRequests));
  }, [lcRequests]);

  useEffect(() => {
    localStorage.setItem('carthage_fleet_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('carthage_fleet_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem('carthage_fleet_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('carthage_fleet_incidents', JSON.stringify(incidents));
  }, [incidents]);

  // Sauvegarde automatique toutes les 5 minutes des données critiques
  useEffect(() => {
    const runAutosave = async () => {
      try {
        localStorage.setItem('carthage_clients', JSON.stringify(clients));
        localStorage.setItem('carthage_complaints', JSON.stringify(complaints));
        localStorage.setItem('carthage_invoices', JSON.stringify(invoices));
        localStorage.setItem('carthage_visit_reports', JSON.stringify(visitReports));
        localStorage.setItem('carthage_competitors', JSON.stringify(competitors));
        localStorage.setItem('carthage_suppliers', JSON.stringify(suppliers));
        localStorage.setItem('carthage_products', JSON.stringify(products));
        localStorage.setItem('carthage_stock_movements', JSON.stringify(stockMovements));
        localStorage.setItem('carthage_smtp_settings', JSON.stringify(smtpSettings));
        localStorage.setItem('carthage_imap_settings', JSON.stringify(imapSettings));
        localStorage.setItem('carthage_incoming_emails', JSON.stringify(incomingEmails));
        localStorage.setItem('carthage_email_templates', JSON.stringify(emailTemplates));
        localStorage.setItem('carthage_communication_logs', JSON.stringify(communicationLogs));
        localStorage.setItem('carthage_bank_accounts', JSON.stringify(bankAccounts));
        localStorage.setItem('carthage_bank_transactions', JSON.stringify(bankTransactions));
        localStorage.setItem('carthage_tax_declarations', JSON.stringify(taxDeclarations));
        localStorage.setItem('carthage_year_end_closings', JSON.stringify(yearEndClosings));
        localStorage.setItem('carthage_documents', JSON.stringify(documents));
        localStorage.setItem('carthage_employees', JSON.stringify(employees));

        if (activeCompanyName && !isCompanyDataLoading) {
          const payload = {
            clients,
            complaints,
            invoices,
            visitReports,
            competitors,
            suppliers,
            products,
            stockMovements,
            smtpSettings,
            imapSettings,
            incomingEmails,
            emailTemplates,
            communicationLogs,
            bankAccounts,
            bankTransactions,
            taxDeclarations,
            yearEndClosings,
            documents,
            employees,
            contracts,
            absences,
            payslips,
            assets,
            cessionEntries,
            nomenclatures,
            manufacturingOrders,
            purchaseRequisitions,
            purchaseOrders,
            supplierPerformance,
            importFolders,
            lcRequests,
            vehicles,
            missions,
            expenses,
            incidents,
            fuelBons: expenses,
            interventions: missions,
            insurances: incidents,
            lastUpdated: Date.now()
          };

          await fetch('/api/db/company-data', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              company: activeCompanyName,
              data: payload
            })
          });
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setAutoSaveToast({ show: true, timestamp: timeStr });
        
        setTimeout(() => {
          setAutoSaveToast(null);
        }, 4000);
      } catch (err) {
        console.warn("Autosave skipped or deferred (transient background condition):", err);
      }
    };

    // Toutes les 5 minutes (300 000 ms)
    const intervalId = setInterval(runAutosave, 300000);

    return () => clearInterval(intervalId);
  }, [
    activeCompanyName, isCompanyDataLoading, clients, complaints, invoices, visitReports, competitors, suppliers, 
    products, stockMovements, smtpSettings, imapSettings, incomingEmails, emailTemplates, communicationLogs, 
    bankAccounts, bankTransactions, taxDeclarations, yearEndClosings, documents, employees, contracts, absences, payslips,
    assets, cessionEntries, nomenclatures, manufacturingOrders, purchaseRequisitions, purchaseOrders, supplierPerformance,
    importFolders, lcRequests, vehicles, missions, expenses, incidents
  ]);

  // Démonstration initiale pour tester le bon fonctionnement de l'Autosave (4 secondes après le démarrage)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setAutoSaveToast({ show: true, timestamp: timeStr });
        setTimeout(() => {
          setAutoSaveToast(null);
        }, 4000);
      } catch (err) {
        console.warn("Demo Autosave skipped or deferred:", err);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Bulk importer helper from administrator backup console
  const handleBulkImport = (importedData: any) => {
    if (importedData.clients) setClients(importedData.clients);
    if (importedData.complaints) setComplaints(importedData.complaints);
    if (importedData.invoices) setInvoices(importedData.invoices);
    if (importedData.visitReports) setVisitReports(importedData.visitReports);
    if (importedData.competitors) setCompetitors(importedData.competitors);
    if (importedData.suppliers) setSuppliers(importedData.suppliers);
    if (importedData.products) setProducts(importedData.products);
    if (importedData.stockMovements) setStockMovements(importedData.stockMovements);
    if (importedData.bankAccounts) setBankAccounts(importedData.bankAccounts);
    if (importedData.bankTransactions) setBankTransactions(importedData.bankTransactions);
    if (importedData.taxDeclarations) setTaxDeclarations(importedData.taxDeclarations);
    if (importedData.yearEndClosings) setYearEndClosings(importedData.yearEndClosings);
  };

  // Nav menu dimensions config themed sections
  const menuSections = [
    {
      title: 'PILOTAGE & PERFORMANCE',
      items: [
        { id: 'dashboard', label: 'Console Launchpad Grid', icon: <Grid className="w-4 h-4 text-indigo-400" /> },
        { id: 'executive_dashboard', label: 'Tableau de Bord Décisionnel', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
        { id: 'copilot', label: 'AI Copilot & BI', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
        { id: 'steering', label: 'Objectifs & Pilotage', icon: <Target className="w-4 h-4" /> },
        { id: 'business_plan', label: 'Business Plan Stratégique', icon: <TrendingUp className="w-4 h-4 text-orange-400" /> },
        { id: 'market', label: 'Études & Opportunités', icon: <Target className="w-4 h-4" /> },
      ]
    },
    {
      title: 'ACTIVITÉ COMMERCIALE & CRM',
      items: [
        { id: 'caisse', label: 'Caisse Intelligente (POS)', icon: <Calculator className="w-4 h-4" /> },
        { id: 'billing', label: 'Facturation & Recouvrement', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'clients', label: 'Fiches Clients', icon: <Users className="w-4 h-4" /> },
        { id: 'portail_client', label: 'Portail Client Extérieur', icon: <Users className="w-4 h-4 text-cyan-400" /> },
        { id: 'reports', label: 'Rapports Terrain & Hebdo', icon: <FileText className="w-4 h-4" /> },
        { id: 'communication', label: 'Hub de Communication', icon: <Mail className="w-4 h-4" /> },
        { id: 'complaints', label: 'Suivi Réclamations', icon: <AlertTriangle className="w-4 h-4" /> },
      ]
    },
    {
      title: 'RESSOURCES HUMAINES & TERRAIN',
      items: [
        { id: 'payroll', label: 'Gestion Paie & RH', icon: <Users className="w-4 h-4" /> },
        { id: 'performance_contracts', label: 'Contrats d\'Objectifs & Performance', icon: <Award className="w-4 h-4 text-rose-400" /> },
        { id: 'collaborators', label: 'Gestion des Collaborateurs', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'attendance', label: 'Pointage & Temps de Travail', icon: <Clock className="w-4 h-4 text-emerald-500" /> },
        { id: 'mobile_terrain', label: 'Flotte Mobile & Suivi Terrain', icon: <Smartphone className="w-4 h-4 text-sky-400" /> },
      ]
    },
    {
      title: 'LOGISTIQUE, ACHATS & STOCK',
      items: [
        { id: 'stock', label: 'Stocks & Fournisseurs', icon: <Package className="w-4 h-4" /> },
        { id: 'purchasing', label: 'Gestion des Achats & Appro.', icon: <ShoppingCart className="w-4 h-4 text-emerald-500" /> },
        { id: 'warehouse_picking', label: 'Gestion des Préparations & Dépôts', icon: <Boxes className="w-4 h-4 text-amber-400" /> },
        { id: 'dispatch_tours', label: 'Expéditions & Tournées', icon: <Truck className="w-4 h-4 text-sky-400" /> },
        { id: 'production', label: 'Production & GPAO (TRS)', icon: <Cog className="w-4 h-4 text-sky-500" /> },
        { id: 'transit_logistique', label: 'Import/Export & Logistique', icon: <Globe className="w-4 h-4" /> },
        { id: 'lc_manager', label: 'Lettre de Crédit (Crédoc)', icon: <Building className="w-4 h-4 text-indigo-400" /> },
      ]
    },
    {
      title: 'FINANCE & COMPTABILITÉ',
      items: [
        { id: 'finance', label: 'Comptabilité & Trésorerie', icon: <Calculator className="w-4 h-4" /> },
        { id: 'tej', label: 'Intégration TEJ (CIMF)', icon: <Send className="w-4 h-4" /> },
        { id: 'accountant_portal', label: 'Espace Expert-Comptable & Cabinet', icon: <Scale className="w-4 h-4 text-emerald-400" /> },
        { id: 'treasury', label: 'Trésorerie & Portefeuille d\'Effets', icon: <Briefcase className="w-4 h-4 text-indigo-400" /> },
        { id: 'asset', label: 'Immobilisations & Amortissements', icon: <Building className="w-4 h-4 text-amber-500" /> },
        { id: 'investment', label: 'Bourse & Investissements', icon: <TrendingUp className="w-4 h-4" /> },
      ]
    },
    {
      title: 'PARC, MATÉRIEL & CONTRÔLE',
      items: [
        { id: 'fleet_management', label: 'Gestion du Parc & Actifs', icon: <Boxes className="w-4 h-4 text-amber-400" /> },
        { id: 'fleet', label: 'Gestion Parc Auto', icon: <Car className="w-4 h-4" /> },
        { id: 'ged', label: 'ED-GED & Pièces Justificatives', icon: <FileText className="w-4 h-4" /> },
        { id: 'cession', label: 'Cession d\'Entreprise', icon: <ArrowRightLeft className="w-4 h-4 text-amber-500" /> },
        { id: 'juridique', label: 'Secrétariat Juridique', icon: <Scale className="w-4 h-4 text-blue-400" /> },
        { id: 'saas_config', label: 'Espace Client & Packs', icon: <CreditCard className="w-4 h-4 text-emerald-650" /> },
        { id: 'company_settings', label: 'Paramètres de l\'Entreprise', icon: <Settings className="w-4 h-4" /> },
        { id: 'admin', label: 'Console d\'Administration & SecOps', icon: <ShieldAlert className="w-4 h-4" /> },
      ]
    }
  ];

  const isRoleAuthorized = (tabId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SuperAdmin') return true;

    // Find the logged-in user in our collaborators list
    const coll = collaborators.find(c => c.email.toLowerCase() === currentUser.email.toLowerCase());
    
    if (coll) {
      if (coll.role === 'Manager') {
        // Manager can see everything EXCEPT 'admin' (Console d'Administration & SecOps)
        return tabId !== 'admin';
      }
      if (coll.role === 'Director') {
        // Director can see dashboard, executive_dashboard, collaborators (to add agents), and assigned modules
        if (['dashboard', 'executive_dashboard', 'collaborators', 'mobile_terrain'].includes(tabId)) return true;
        return coll.assignedModules ? coll.assignedModules.includes(tabId) : false;
      }
      // For other collaborators (Agent, Viewer, etc.), authorize based on assignedModules if defined
      if (coll.assignedModules) {
        return coll.assignedModules.includes(tabId);
      }
    }

    if (currentUser.role === 'Manager') {
      // Manager can see everything EXCEPT 'admin' (Console d'Administration & SecOps)
      return tabId !== 'admin';
    }
    if (currentUser.role === 'Director') {
      // Direct session fallback
      return ['dashboard', 'executive_dashboard', 'collaborators', 'cession', 'tej', 'accountant_portal', 'attendance', 'business_plan', 'juridique', 'portail_client', 'mobile_terrain'].includes(tabId);
    }
    if (currentUser.role === 'Agent') {
      return ['dashboard', 'executive_dashboard', 'steering', 'business_plan', 'portail_client', 'juridique', 'reports', 'caisse', 'clients', 'complaints', 'stock', 'fleet', 'billing', 'finance', 'payroll', 'ged', 'investment', 'market', 'collaborators', 'attendance', 'company_settings', 'transit_logistique', 'lc_manager', 'cession', 'production', 'purchasing', 'asset', 'treasury', 'tej', 'accountant_portal', 'mobile_terrain'].includes(tabId);
    }
    if (currentUser.role === 'Viewer') {
      return ['dashboard', 'executive_dashboard', 'business_plan', 'portail_client', 'juridique', 'reports', 'caisse', 'clients', 'complaints', 'stock', 'fleet', 'finance', 'payroll', 'ged', 'investment', 'collaborators', 'attendance', 'company_settings', 'transit_logistique', 'lc_manager', 'cession', 'production', 'purchasing', 'asset', 'treasury', 'tej', 'accountant_portal', 'mobile_terrain'].includes(tabId);
    }
    return false;
  };

  const isAuthorized = (tabId: string): boolean => {
    if (!isRoleAuthorized(tabId)) return false;

    // Strict compartmentalization by checking company license access
    return checkAccess(tabId, activeCompanyName);
  };

  const parseDateSafe = (dateStr: any): Date => {
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed month
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  };

  const trialState = useMemo(() => {
    const clientRecord = publisherClients.find(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
    if (clientRecord) {
      const licenseStatus = clientRecord.license_status || (clientRecord.status === 'trial' ? 'trial' : 'paid');
      if (licenseStatus === 'paid') {
        return { isTrial: false, isExpired: false, daysLeft: 0, diffDays: 0 };
      }
    }
    if (clientRecord && clientRecord.status === 'trial') {
      const joinedDateStr = clientRecord.joinedDate || new Date().toISOString().split('T')[0];
      const joinedDate = parseDateSafe(joinedDateStr);
      const today = new Date();
      
      // Calculate difference in complete calendar days to avoid timezone/hour bias
      const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const d2 = new Date(joinedDate.getFullYear(), joinedDate.getMonth(), joinedDate.getDate());
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const daysLeft = Math.max(0, trialDurationDays - (isNaN(diffDays) ? 0 : diffDays));
      const isExpired = !isNaN(diffDays) && diffDays > trialDurationDays;
      return { isTrial: true, isExpired, daysLeft, diffDays: isNaN(diffDays) ? 0 : diffDays };
    }
    return { isTrial: false, isExpired: false, daysLeft: 0, diffDays: 0 };
  }, [activeCompanyName, publisherClients, trialDurationDays]);

  // Live ticking trial timer effect
  useEffect(() => {
    const updateCountdown = () => {
      const clientRecord = publisherClients.find(c => c?.companyName?.toLowerCase() === activeCompanyName?.toLowerCase());
      if (clientRecord) {
        const licenseStatus = clientRecord.license_status || (clientRecord.status === 'trial' ? 'trial' : 'paid');
        if (licenseStatus === 'paid') {
          setTrialTimeLeftStr('');
          return;
        }
      }
      if (clientRecord && clientRecord.status === 'trial') {
        const joinedDateStr = clientRecord.joinedDate || new Date().toISOString().split('T')[0];
        const joinedDate = parseDateSafe(joinedDateStr);
        // Expiry is trialDurationDays days of 24h
        const expiryTime = joinedDate.getTime() + (trialDurationDays * 24 * 60 * 60 * 1000);
        const now = Date.now();
        const diffMs = expiryTime - now;
        
        const isOverrideExpired = localStorage.getItem('carthage_trial_expired_override') === 'true';
        if (diffMs <= 0 || isOverrideExpired) {
          setTrialTimeLeftStr('Expiré 🛑');
        } else {
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          
          setTrialTimeLeftStr(`${days}j ${hours}h ${minutes}m ${seconds}s`);
        }
      } else {
        setTrialTimeLeftStr('');
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeCompanyName, publisherClients, trialDurationDays]);

  const isCurrentlyTrialBlocked = useMemo(() => {
    if (!currentUser) return false;
    // SuperAdmin is never trial-blocked
    if (currentUser.role === 'SuperAdmin') return false;

    // Check if SaaS Config simulated expired override is toggled on (J+8 simulation)
    const isOverrideExpired = localStorage.getItem('carthage_trial_expired_override') === 'true';
    
    // If the simulation is on and the active company is indeed a trial, show the expired view.
    // This allows testers to see the gorgeous expired trial block for any active trial site.
    if (isOverrideExpired && trialState.isTrial) {
      return true;
    }

    if (trialState.isTrial) {
      return trialState.isExpired;
    }

    return false;
  }, [currentUser, trialState]);

  // Determine currentPack for the active company
  const currentPack = useMemo(() => {
    if (currentUser?.role === 'SuperAdmin' && superAdminOverride) {
      return 'industrial'; // Full unlock for presentation
    }
    const client = publisherClients.find(c => c && (c.id === activeCompanyName || c.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()));
    if (!client) {
      if (activeCompanyName?.toLowerCase() === 'elyssa entreprises s.a.') {
        return 'industrial';
      }
      return 'standard';
    }
    const licenseStatus = client.license_status || (client.status === 'trial' ? 'trial' : 'paid');
    if (licenseStatus === 'trial') {
      return 'trial';
    }
    return client.packId || 'standard';
  }, [activeCompanyName, publisherClients, currentUser, superAdminOverride]);

  const allowedMenuSections = useMemo(() => {
    return menuSections.map(section => {
      const items = section.items
        .filter(item => {
          // MUST be role authorized
          return isRoleAuthorized(item.id);
        })
        .filter(item => {
          // Core modules are always allowed
          if (['admin', 'saas_config', 'company_settings', 'tej', 'copilot'].includes(item.id)) {
            return true;
          }
          
          // If hideLockedModules is true, we ONLY show modules that the company has actually purchased/unlocked!
          if (hideLockedModules) {
            return checkAccess(item.id, activeCompanyName);
          }
          
          // If hideLockedModules is false, we show all role-authorized modules!
          return true;
        });
      return { ...section, items };
    }).filter(section => section.items.length > 0);
  }, [menuSections, currentUser, activeCompanyName, publisherClients, superAdminOverride, purchasedModules, hideLockedModules, collaborators]);

  const navItems = allowedMenuSections.flatMap(section => section.items);

  // Route Guard: si le rôle utilisateur n'est pas autorisé pour ce module, rediriger vers le dashboard
  useEffect(() => {
    if (activeTab) {
      const isRoleAllowed = isRoleAuthorized(activeTab);
      
      if (!isRoleAllowed) {
        // Redirection logic: try to find the first module they can access according to role
        let fallbackTab = 'dashboard';
        const isDashboardAllowed = isRoleAuthorized('dashboard');
        
        if (!isDashboardAllowed) {
          let firstAllowedTab: string | null = null;
          for (const section of allowedMenuSections) {
            for (const item of section.items) {
              if (isRoleAuthorized(item.id)) {
                firstAllowedTab = item.id;
                break;
              }
            }
            if (firstAllowedTab) break;
          }
          if (firstAllowedTab) {
            fallbackTab = firstAllowedTab;
          }
        }
        
        if (activeTab !== fallbackTab) {
          console.warn(`🔒 Accès rôle refusé au module ${activeTab}. Redirection vers ${fallbackTab}.`);
          setActiveTab(fallbackTab);
          
          // Clean up url parameter
          const url = new URL(window.location.href);
          url.searchParams.set('tab', fallbackTab);
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [activeTab, allowedMenuSections, activeCompanyName, publisherClients, currentUser, superAdminOverride, hideLockedModules]);

  // Standalone Mobile PWA Route
  if (window.location.pathname === '/pocket-attendance' || window.location.pathname.startsWith('/pocket-attendance/')) {
    return <PocketAttendanceView />;
  }

  // Standalone Expert-Comptable Portal Route
  if (window.location.pathname === '/espace-expert-comptable' || window.location.pathname.startsWith('/espace-expert-comptable/')) {
    return (
      <AccountantPortal
        onBackToLanding={() => {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        onSwitchCompany={(companyName, tenantId, mf) => {
          handleSwitchToAccountantClient(companyName, tenantId, mf);
          window.history.pushState({}, '', '/?tab=finance');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.history.pushState({}, '', `/?tab=${tab}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
      />
    );
  }

  // Secure redirection gate for unauthenticated users
  if (!currentUser) {
    if (showLogin) {
      return (
        <LoginPage 
          collaborators={collaborators} 
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => setShowLogin(false)}
        />
      );
    }
    return (
      <LandingPage 
        onNavigateToLogin={() => setShowLogin(true)} 
        customPacks={finalCustomPacks}
        onTrialSignup={handleTrialSignup}
        trialDurationDays={trialDurationDays}
        adminSettings={adminSettings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      
      {/* Mode Expert-Comptable Banner Header */}
      {accountantClientContext?.isAccountantMode && (
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white px-6 py-2.5 flex items-center justify-between shadow-md border-b border-amber-700/50 z-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/20 rounded-lg border border-amber-400/30">
              <FolderKey className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wide text-amber-200 uppercase">Mode Expert-Comptable</span>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>📂 Consultation Cabinet sur le dossier :</span>
                <span className="bg-amber-500/30 text-amber-100 px-2 py-0.5 rounded-md font-extrabold border border-amber-400/40">{accountantClientContext.clientName}</span>
                <span className="text-amber-200/80 text-[11px] font-mono">(MF: {accountantClientContext.mf})</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAccountantMode}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-sm shadow-amber-500/30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>⬅️ Retour au Portail Cabinet</span>
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <header className="bg-white border-b border-slate-150 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setIsSidebarOpen(prev => !prev);
              setMobileMenuOpen(prev => !prev);
            }} 
            className="p-1.5 px-3 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center gap-2 transition-all cursor-pointer font-extrabold text-xs text-indigo-700 bg-indigo-50/40 shadow-2xs"
            title="Afficher / Masquer le menu latéral"
          >
            {mobileMenuOpen || isSidebarOpen ? <X className="w-4 h-4 text-indigo-600" /> : <Menu className="w-4 h-4 text-indigo-600" />}
            <span className="font-bold">Menu</span>
          </button>
          {activeCompanySettings.companyLogo ? (
            <img 
              src={activeCompanySettings.companyLogo} 
              alt="Logo" 
              className="w-8 h-8 object-contain rounded-lg border border-slate-200" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <ElyssaLogo className="w-8 h-8 rounded-lg" />
          )}
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight font-display bg-gradient-to-r from-indigo-700 to-slate-900 bg-clip-text text-transparent flex items-center gap-2">
              {currentUser?.role === 'SuperAdmin' ? (
                <select
                  value={activeCompanyName}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setActiveCompanyName(nextVal);
                    localStorage.setItem('carthage_active_company_simulated', nextVal);
                  }}
                  className="text-xs font-black text-indigo-750 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-xl cursor-pointer focus:outline-none transition-all font-sans"
                  title="Sélecteur d'entreprise pour l'administration globale Elyssa ERP"
                >
                  <option value="Inter-Affaires">🏢 Inter-Affaires (Parent)</option>
                  {publisherClients.map((client: any) => (
                    <option key={client.id || client.companyName} value={client.companyName}>
                      🏢 {client.companyName} ({client.status === 'trial' ? 'Essai' : 'Actif'})
                    </option>
                  ))}
                </select>
              ) : (
                <span>{activeCompanySettings.companyName || 'Elyssa Entreprises'}</span>
              )}
              {trialState.isTrial && (
                <span className={`text-[8.5px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
                  trialState.isExpired 
                    ? 'bg-red-50 text-red-650 border-red-200' 
                    : 'bg-emerald-50 text-emerald-650 border-emerald-200 shadow-3xs'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${trialState.isExpired ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                  {trialState.isExpired ? "ESSAI EXPIRÉ 🛑" : `ESSAI : ${trialTimeLeftStr || (trialState.daysLeft + 'j')}`}
                </span>
              )}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Console d'Exploitation Commerciale SaaS</p>
          </div>
        </div>

        {/* Global Right Badges */}
        <div className="flex items-center space-x-4">
          <button
            onClick={copilot.toggleChat}
            className={`p-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
              copilot.isChatOpen
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                : 'bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200 text-purple-700 shadow-3xs'
            }`}
            title="Ouvrir Elyssa AI Copilot & Analyste BI (Raccourci: Ctrl+K)"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-600 animate-pulse" />
            <span className="hidden md:inline">Copilot IA</span>
            <span className="md:hidden">IA</span>
          </button>

          {isPlatformAdmin && (
            <button
              onClick={() => setActiveTab('saas_config')}
              className={`p-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                activeTab === 'saas_config'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 animate-pulse'
              }`}
              title="Accéder à la Console d'Exploitation SaaS (Packs, Licences, Commandes)"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Hub SaaS</span>
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 p-1.5 px-3 rounded-full text-[11px] font-bold text-slate-650 font-mono">
            <span>Devise:</span>
            <strong className="text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">{activeCompanySettings.currency || 'TND'}</strong>
          </div>

          <div className="flex items-center space-x-3 border-l border-slate-100 pl-4">
            <div className="text-left text-xs leading-tight">
              <div className="flex items-center gap-1.5 leading-none mb-0.5">
                <span className="font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[200px] block" title={activeCompanySettings.companyName || activeCompanyName || "Inter-Affaires"}>
                  {activeCompanySettings.companyName || activeCompanyName || "Inter-Affaires"}
                </span>
                <span className={`text-[8px] tracking-wider uppercase font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                  currentUser?.role === 'SuperAdmin' ? 'bg-red-50 text-red-700 border border-red-150' :
                  currentUser?.role === 'Manager' ? 'bg-indigo-50 text-indigo-750 border border-indigo-150' :
                  currentUser?.role === 'Agent' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                  'bg-slate-100 text-slate-600 border border-slate-150'
                }`}>
                  {currentUser?.role === 'SuperAdmin' ? 'Super Admin' : currentUser?.role}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono leading-none truncate max-w-[150px] sm:max-w-[250px]" title={currentUser?.email}>
                {currentUser?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-red-650 text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1 cursor-pointer ml-1"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Framework Layout Container */}
      <div className="flex flex-1 relative">
        
        {/* Left Side menu for Desktop view */}
        {isSidebarOpen && (
          <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col border-r border-slate-800 shrink-0 sticky top-16 h-[calc(100vh-64px)] p-4 justify-between overflow-y-auto print:hidden transition-all duration-200 z-30">
          <div className="space-y-5">
            {currentUser?.role === 'SuperAdmin' && (
              <div className="space-y-2 shrink-0 bg-slate-950/70 border border-red-900/40 p-3 rounded-2xl">
                <span className="block text-[9px] font-extrabold uppercase tracking-widest text-red-500 px-1 flex items-center gap-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Console Présentation
                </span>
                
                <div className="flex items-center justify-between p-1.5 bg-slate-900/50 rounded-xl border border-slate-850">
                  <span className="text-[10px] font-bold text-slate-300 font-sans">Tous les modules</span>
                  <button
                    onClick={() => {
                      const nextVal = !superAdminOverride;
                      setSuperAdminOverride(nextVal);
                      localStorage.setItem('elyssa_superadmin_all_unlocked', nextVal ? 'true' : 'false');
                    }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all duration-200 font-sans ${
                      superAdminOverride
                        ? 'bg-red-950/40 border-red-500 text-red-400 hover:bg-red-900/20'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={superAdminOverride ? "Désactiver pour tester les verrous/paywalls" : "Activer pour débloquer les 23 modules"}
                  >
                    {superAdminOverride ? 'ACTIFS 🔓' : 'RESTAURER 🔒'}
                  </button>
                </div>

                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={loadCompanyDemoData}
                    className={`flex-1 text-center py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 border border-transparent font-sans ${
                      isDemoDataLoading
                        ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                        : 'bg-emerald-650 hover:bg-emerald-600 text-white shadow-xs'
                    }`}
                    disabled={isDemoDataLoading}
                    title="Charger toutes les données de démonstration de manière isolée et sécurisée"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isDemoDataLoading ? 'Chargement...' : 'Charger Démos'}</span>
                  </button>
                  <button
                    onClick={purgeCompanyDemoData}
                    className={`flex-1 text-center py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 border border-transparent font-sans ${
                      isDemoDataLoading
                        ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                        : 'bg-red-650 hover:bg-red-600 text-white shadow-xs'
                    }`}
                    disabled={isDemoDataLoading}
                    title="Purger proprement toutes les données de démonstration de manière isolée"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Purger</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode d'emploi section (PRE-NAVIGATION STANDALONE) */}
            <div className="space-y-1.5 shrink-0 bg-emerald-950/15 border border-emerald-900/35 p-2.5 rounded-2xl">
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-[#10b981] px-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Portail Assistance
              </span>
              <button
                onClick={() => setIsUserGuideOpen(true)}
                className="w-full text-left p-2.5 px-3 rounded-xl text-xs font-bold transition-all bg-emerald-950/45 hover:bg-emerald-900/35 text-emerald-300 hover:text-emerald-100 border border-emerald-900/50 hover:border-emerald-700/60 cursor-pointer shadow-sm flex items-center justify-between group"
                title="Consulter le guide d'utilisation interactif de Elyssa ERP Pro"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
                  <span>Mode d'emploi</span>
                </div>
                <span className="bg-emerald-900/50 border border-emerald-800 text-emerald-250 px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider uppercase">GUIDE</span>
              </button>
            </div>

            {/* Active Company & Subscription Info debug/display box */}
            <div className="p-3 bg-slate-950/45 border border-slate-800/80 rounded-2xl text-[10px] space-y-2 shrink-0">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-sans font-medium">Entreprise :</span>
                <span className="font-bold text-slate-200">{activeCompanyName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-sans font-medium">Pack Actif :</span>
                <span className="font-mono bg-indigo-950/60 border border-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded-md uppercase font-black text-[9px] tracking-wider animate-pulse">
                  {currentPack}
                </span>
              </div>
            </div>

            {!hasLoadedClientsFromServer && activeCompanyName !== 'Inter-Affaires' && activeCompanyName !== 'Elyssa Entreprises S.A.' ? (
              <div className="space-y-4 py-6 px-2 shrink-0">
                <div className="flex items-center space-x-2.5 text-indigo-400">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Chargement de la licence...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-6 bg-slate-800/40 rounded-lg animate-pulse w-3/4"></div>
                  <div className="h-8 bg-slate-800/40 rounded-lg animate-pulse"></div>
                  <div className="h-8 bg-slate-800/40 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ) : (
              allowedMenuSections.map((section, sIdx) => {
                const categoryKey = section.title.toLowerCase();
                let categoryColor = 'text-slate-500';
                let dotColor = 'bg-slate-500';
                if (categoryKey.includes('pilotage') || categoryKey.includes('performance')) {
                  categoryColor = 'text-indigo-400';
                  dotColor = 'bg-indigo-400';
                } else if (categoryKey.includes('commerciale') || categoryKey.includes('crm') || categoryKey.includes('activité')) {
                  categoryColor = 'text-sky-400';
                  dotColor = 'bg-sky-400';
                } else if (categoryKey.includes('humaines') || categoryKey.includes('ressources')) {
                  categoryColor = 'text-emerald-400';
                  dotColor = 'bg-emerald-400';
                } else if (categoryKey.includes('logistique') || categoryKey.includes('achats') || categoryKey.includes('stock')) {
                  categoryColor = 'text-cyan-400';
                  dotColor = 'bg-cyan-400';
                } else if (categoryKey.includes('finance') || categoryKey.includes('comptabilité')) {
                  categoryColor = 'text-amber-400';
                  dotColor = 'bg-amber-400';
                } else if (categoryKey.includes('parc') || categoryKey.includes('matériel') || categoryKey.includes('contrôle')) {
                  categoryColor = 'text-purple-400';
                  dotColor = 'bg-purple-400';
                }

                return (
                  <div key={section.title} className="space-y-1.5">
                    <div className="flex items-center space-x-2 px-3 py-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 opacity-85 shadow-[0_0_6px_rgba(255,255,255,0.15)]`}></span>
                      <span className={`block text-[10px] font-black uppercase tracking-widest ${categoryColor}`}>
                        {section.title}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {section.items.map(item => {
                        const active = activeTab === item.id;
                        const isTej = item.id === 'tej';
                        const isCompanySettings = item.id === 'company_settings';
                        const isUnlocked = isModuleUnlockedState(item.id);
                        
                        let buttonStyles = '';
                        if (active) {
                          if (isTej) {
                            buttonStyles = 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-black';
                          } else if (isCompanySettings) {
                            buttonStyles = 'bg-emerald-500 text-slate-950 border-emerald-600 shadow-sm font-black';
                          } else {
                            buttonStyles = 'bg-indigo-600 text-white border-indigo-650 shadow-sm';
                          }
                        } else {
                          if (isTej) {
                            buttonStyles = 'border-amber-500/25 text-amber-400 bg-amber-500/10 hover:bg-amber-950/30 hover:text-amber-300';
                          } else if (isCompanySettings) {
                            buttonStyles = 'border-emerald-500/25 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-950/30 hover:text-emerald-300';
                          } else {
                            buttonStyles = 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200';
                          }
                        }

                        // Style locked modules beautifully with a padlock
                        if (!isUnlocked) {
                          if (active) {
                            buttonStyles = 'bg-slate-800/80 border-slate-700 text-indigo-300 shadow-sm font-bold';
                          } else {
                            buttonStyles = 'border-transparent text-slate-500 hover:bg-slate-800/40 hover:text-slate-400';
                          }
                        }

                        let renderedIcon = item.icon;
                        if (isTej) {
                          renderedIcon = React.isValidElement<{ className?: string }>(item.icon) 
                            ? React.cloneElement(item.icon, { className: `w-4 h-4 ${active ? 'text-slate-950' : 'text-amber-400'}` })
                            : item.icon;
                        } else if (isCompanySettings) {
                          renderedIcon = React.isValidElement<{ className?: string }>(item.icon) 
                            ? React.cloneElement(item.icon, { className: `w-4 h-4 ${active ? 'text-slate-950' : 'text-emerald-400'}` })
                            : item.icon;
                        }

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSidebarItemClick(item.id)}
                            className={`w-full text-left p-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center space-x-3 border ${buttonStyles}`}
                          >
                            {renderedIcon}
                            <span className="truncate">{item.label}</span>
                            {isTej && (
                              <span className={`ml-auto text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${active ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'}`}>
                                Gratuit
                              </span>
                            )}
                            {isCompanySettings && (
                              <span className={`ml-auto text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${active ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                Gratuit
                              </span>
                            )}
                            {!isUnlocked && !isTej && !isCompanySettings && (
                              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-auto pt-4 shrink-0">
            {/* Copyright signature */}
            <div className="border-t border-slate-800 pt-4 space-y-1.5 text-[10px]">
              <div className="flex items-center space-x-2 text-slate-500">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>Session Authentifiée</span>
              </div>
              <p className="text-slate-400 font-mono">TZ-06-18-2026-TND</p>
            </div>
          </div>
        </aside>
        )}

        {/* Mobile menu sheet */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="fixed inset-0 z-50 bg-slate-900/95 text-white lg:hidden flex flex-col justify-between p-6 top-16 w-80 shadow-2xl overflow-y-auto"
            >
              <div className="space-y-5">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest px-3">
                  Menu Tactile
                </span>

                {/* Mobile SaaS Admin Panel shortcut */}
                {isPlatformAdmin && (
                  <div className="space-y-1.5 shrink-0 bg-indigo-950/20 border border-indigo-900/40 p-2.5 rounded-2xl mx-1">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-indigo-400 px-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                      Console d'Exploitation
                    </span>
                    <button
                      onClick={() => {
                        setActiveTab('saas_config');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-xl text-xs font-bold bg-indigo-950/50 hover:bg-indigo-900/40 text-indigo-300 hover:text-indigo-100 border border-indigo-850 cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Espace Client & Packs</span>
                      </div>
                      <span className="bg-indigo-900/50 border border-indigo-800 text-indigo-250 px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider uppercase">SAAS</span>
                    </button>
                  </div>
                )}

                {/* Mobile Mode d'emploi section (PRE-NAVIGATION STANDALONE) */}
                <div className="space-y-1.5 shrink-0 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-2xl mx-1">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-400 px-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Portail Assistance
                  </span>
                  <button
                    onClick={() => { setIsUserGuideOpen(true); setMobileMenuOpen(false); }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold bg-emerald-950/50 hover:bg-emerald-900/40 text-emerald-300 hover:text-emerald-100 border border-emerald-850 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>Mode d'emploi</span>
                    </div>
                    <span className="bg-emerald-900/50 border border-emerald-800 text-emerald-250 px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider uppercase">GUIDE</span>
                  </button>
                </div>
                
                {/* Active Company & Subscription Info debug/display box */}
                <div className="p-3 bg-slate-950/45 border border-slate-800/80 rounded-2xl text-[10px] space-y-2 shrink-0 mx-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-sans font-medium">Entreprise :</span>
                    <span className="font-bold text-slate-200">{activeCompanyName}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-sans font-medium">Pack Actif :</span>
                    <span className="font-mono bg-indigo-950/60 border border-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded-md uppercase font-black text-[9px] tracking-wider animate-pulse">
                      {currentPack}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {!hasLoadedClientsFromServer && activeCompanyName !== 'Inter-Affaires' && activeCompanyName !== 'Elyssa Entreprises S.A.' ? (
                    <div className="space-y-4 py-6 px-2 shrink-0">
                      <div className="flex items-center space-x-2.5 text-indigo-400">
                        <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Chargement de la licence...</span>
                      </div>
                    </div>
                  ) : (
                    allowedMenuSections.map((section, sIdx) => {
                      const categoryKey = section.title.toLowerCase();
                      let categoryColor = 'text-slate-500';
                      let dotColor = 'bg-slate-500';
                      if (categoryKey.includes('pilotage') || categoryKey.includes('performance')) {
                        categoryColor = 'text-indigo-400';
                        dotColor = 'bg-indigo-400';
                      } else if (categoryKey.includes('commerciale') || categoryKey.includes('activité')) {
                        categoryColor = 'text-sky-400';
                        dotColor = 'bg-sky-400';
                      } else if (categoryKey.includes('finance') || categoryKey.includes('comptabilité')) {
                        categoryColor = 'text-amber-400';
                        dotColor = 'bg-amber-400';
                      } else if (categoryKey.includes('ressources') || categoryKey.includes('logistique')) {
                        categoryColor = 'text-emerald-400';
                        dotColor = 'bg-emerald-400';
                      } else if (categoryKey.includes('stratégiques') || categoryKey.includes('opérations')) {
                        categoryColor = 'text-orange-400';
                        dotColor = 'bg-orange-400';
                      } else if (categoryKey.includes('système') || categoryKey.includes('contrôle')) {
                        categoryColor = 'text-slate-400';
                        dotColor = 'bg-slate-400';
                      }

                      return (
                        <div key={section.title} className="space-y-1.5">
                          <div className="flex items-center space-x-2 px-3 py-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 opacity-85 shadow-[0_0_6px_rgba(255,255,255,0.1)]`}></span>
                            <span className={`block text-[9px] font-black uppercase tracking-widest ${categoryColor}`}>
                              {section.title}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {section.items.map(item => {
                              const active = activeTab === item.id;
                              const isTej = item.id === 'tej';
                              const isCompanySettings = item.id === 'company_settings';
                              const isUnlocked = isModuleUnlockedState(item.id);
                              
                              let buttonStyles = '';
                              if (active) {
                                if (isTej) {
                                  buttonStyles = 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-black';
                                } else if (isCompanySettings) {
                                  buttonStyles = 'bg-emerald-500 text-slate-950 border-emerald-600 shadow-sm font-black';
                                } else {
                                  buttonStyles = 'bg-indigo-600 border-indigo-500 text-white';
                                }
                              } else {
                                if (isTej) {
                                  buttonStyles = 'border-amber-500/25 text-amber-400 bg-amber-500/10 hover:bg-amber-950/30 hover:text-amber-300';
                                } else if (isCompanySettings) {
                                  buttonStyles = 'border-emerald-500/25 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-950/30 hover:text-emerald-300';
                                } else {
                                  buttonStyles = 'border-transparent text-slate-400 hover:bg-slate-800';
                                }
                              }

                              // Style locked modules beautifully with a padlock
                              if (!isUnlocked) {
                                if (active) {
                                  buttonStyles = 'bg-slate-800/80 border-slate-700 text-indigo-300 shadow-sm font-bold';
                                } else {
                                  buttonStyles = 'border-transparent text-slate-500 hover:bg-slate-800/40 hover:text-slate-400';
                                }
                              }

                              let renderedIcon = item.icon;
                              if (isTej) {
                                renderedIcon = React.isValidElement<{ className?: string }>(item.icon)
                                  ? React.cloneElement(item.icon, { className: `w-4 h-4 ${active ? 'text-slate-950' : 'text-amber-400'}` })
                                  : item.icon;
                              } else if (isCompanySettings) {
                                renderedIcon = React.isValidElement<{ className?: string }>(item.icon)
                                  ? React.cloneElement(item.icon, { className: `w-4 h-4 ${active ? 'text-slate-950' : 'text-emerald-400'}` })
                                  : item.icon;
                              }

                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleSidebarItemClick(item.id)}
                                  className={`w-full text-left p-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center space-x-3 border ${buttonStyles}`}
                                >
                                  {renderedIcon}
                                  <span className="truncate">{item.label}</span>
                                  {isTej && (
                                    <span className={`ml-auto text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${active ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-400'}`}>
                                      Gratuit
                                    </span>
                                  )}
                                  {isCompanySettings && (
                                    <span className={`ml-auto text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${active ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                      Gratuit
                                    </span>
                                  )}
                                  {!isUnlocked && !isTej && !isCompanySettings && (
                                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-auto" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                Elyssa CRM SaaS v4.0.26
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Panel viewport render */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden w-full print:p-0 print:m-0 print:max-w-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {isCurrentlyTrialBlocked && activeTab !== 'saas_config' ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-xl space-y-6 my-12 animate-fadeIn font-sans">
                  <div className="w-20 h-20 mx-auto rounded-full bg-red-50 border border-red-150 flex items-center justify-center text-red-600 animate-pulse">
                    <Lock className="w-10 h-10 stroke-[2]" />
                  </div>
                  <div className="space-y-2">
                    <span className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">
                      Échéance de la période d'évaluation
                    </span>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-display">
                      Votre Sandbox d'Évaluation de {trialDurationDays} {trialDurationDays === 1 ? "jour" : "jours"} {trialDurationDays === 7 ? '(1 semaine)' : trialDurationDays === 14 ? '(2 semaines)' : trialDurationDays === 30 ? '(1 mois)' : trialDurationDays === 90 ? '(3 mois)' : ''} est expirée
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
                      Pour débloquer l'accès complet à tous les modules opérationnels (Tableaux de bord, Facturation, Pilotage terrain, Finance) et vos données, veuillez acquérir un abonnement ou saisir votre clé de licence commerciale valide.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl max-w-md mx-auto flex items-center space-x-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650 font-bold shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-slate-800 leading-none">Accès préservé à l'Espace Facturation & Packs</h4>
                      <p className="text-[9.5px] text-slate-500 mt-1 leading-normal">Configurez ou régularisez votre compte en direct sans perte de données.</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('saas_config')}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-550 text-white font-black text-xs uppercase tracking-wider p-3 px-8 rounded-xl shadow-lg shadow-indigo-600/15 cursor-pointer transition-all border-0 font-sans"
                    >
                      <span>Consulter l'Espace Client & Packs</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {!isModuleUnlockedState(activeTab) ? (
                    <LockedModulePage
                      tabId={activeTab}
                      moduleLabel={allowedMenuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label}
                      currentPackName={getActiveSubscriptionPackId().toUpperCase()}
                      activeCompanyName={activeCompanyName}
                      onNavigateToSaaSConfig={() => setActiveTab('saas_config')}
                      onNavigateToDashboard={() => setActiveTab('dashboard')}
                    />
                  ) : (
                    <>
                      {activeTab === 'dashboard' && (
                        <AppLaunchpad
                          setActiveTab={setActiveTab}
                          isModuleUnlocked={isModuleUnlockedState}
                          activeCompanyName={activeCompanyName}
                          activeCompanySettings={activeCompanySettings}
                          currentUser={currentUser}
                          clients={clients}
                          invoices={invoices}
                          employees={employees}
                          products={products}
                          onOpenCopilot={copilot.openChat}
                          onOpenUserGuide={() => setIsUserGuideOpen(true)}
                          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                          isSidebarCollapsed={!isSidebarOpen}
                        />
                      )}

                      {activeTab === 'executive_dashboard' && (
                        <Dashboard 
                          clients={clients} 
                          complaints={complaints} 
                          invoices={invoices} 
                          visitReports={visitReports}
                          products={products}
                          setActiveTab={setActiveTab}
                          trialState={trialState}
                          trialTimeLeftStr={trialTimeLeftStr}
                          licenseStatus={(() => {
                            const client = publisherClients.find((c: any) => c && (c.id === activeCompanyName || c.companyName?.toLowerCase() === activeCompanyName?.toLowerCase()));
                            if (!client) {
                              if (activeCompanyName?.toLowerCase() === 'elyssa entreprises s.a.') {
                                return 'paid';
                              }
                              return 'standard';
                            }
                            return client.license_status || (client.status === 'trial' ? 'trial' : 'paid');
                          })()}
                          activeCompanyName={activeCompanyName}
                          onOpenCopilot={copilot.openChat}
                        />
                      )}

              {activeTab === 'steering' && (
                <PilotageManager 
                  clients={clients}
                  invoices={invoices}
                />
              )}

              {activeTab === 'caisse' && (
                <SmartPOS
                  products={products}
                  suppliers={suppliers}
                  stockMovements={stockMovements}
                  onUpdateProducts={setProducts}
                  onUpdateStockMovements={setStockMovements}
                  clients={clients}
                  onUpdateClients={setClients}
                  invoices={invoices}
                  onUpdateInvoices={setInvoices}
                  bankAccounts={bankAccounts}
                  bankTransactions={bankTransactions}
                  onUpdateBankAccounts={setBankAccounts}
                  onUpdateBankTransactions={setBankTransactions}
                  currentUser={currentUser}
                  adminSettings={activeCompanySettings}
                  collaborators={collaborators}
                  tenantId={activeCompanyName}
                />
              )}

              {activeTab === 'clients' && (
                <ClientManager 
                  clients={clients} 
                  onUpdateClients={setClients} 
                  readOnly={currentUser?.role === 'Viewer'}
                />
              )}

              {activeTab === 'complaints' && (
                <ComplaintManager 
                  complaints={complaints} 
                  clients={clients} 
                  onUpdateComplaints={setComplaints} 
                  readOnly={currentUser?.role === 'Viewer'}
                />
              )}

              {activeTab === 'billing' && (
                <BillingManager 
                  invoices={invoices} 
                  clients={clients} 
                  adminSettings={activeCompanySettings}
                  onUpdateAdminSettings={handleUpdateSettings}
                  onUpdateInvoices={setInvoices} 
                  smtpSettings={smtpSettings}
                  emailTemplates={emailTemplates}
                  communicationLogs={communicationLogs}
                  onUpdateCommunicationLogs={setCommunicationLogs}
                />
              )}

              {activeTab === 'communication' && (
                <CommunicationHub
                  smtpSettings={smtpSettings}
                  onUpdateSmtpSettings={async (settings) => {
                    setSmtpSettings(settings);
                    localStorage.setItem('carthage_smtp_settings', JSON.stringify(settings));
                    try {
                      const payload = {
                        clients,
                        complaints,
                        invoices,
                        visitReports,
                        competitors,
                        suppliers,
                        products,
                        stockMovements,
                        smtpSettings: settings,
                        imapSettings,
                        incomingEmails,
                        emailTemplates,
                        communicationLogs,
                        bankAccounts,
                        bankTransactions,
                        taxDeclarations,
                        yearEndClosings,
                        documents,
                        employees,
                        lastUpdated: Date.now(),
                        isManualSave: true
                      };
                      await fetch('/api/db/company-data', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          company: activeCompanyName,
                          data: payload
                        })
                      });
                    } catch (e) {
                      console.error("Immediate SMTP save error:", e);
                    }
                  }}
                  imapSettings={imapSettings}
                  onUpdateImapSettings={async (settings) => {
                    setImapSettings(settings);
                    localStorage.setItem('carthage_imap_settings', JSON.stringify(settings));
                    try {
                      const payload = {
                        clients,
                        complaints,
                        invoices,
                        visitReports,
                        competitors,
                        suppliers,
                        products,
                        stockMovements,
                        smtpSettings,
                        imapSettings: settings,
                        incomingEmails,
                        emailTemplates,
                        communicationLogs,
                        bankAccounts,
                        bankTransactions,
                        taxDeclarations,
                        yearEndClosings,
                        documents,
                        employees,
                        lastUpdated: Date.now(),
                        isManualSave: true
                      };
                      await fetch('/api/db/company-data', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          company: activeCompanyName,
                          data: payload
                        })
                      });
                    } catch (e) {
                      console.error("Immediate IMAP save error:", e);
                    }
                  }}
                  incomingEmails={incomingEmails}
                  onUpdateIncomingEmails={setIncomingEmails}
                  emailTemplates={emailTemplates}
                  onUpdateEmailTemplates={setEmailTemplates}
                  communicationLogs={communicationLogs}
                  onUpdateCommunicationLogs={setCommunicationLogs}
                  clients={clients}
                  invoices={invoices}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'stock' && (
                <StockManager
                  products={products}
                  suppliers={suppliers}
                  stockMovements={stockMovements}
                  onUpdateProducts={setProducts}
                  onUpdateSuppliers={setSuppliers}
                  onUpdateStockMovements={setStockMovements}
                  readOnly={currentUser?.role === 'Viewer'}
                  companyLocations={companyLocations}
                  onUpdateCompanyLocations={setCompanyLocations}
                />
              )}

              {activeTab === 'market' && (
                <MarketIntelligence 
                  competitors={competitors} 
                  onUpdateCompetitors={setCompetitors} 
                />
              )}

              {activeTab === 'finance' && (
                <FinanceManager 
                  invoices={invoices}
                  products={products}
                  bankAccounts={bankAccounts}
                  bankTransactions={bankTransactions}
                  taxDeclarations={taxDeclarations}
                  yearEndClosings={yearEndClosings}
                  onUpdateBankAccounts={setBankAccounts}
                  onUpdateBankTransactions={setBankTransactions}
                  onUpdateTaxDeclarations={setTaxDeclarations}
                  onUpdateYearEndClosings={setYearEndClosings}
                  readOnly={currentUser?.role === 'Viewer'}
                  currentUser={currentUser}
                  activeCompanyName={activeCompanyName}
                  accountantClientContext={accountantClientContext}
                  onResetAccountantMode={handleResetAccountantMode}
                />
              )}

              {activeTab === 'tej' && (
                <TejIntegration
                  invoices={invoices}
                  bankAccounts={bankAccounts}
                  bankTransactions={bankTransactions}
                  yearEndClosings={yearEndClosings}
                  triggerPrint={(elementId, docName) => {
                    const printContent = document.getElementById(elementId);
                    if (printContent) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`<html><head><title>${docName}</title></head><body>${printContent.innerHTML}</body></html>`);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                        printWindow.close();
                      }
                    }
                  }}
                />
              )}

              {activeTab === 'payroll' && (
                <PayrollManager 
                  bankAccounts={bankAccounts}
                  bankTransactions={bankTransactions}
                  onUpdateBankAccounts={setBankAccounts}
                  onUpdateBankTransactions={setBankTransactions}
                  adminSettings={adminSettings}
                  employees={employees}
                  onUpdateEmployees={setEmployees}
                  contracts={contracts}
                  onUpdateContracts={setContracts}
                  absences={absences}
                  onUpdateAbsences={setAbsences}
                  payslips={payslips}
                  onUpdatePayslips={setPayslips}
                  companyLocations={companyLocations}
                  onUpdateCompanyLocations={setCompanyLocations}
                  missions={missions}
                />
              )}

              {activeTab === 'performance_contracts' && (
                <PerformanceManager
                  tenantId={activeCompanyName}
                  employees={employees}
                  invoices={invoices}
                  deliveryTours={[]}
                  payslips={payslips}
                  onUpdatePayslips={setPayslips}
                  currentUser={currentUser}
                  performanceContracts={performanceContracts}
                  onUpdateContracts={handleUpdatePerformanceContracts}
                />
              )}

              {activeTab === 'collaborators' && (
                <CollaboratorConsole 
                  collaborators={collaborators}
                  onUpdateCollaborators={setCollaborators}
                  currentUser={currentUser}
                  publisherClients={publisherClients}
                  activeCompanyName={activeCompanyName}
                  isModuleUnlocked={isModuleUnlockedState}
                  smtpSettings={smtpSettings}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceManager 
                  employees={employees} 
                  collaborators={collaborators}
                  currentUser={currentUser} 
                  isSimulationActive={isSimulationActive} 
                  activeCompanyName={activeCompanyName}
                  companyLocations={companyLocations}
                  onUpdateCompanyLocations={setCompanyLocations}
                />
              )}

              {activeTab === 'ged' && (
                <GedManager
                  clients={clients}
                  employees={employees}
                  documents={documents}
                  onUpdateDocuments={setDocuments}
                  currentUserEmail={currentUser?.email}
                  readOnly={currentUser?.role === 'Viewer'}
                />
              )}

              {activeTab === 'fleet_management' && (
                <ErrorBoundary moduleName="Gestion du Parc & Actifs">
                  <FleetAssetManager tenantId={activeCompanyName} />
                </ErrorBoundary>
              )}

              {activeTab === 'warehouse_picking' && (
                <ErrorBoundary moduleName="Espace Dépôt & Préparations">
                  <WarehousePickingScreen tenantId={activeCompanyName} currentUser={currentUser} />
                </ErrorBoundary>
              )}

              {activeTab === 'dispatch_tours' && (
                <ErrorBoundary moduleName="Expéditions & Tournées">
                  <DispatchManager tenantId={activeCompanyName} employees={employees} />
                </ErrorBoundary>
              )}

              {activeTab === 'fleet' && (
                <ErrorBoundary moduleName="Parc Auto">
                  <FleetManager 
                    isSimulationActive={isSimulationActive} 
                    vehicles={vehicles}
                    onUpdateVehicles={setVehicles}
                    missions={missions}
                    onUpdateMissions={setMissions}
                    expenses={expenses}
                    onUpdateExpenses={setExpenses}
                    incidents={incidents}
                    onUpdateIncidents={setIncidents}
                    employees={employees}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'transit_logistique' && (
                <TransitLogistiqueManager 
                  standaloneMode="full" 
                  isSimulationActive={isSimulationActive} 
                  folders={importFolders}
                  onUpdateFolders={setImportFolders}
                  lcRequests={lcRequests}
                  onUpdateLcRequests={setLcRequests}
                  bankAccounts={bankAccounts}
                  onUpdateBankAccounts={setBankAccounts}
                  bankTransactions={bankTransactions}
                  onUpdateBankTransactions={setBankTransactions}
                  manufacturingOrders={manufacturingOrders}
                />
              )}

              {activeTab === 'lc_manager' && (
                <TransitLogistiqueManager 
                  standaloneMode="lc_only" 
                  isSimulationActive={isSimulationActive} 
                  folders={importFolders}
                  onUpdateFolders={setImportFolders}
                  lcRequests={lcRequests}
                  onUpdateLcRequests={setLcRequests}
                  bankAccounts={bankAccounts}
                  onUpdateBankAccounts={setBankAccounts}
                  bankTransactions={bankTransactions}
                  onUpdateBankTransactions={setBankTransactions}
                  manufacturingOrders={manufacturingOrders}
                />
              )}

              {activeTab === 'investment' && (
                <InvestmentManager
                  bankAccounts={bankAccounts}
                  bankTransactions={bankTransactions}
                  taxDeclarations={taxDeclarations}
                  yearEndClosings={yearEndClosings}
                  onUpdateBankAccounts={setBankAccounts}
                  onUpdateBankTransactions={setBankTransactions}
                  onUpdateTaxDeclarations={setTaxDeclarations}
                  onUpdateYearEndClosings={setYearEndClosings}
                  readOnly={currentUser?.role === 'Viewer'}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsManager 
                  visitReports={visitReports}
                  clients={clients}
                  complaints={complaints}
                  invoices={invoices}
                  onUpdateVisitReports={setVisitReports}
                />
              )}

              {activeTab === 'cession' && (
                <ErrorBoundary moduleName="Cession d'entreprise">
                  <CessionManager
                    currentUser={currentUser}
                    isSimulationActive={isSimulationActive}
                    entries={cessionEntries}
                    onUpdateEntries={setCessionEntries}
                    isDemoCompany={isDemoCompany}
                  />
                </ErrorBoundary>
              )}

              {activeTab === 'production' && (
                <ProductionManager
                  currentUser={currentUser}
                  nomenclatures={nomenclatures}
                  onUpdateNomenclatures={setNomenclatures}
                  manufacturingOrders={manufacturingOrders}
                  onUpdateManufacturingOrders={setManufacturingOrders}
                  isDemoCompany={isDemoCompany}
                  importFolders={importFolders}
                  lcRequests={lcRequests}
                />
              )}

              {activeTab === 'purchasing' && (
                <PurchasingManager
                  currentUser={currentUser}
                  requisitions={purchaseRequisitions}
                  onUpdateRequisitions={setPurchaseRequisitions}
                  purchaseOrders={purchaseOrders}
                  onUpdatePurchaseOrders={setPurchaseOrders}
                  suppliersPerformance={supplierPerformance}
                  onUpdateSuppliersPerformance={setSupplierPerformance}
                  isDemoCompany={isDemoCompany}
                />
              )}

              {activeTab === 'asset' && (
                <AssetManager
                  currentUser={currentUser}
                  assets={assets}
                  onUpdateAssets={setAssets}
                  isDemoCompany={isDemoCompany}
                />
              )}

              {activeTab === 'treasury' && (
                <TreasuryManager currentUser={currentUser} />
              )}

              {activeTab === 'business_plan' && (
                <BusinessPlanManager companyName={activeCompanySettings.companyName || 'Elyssa Entreprises'} />
              )}

              {activeTab === 'juridique' && (
                <JuridiqueManager companyName={activeCompanySettings.companyName || 'Elyssa Entreprises'} />
              )}

              {activeTab === 'portail_client' && (
                <PortailClientManager clients={clients} invoices={invoices} companyName={activeCompanySettings.companyName || 'Elyssa Entreprises'} />
              )}

              {activeTab === 'accountant_portal' && (
                <AccountantPortal
                  onSwitchCompany={(companyName, tenantId, mf) => {
                    handleSwitchToAccountantClient(companyName, tenantId, mf);
                  }}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'saas_config' && (
                <SaaSConfig
                  subscriptionPack={subscriptionPack}
                  onUpdateSubscriptionPack={handleUpdateSubscriptionPack}
                  purchasedModules={purchasedModules}
                  onUpdatePurchasedModules={setPurchasedModules}
                  hideLockedModules={hideLockedModules}
                  onUpdateHideLockedModules={setHideLockedModules}
                  customPacks={finalCustomPacks}
                  onUpdateCustomPacks={handleUpdateCustomPacks}
                  currentUser={currentUser}
                  collaborators={collaborators}
                  onUpdateCollaborators={setCollaborators}
                  publisherClients={publisherClients}
                  onUpdatePublisherClients={handleUpdatePublisherClients}
                  activeSubscriptionPackId={getActiveSubscriptionPackId()}
                  activeCompanyName={activeCompanyName}
                  onUpdateActiveCompanyName={setActiveCompanyName}
                  isSimulationActive={isSimulationActive}
                  onToggleSimulationActive={setIsSimulationActive}
                  trialDurationDays={trialDurationDays}
                  onUpdateTrialDurationDays={handleUpdateTrialDurationDays}
                  onClearDemoData={clearDemoData}
                />
              )}

              {activeTab === 'company_settings' && (
                <AdminConsole 
                  settings={activeCompanySettings}
                  onUpdateSettings={handleUpdateSettings}
                  collaborators={collaborators}
                  onUpdateCollaborators={setCollaborators}
                  allData={{ clients, complaints, invoices, visitReports, competitors, suppliers, products, stockMovements, bankAccounts, bankTransactions, taxDeclarations, yearEndClosings }}
                  onImportAllData={handleBulkImport}
                  currentUser={currentUser}
                  publisherClients={publisherClients}
                  onUpdatePublisherClients={rawSetPublisherClients}
                  mode="company_settings"
                />
              )}

              {activeTab === 'mobile_terrain' && (
                <ErrorBoundary moduleName="Flotte Mobile & Suivi Terrain">
                  <MobileTerrainDashboard tenantId={activeCompanyName} employees={employees} vehicles={vehicles} missions={missions} />
                </ErrorBoundary>
              )}

              {activeTab === 'admin' && (
                <AdminConsole 
                  settings={activeCompanySettings}
                  onUpdateSettings={handleUpdateSettings}
                  collaborators={collaborators}
                  onUpdateCollaborators={setCollaborators}
                  allData={{ clients, complaints, invoices, visitReports, competitors, suppliers, products, stockMovements, bankAccounts, bankTransactions, taxDeclarations, yearEndClosings }}
                  onImportAllData={handleBulkImport}
                  currentUser={currentUser}
                  publisherClients={publisherClients}
                  onUpdatePublisherClients={rawSetPublisherClients}
                  mode="admin"
                />
              )}
                    </>
                  )}
                </>)}
            </motion.div>
          </AnimatePresence>
        </main>

        <UserGuide 
          isOpen={isUserGuideOpen} 
          onClose={() => setIsUserGuideOpen(false)} 
        />

        {/* Dynamic discrete auto-save toast notification utilizing AnimatePresence */}
        <AnimatePresence>
          {autoSaveToast?.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-emerald-500/35 px-4 py-3 rounded-xl shadow-2xl shadow-emerald-950/20 text-white max-w-sm"
              id="carthage-autosave-notification"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-400">Sauvegarde Automatique</p>
                <p className="text-[10px] text-slate-300">Données ERP critiques sécurisées à {autoSaveToast.timestamp}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast confirmation for automatic demo data clearance */}
        <AnimatePresence>
          {showDemoClearedToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-[#0a0f1d]/95 backdrop-blur-md border border-indigo-500/45 px-5 py-4 rounded-xl shadow-2xl shadow-indigo-950/20 text-white max-w-sm"
              id="carthage-democleared-notification"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-black uppercase text-indigo-450 tracking-wider">Données Démo Purgées !</p>
                <p className="text-[10px] text-slate-300 leading-normal mt-0.5">Votre abonnement est actif. Les données de simulation ont été entièrement nettoyées pour vous laisser un espace de travail vierge.</p>
              </div>
              <button 
                onClick={() => setShowDemoClearedToast(false)}
                className="flex-shrink-0 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast warning for access denied module block */}
        <AnimatePresence>
          {accessErrorToast?.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-slate-900/95 backdrop-blur-md border border-red-500/45 px-5 py-4 rounded-xl shadow-2xl shadow-red-950/25 text-white max-w-sm"
              id="carthage-accessdenied-notification"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-black uppercase text-red-500 tracking-wider">Accès Bloqué !</p>
                <p className="text-[10px] text-slate-300 leading-normal mt-0.5">Le module "{accessErrorToast.moduleName}" n'est pas inclus dans le pack d'abonnement actif de votre entreprise.</p>
              </div>
              <button 
                onClick={() => setAccessErrorToast(null)}
                className="flex-shrink-0 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elegant notification suggesting demo data import for empty modules */}
        <AnimatePresence>
          {emptyModuleToast?.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 bg-[#0a0f1d]/95 backdrop-blur-md border border-indigo-500/45 p-4 rounded-xl shadow-2xl shadow-indigo-950/30 text-white max-w-sm w-full"
              id="elyssa-empty-module-toast"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs font-black uppercase text-indigo-400 tracking-wider">Module Vide</p>
                  <p className="text-[11px] text-slate-300 leading-normal mt-0.5">
                    Le module <span className="font-semibold text-white">{emptyModuleToast.moduleLabel}</span> est actuellement vide. Souhaitez-vous importer un jeu de données de démo pour ce module spécifique ?
                  </p>
                </div>
                <button 
                  onClick={() => setEmptyModuleToast(null)}
                  className="flex-shrink-0 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <button
                  onClick={() => setEmptyModuleToast(null)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg transition"
                >
                  Ignorer
                </button>
                <button
                  onClick={() => {
                    importDemoDataForModule(emptyModuleToast.moduleKey);
                    setEmptyModuleToast(null);
                    setAutoSaveToast({ show: true, timestamp: new Date().toLocaleTimeString('fr-FR') });
                  }}
                  className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-950/50 transition"
                >
                  <span>Charger Démo</span>
                  <svg className="w-3 h-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Purge Report Modal */}
        <AnimatePresence>
          {purgeReport && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden text-slate-800"
                id="elyssa-purge-report-modal"
              >
                <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight">Purge Radicale &amp; Exhaustive</h3>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Validation Multi-Collections</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPurgeReport(null);
                      window.location.reload();
                    }}
                    className="text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-black">Purge Multi-Collections complétée avec succès !</h4>
                      <p className="text-[10px] text-emerald-700 leading-relaxed mt-0.5">
                        Tous les résidus contenant &#39;demo&#39;, &#39;carthage&#39; ou non liés à l&#39;instance SBA ont été définitivement supprimés de la base de données Firestore. La mémoire cache du serveur a été synchronisée et purgée.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">État des Collections</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(purgeReport).map(([collName, details]: [string, any]) => {
                        const labels: Record<string, string> = {
                          collaborators: 'Collaborateurs',
                          treasury_checks: 'Chèques de Trésorerie',
                          audit_logs: 'Audit Logs (Trésorerie / POS)',
                          fixed_assets: 'Immobilisations (Biens)',
                          purchase_orders: 'Bons de Commande',
                          purchase_requests: "Demandes d'Achat",
                          production_orders: 'Ordres de Production',
                          bom_nomenclatures: 'Nomenclatures / GPAO'
                        };
                        const label = labels[collName] || collName;
                        const isClean = details.remaining === 0;

                        return (
                          <div key={collName} className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl flex flex-col justify-between space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-[11px] font-black text-slate-800 leading-tight">{label}</h5>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{collName}</p>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isClean ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                {isClean ? '0 résidu' : `${details.remaining} restants`}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-medium pt-1 border-t border-slate-100">
                              <span className="text-slate-500">Documents supprimés :</span>
                              <span className="font-bold text-slate-800">{details.deleted}</span>
                            </div>

                            {!isClean && details.recalcitrantIds && details.recalcitrantIds.length > 0 && (
                              <div className="mt-1.5 p-1.5 bg-red-50 border border-red-100 rounded-lg text-[9px] font-mono text-red-700 space-y-1">
                                <span className="font-bold block text-red-800">IDs récalcitrants :</span>
                                <div className="max-h-[80px] overflow-y-auto">
                                  {details.recalcitrantIds.map((id: string) => (
                                    <div key={id} className="truncate">• {id}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                  <button
                    onClick={() => {
                      setPurgeReport(null);
                      window.location.reload();
                    }}
                    className="p-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Fermer &amp; Actualiser</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <CopilotChatDrawer isOpen={copilot.isChatOpen} onClose={copilot.closeChat} companyId={activeCompanyName} />
      <button onClick={copilot.toggleChat} className="fixed bottom-6 right-6 z-40 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group">
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}
