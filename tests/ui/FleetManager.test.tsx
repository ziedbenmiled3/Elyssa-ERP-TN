import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FleetManager from '../../src/components/FleetManager';

describe('FleetManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('devrait afficher le SkeletonLoader pendant le délai d\'hydratation', () => {
    const { container } = render(<FleetManager />);
    
    // Le loader avec animate-pulse doit être rendu immédiatement
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('devrait basculer sur l\'UI principale après l\'hydratation', async () => {
    render(<FleetManager />);
    
    // Avancer le timer pour dépasser le délai de 50ms d'hydratation
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Attendre que le tableau de bord principal soit rendu
    await waitFor(() => {
      expect(screen.queryByText(/Tableau de Bord Flotte/i)).toBeInTheDocument();
    });
  });

  it('ne devrait pas provoquer de boucles de rendu lors du changement de tab', async () => {
    render(<FleetManager />);
    
    act(() => {
      vi.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(screen.getByText(/Véhicules/i)).toBeInTheDocument();
    });

    // Simuler un clic sur le tab "Véhicules"
    const vehiclesTab = screen.getByRole('button', { name: /Véhicules/i });
    act(() => {
      vehiclesTab.click();
    });

    // L'onglet doit basculer sans jeter d'erreur (Maximum update depth exceeded)
    await waitFor(() => {
      expect(screen.getByText(/Nouveau Véhicule/i)).toBeInTheDocument();
    });
  });
});
