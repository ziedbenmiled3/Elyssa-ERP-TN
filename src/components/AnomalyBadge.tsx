import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, X, ChevronRight, AlertOctagon } from 'lucide-react';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AnomalyBadgeProps {
  category: 'Ventes' | 'Achats' | 'Stocks' | 'Finance';
  severity: AnomalySeverity;
  title: string;
  evidence: string;
  onIgnore?: () => void;
  onFix?: () => void;
}

export function AnomalyBadge({ category, severity, title, evidence, onIgnore, onFix }: AnomalyBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertOctagon, // Let's use AlertTriangle instead
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-100 dark:bg-rose-500/20',
          border: 'border-rose-200 dark:border-rose-500/30'
        };
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-100 dark:bg-amber-500/20',
          border: 'border-amber-200 dark:border-amber-500/30'
        };
      case 'medium':
        return {
          icon: AlertCircle,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-500/20',
          border: 'border-blue-200 dark:border-blue-500/30'
        };
      case 'low':
      default:
        return {
          icon: Info,
          color: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-100 dark:bg-slate-500/20',
          border: 'border-slate-200 dark:border-slate-500/30'
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <div className="relative inline-block">
      {/* Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${config.bg} ${config.border} ${config.color} text-xs font-semibold hover:opacity-80 transition-opacity`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>IA: Anomalie {category}</span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 sm:w-80 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start ${config.bg}`}>
            <div className="flex items-center space-x-2">
              <Icon className={`w-4 h-4 ${config.color}`} />
              <h4 className={`text-sm font-bold ${config.color}`}>Alerte Copilot</h4>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4">
            <h5 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">{title}</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {evidence}
            </p>
            
            <div className="flex items-center justify-end space-x-2">
              {onIgnore && (
                <button 
                  onClick={() => { onIgnore(); setIsOpen(false); }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Ignorer
                </button>
              )}
              {onFix && (
                <button 
                  onClick={() => { onFix(); setIsOpen(false); }}
                  className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors flex items-center space-x-1 ${severity === 'high' || severity === 'critical' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  <span>Corriger</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
