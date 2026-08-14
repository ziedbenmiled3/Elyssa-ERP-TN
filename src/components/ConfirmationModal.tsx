import React from 'react';
import { Trash2, Ban, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  details?: { label: string; value: React.ReactNode }[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = 'danger',
  details
}) => {
  if (!isOpen) return null;

  const colorStyles = {
    danger: {
      border: 'border-red-900/40',
      shadow: '[box-shadow:0_0_50px_rgba(239,68,68,0.18)]',
      iconBg: 'bg-red-950/50 border-red-900/60 text-red-400',
      tagBg: 'bg-red-950 text-red-400 border-red-900',
      btnBg: 'bg-rose-650 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/40',
      Icon: Trash2
    },
    warning: {
      border: 'border-amber-900/40',
      shadow: '[box-shadow:0_0_50px_rgba(245,158,11,0.18)]',
      iconBg: 'bg-amber-950/50 border-amber-900/60 text-amber-400',
      tagBg: 'bg-amber-950 text-amber-400 border-amber-900',
      btnBg: 'bg-amber-650 hover:bg-amber-600 text-white shadow-lg shadow-amber-950/40',
      Icon: Ban
    },
    info: {
      border: 'border-indigo-900/40',
      shadow: '[box-shadow:0_0_50px_rgba(99,102,241,0.18)]',
      iconBg: 'bg-indigo-950/50 border-indigo-900/60 text-indigo-400',
      tagBg: 'bg-indigo-950 text-indigo-400 border-indigo-900',
      btnBg: 'bg-indigo-650 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-950/40',
      Icon: ShieldAlert
    },
    success: {
      border: 'border-emerald-900/40',
      shadow: '[box-shadow:0_0_50px_rgba(16,185,129,0.18)]',
      iconBg: 'bg-emerald-950/50 border-emerald-900/60 text-emerald-400',
      tagBg: 'bg-emerald-950 text-emerald-400 border-emerald-900',
      btnBg: 'bg-emerald-650 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/40',
      Icon: CheckCircle2
    }
  };

  const style = colorStyles[type] || colorStyles.danger;
  const IconComponent = style.Icon;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className={`bg-slate-900 border ${style.border} ${style.shadow} rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 relative text-left`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-450 hover:text-white transition font-sans text-xs uppercase font-extrabold cursor-pointer hover:bg-slate-800 p-1.5 rounded-lg flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 border rounded-2xl flex-shrink-0 ${style.iconBg}`}>
            <IconComponent className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            {subtitle && (
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest inline-block font-mono border ${style.tagBg}`}>
                {subtitle}
              </span>
            )}
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{title}</h3>
            <div className="text-[11px] text-slate-300 font-medium leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1.5 font-mono text-[9.5px] text-slate-400">
            {details.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span className="text-slate-400">{d.label} :</span>
                <span className="text-slate-200 font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-extrabold text-[10px] uppercase py-3 rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-1/2 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 border-0 ${style.btnBg}`}
          >
            <IconComponent className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
