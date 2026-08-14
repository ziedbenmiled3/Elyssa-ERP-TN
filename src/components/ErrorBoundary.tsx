import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in module:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-200 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Erreur d'affichage - Module {this.props.moduleName || 'Elyssa ERP'}
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Un problème technique temporaire est survenu lors du chargement des données de ce module.
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-rose-400 mb-6 text-left overflow-x-auto max-h-32">
              {this.state.error.toString()}
            </div>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Recharger le module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
