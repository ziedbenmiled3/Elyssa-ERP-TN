import React from 'react';
import { ExternalLink, Printer, HelpCircle, X, ShieldAlert } from 'lucide-react';

interface IframePrintHelperProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  documentName: string;
  printTarget?: string;
  targetId?: string;
}

export default function IframePrintHelper({ isOpen, onClose, activeTab, documentName, printTarget, targetId }: IframePrintHelperProps) {
  if (!isOpen) return null;

  // Generate the high-fidelity URL with tab, print action, target template and record ID parameters
  let targetUrl = `${window.location.origin}${window.location.pathname}?tab=${activeTab}&print=true`;
  if (printTarget) {
    targetUrl += `&printTarget=${printTarget}`;
  }
  if (targetId) {
    targetUrl += `&id=${targetId}`;
  }

  // Bypasses browser iframe storage isolation by embedding the current authenticated session in the URL
  const storedSession = localStorage.getItem('carthage_session');
  if (storedSession) {
    try {
      const b64Session = btoa(encodeURIComponent(storedSession));
      targetUrl += `&session=${b64Session}`;
    } catch (e) {
      console.error('Error serializing session for print:', e);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2.5xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          {/* Header Icon & Title */}
          <div className="flex items-center space-x-3 text-indigo-600">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-700">
              <Printer className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Impression Sécurisée - Elyssa CRM
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Limitation de l'Aperçu Intégrét (iFrame)
              </p>
            </div>
          </div>

          {/* Explanation Warning Banner */}
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3.5 flex items-start space-x-2.5 text-slate-700">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-800">Directive de Sécurité Navigateur</p>
              <p className="leading-relaxed text-slate-600 text-[11px]">
                L'impression du document <strong className="text-slate-800 font-extrabold">"{documentName}"</strong> est bloquée car Elyssa CRM s'exécute à l'intérieur de l'aperçu sécurisé de <strong className="font-semibold text-slate-800">Google AI Studio</strong>.
              </p>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2.5 text-xs text-slate-600">
            <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Comment procéder ?</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
              <div className="flex items-start space-x-2">
                <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 font-bold rounded-full text-[10px] shrink-0">1</span>
                <p className="text-[11px]">Cliquez sur le bouton ci-dessous pour ouvrir Elyssa CRM en plein écran dans un nouvel onglet.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 font-bold rounded-full text-[10px] shrink-0">2</span>
                <p className="text-[11px]">La boîte de dialogue d'impression native du navigateur s'ouvrira <strong>automatiquement</strong> dès le chargement de la page.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2 pt-2">
            <a 
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ouvrir dans un nouvel onglet & imprimer</span>
            </a>
            
            <button
              onClick={onClose}
              className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 border border-slate-250 cursor-pointer"
            >
              <span>Continuer sans imprimer</span>
            </button>
          </div>

          {/* Troubleshooting and Help Footer */}
          <div className="text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1 border-t border-slate-100 pt-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Astuce : Vous pouvez aussi utiliser les raccourcis système standard après l'ouverture.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
