import React from 'react';
import { FleetAssetManager } from './FleetAssetManager';

interface FleetInventoryManagerProps {
  tenantId?: string;
  isTrial?: boolean;
}

export const FleetInventoryManager: React.FC<FleetInventoryManagerProps> = ({ 
  tenantId = 'Inter-Affaires', 
  isTrial = false 
}) => {
  return <FleetAssetManager tenantId={tenantId} isTrial={isTrial} />;
};

export default FleetInventoryManager;
