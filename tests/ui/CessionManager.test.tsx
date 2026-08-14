import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CessionManager } from '../../src/components/CessionManager';

describe('CessionManager', () => {
  beforeEach(() => {
    // Vider le localStorage avant chaque test pour repartir sur un état propre
    localStorage.clear();
    // Simuler le temps pour tester l'hydratation (si besoin)
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('devrait afficher le SkeletonLoader au montage (isHydrated = false)', () => {
    const { container } = render(<CessionManager entries={[]} onUpdateEntries={() => {}} currentUser={null} />);
    
    // Le skeleton doit être affiché avec l'animation pulse
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('devrait hydrater depuis le localStorage et retirer le skeleton', async () => {
    const mockData = [
      {
        id: 'cess-1',
        title: 'Test LocalStorage Entry',
        date: '2026-06-15',
        status: 'Brouillon'
      }
    ];
    localStorage.setItem('elyssa_cession_entries', JSON.stringify(mockData));

    const { container } = render(<CessionManager entries={[]} onUpdateEntries={() => {}} currentUser={null} />);
    
    // Forcer l'exécution de l'useEffect (hydratation)
    act(() => {
      vi.runAllTimers();
    });

    // Le composant final doit prendre le relai et afficher la donnée du localStorage
    await waitFor(() => {
      expect(screen.queryByText('Test LocalStorage Entry')).toBeInTheDocument();
      expect(screen.queryByText(/Brouillon/i)).toBeInTheDocument();
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });

  it('devrait utiliser les données par défaut si localStorage est vide', async () => {
    render(<CessionManager entries={[]} onUpdateEntries={() => {}} currentUser={null} />);
    
    act(() => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      // Le composant doit s'hydrater et afficher son UI principale (sans Skeleton)
      expect(screen.getByText(/Nouveau dossier/i)).toBeInTheDocument();
    });
  });
});
