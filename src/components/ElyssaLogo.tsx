import React, { useState, useEffect } from 'react';

const GOLDEN_WOMAN_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwZjE3MmEiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0zMCw2MCBDMzUsNDAgNDUsMzAgNTAsMjUgQzU1LDMwIDY1LDQwIDcwLDYwIFoiIGZpbGw9InVybCgjZ29sZCkiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjIwIiByPSI0IiBmaWxsPSIjZmJiZjI0Ii8+PHBhdGggZD0iTTIwLDY1IEMzNSw3MCA2NSw3MCA4MCw2NSBDNzAsNzIgMzAsNzIgMjAsNjUgWiIgZmlsbD0iI2Y1OWUwYiIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ29sZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmYmJmMjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNiNDUzMDkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48dGV4dCB4PSI1MCIgeT0iODgiIGZpbGw9IiNmZmZmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgbGV0dGVyLXNwYWNpbmc9IjEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVMWVNTQTwvdGV4dD48L3N2Zz4=";

interface ElyssaLogoProps {
  className?: string;
  size?: number;
  variant?: 'icon' | 'full';
}

export const ElyssaLogo: React.FC<ElyssaLogoProps> = ({ 
  className = "w-8 h-8", 
  size,
  variant = 'icon'
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    // 1. Try to read user-saved logo from localStorage first
    try {
      const saved = localStorage.getItem('carthage_admin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.companyLogo) {
          return parsed.companyLogo;
        }
      }
    } catch (e) {
      console.error("Error reading logo from localStorage:", e);
    }
    // 2. Fallback to default golden woman logo
    return GOLDEN_WOMAN_LOGO;
  });

  useEffect(() => {
    // Fetch latest configurations from backend server on mount to ensure dynamic sync
    fetch('/api/db/admin-settings')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Network response not ok');
      })
      .then(data => {
        if (data?.companyLogo) {
          setLogoSrc(data.companyLogo);
          // Sync with local storage
          try {
            const saved = localStorage.getItem('carthage_admin_settings');
            const parsed = saved ? JSON.parse(saved) : {};
            parsed.companyLogo = data.companyLogo;
            localStorage.setItem('carthage_admin_settings', JSON.stringify(parsed));
          } catch (e) {
            console.error("Error writing logo to localStorage:", e);
          }
        }
      })
      .catch(err => {
        console.warn('Failed to fetch admin settings logo, using cached/local version:', err);
      });
  }, []);

  return (
    <img 
      src={logoSrc} 
      alt="Elyssa Logo" 
      className={`${className} object-contain`}
      style={size ? { width: size, height: size } : undefined}
      referrerPolicy="no-referrer"
    />
  );
};
