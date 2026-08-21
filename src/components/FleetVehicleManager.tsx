/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import FleetManager, { DEMO_VEHICLES, DEMO_MISSIONS, DEMO_EXPENSES, DEFAULT_DEMO_VEHICLES, DEFAULT_DEMO_MISSIONS, DEFAULT_DEMO_EXPENSES } from './FleetManager';
import { Vehicle, MissionOrder, FleetExpense, IncidentRecord, Employee } from '../types';

export interface FleetVehicleManagerProps {
  initialVehicles?: Vehicle[];
  initialMissions?: MissionOrder[];
  initialExpenses?: FleetExpense[];
  initialIncidents?: IncidentRecord[];
  employees?: Employee[];
  activeTenantId?: string;
  tenantId?: string;
  isSimulationActive?: boolean;
  isDemoCompany?: boolean;
}

export { DEMO_VEHICLES, DEMO_MISSIONS, DEMO_EXPENSES, DEFAULT_DEMO_VEHICLES, DEFAULT_DEMO_MISSIONS, DEFAULT_DEMO_EXPENSES };

export default function FleetVehicleManager({
  initialVehicles,
  initialMissions,
  initialExpenses,
  initialIncidents = [],
  employees = [],
  activeTenantId = 'Inter-Affaires',
  tenantId = 'Inter-Affaires',
  isSimulationActive = false,
  isDemoCompany = false
}: FleetVehicleManagerProps) {
  const isDemoTenant = React.useMemo(() => {
    if (isDemoCompany) return true;
    const tid = String(activeTenantId || tenantId || localStorage.getItem('carthage_active_company') || '').toLowerCase().trim();
    if (tid.includes('parent') || tid.includes('prod') || tid === 'inter-affaires' || tid === 'company_parent' || tid === 'elyssa entreprises s.a.') {
      return false;
    }
    return tid === 'inter-affaires-demo' || tid === 'demo' || tid === 'company_demo' || tid.includes('démo') || tid.includes('demo') || tid.includes('sandbox');
  }, [activeTenantId, tenantId, isDemoCompany]);

  // Direct state initialization with strict PROD isolation
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (!isDemoTenant) {
      return Array.isArray(initialVehicles) 
        ? initialVehicles.filter(v => !v.is_demo && !String(v.id || '').startsWith('demo-')) 
        : [];
    }
    return Array.isArray(initialVehicles) && initialVehicles.length > 0 ? initialVehicles : DEFAULT_DEMO_VEHICLES;
  });

  const [missions, setMissions] = useState<MissionOrder[]>(() => {
    if (!isDemoTenant) {
      return Array.isArray(initialMissions) 
        ? initialMissions.filter(m => !m.is_demo && !String(m.id || '').startsWith('demo-')) 
        : [];
    }
    return Array.isArray(initialMissions) && initialMissions.length > 0 ? initialMissions : DEFAULT_DEMO_MISSIONS;
  });

  const [expenses, setExpenses] = useState<FleetExpense[]>(() => {
    if (!isDemoTenant) {
      return Array.isArray(initialExpenses) 
        ? initialExpenses.filter(e => !e.is_demo && !String(e.id || '').startsWith('demo-')) 
        : [];
    }
    return Array.isArray(initialExpenses) && initialExpenses.length > 0 ? initialExpenses : DEFAULT_DEMO_EXPENSES;
  });

  useEffect(() => {
    if (!isDemoTenant) {
      const sanitized = Array.isArray(initialVehicles) 
        ? initialVehicles.filter(v => !v.is_demo && !String(v.id || '').startsWith('demo-')) 
        : [];
      setVehicles(sanitized);
    } else if (Array.isArray(initialVehicles) && initialVehicles.length > 0) {
      setVehicles(initialVehicles);
    }
  }, [initialVehicles, isDemoTenant]);

  useEffect(() => {
    if (!isDemoTenant) {
      const sanitized = Array.isArray(initialMissions) 
        ? initialMissions.filter(m => !m.is_demo && !String(m.id || '').startsWith('demo-')) 
        : [];
      setMissions(sanitized);
    } else if (Array.isArray(initialMissions) && initialMissions.length > 0) {
      setMissions(initialMissions);
    }
  }, [initialMissions, isDemoTenant]);

  useEffect(() => {
    if (!isDemoTenant) {
      const sanitized = Array.isArray(initialExpenses) 
        ? initialExpenses.filter(e => !e.is_demo && !String(e.id || '').startsWith('demo-')) 
        : [];
      setExpenses(sanitized);
    } else if (Array.isArray(initialExpenses) && initialExpenses.length > 0) {
      setExpenses(initialExpenses);
    }
  }, [initialExpenses, isDemoTenant]);

  const [incidents, setIncidents] = useState<IncidentRecord[]>(initialIncidents);

  return (
    <FleetManager
      isSimulationActive={isSimulationActive}
      vehicles={vehicles}
      onUpdateVehicles={(updated) => {
        setVehicles(updated);
        localStorage.setItem('carthage_fleet_vehicles', JSON.stringify(updated));
      }}
      missions={missions}
      onUpdateMissions={(updated) => {
        setMissions(updated);
        localStorage.setItem('carthage_fleet_missions', JSON.stringify(updated));
      }}
      expenses={expenses}
      onUpdateExpenses={(updated) => {
        setExpenses(updated);
        localStorage.setItem('carthage_fleet_expenses', JSON.stringify(updated));
      }}
      incidents={incidents}
      onUpdateIncidents={setIncidents}
      employees={employees}
      activeTenantId={activeTenantId}
      tenantId={tenantId}
    />
  );
}
