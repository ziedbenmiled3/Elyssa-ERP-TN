import React, { useState, useEffect } from 'react';
import { UserSession, CollaboratorAccount } from '../types';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, KeyRound, Building, User, X, CheckCircle2, RotateCw } from 'lucide-react';
import { ElyssaLogo } from './ElyssaLogo';

interface LoginPageProps {
  collaborators: CollaboratorAccount[];
  onLoginSuccess: (session: UserSession) => void;
  onBackToLanding?: () => void;
}

export default function LoginPage({ collaborators, onLoginSuccess, onBackToLanding }: LoginPageProps) {
  // 1. Core authentication states
  const [step, setStep] = useState<'enterprise' | 'collaborator_selection' | 'collaborator_password' | 'forgot_password' | 'create_company'>('enterprise');
  
  // Enterprise credentials input
  const [enterpriseEmail, setEnterpriseEmail] = useState('');
  const [enterprisePassword, setEnterprisePassword] = useState('');
  const [showEnterprisePassword, setShowEnterprisePassword] = useState(false);
  const [enterpriseError, setEnterpriseError] = useState('');

  // Company creation state for first login
  const [tempSession, setTempSession] = useState<UserSession | null>(null);
  const [createCompanyName, setCreateCompanyName] = useState('');
  const [createCompanyPassword, setCreateCompanyPassword] = useState('');
  const [createCompanyError, setCreateCompanyError] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Selected company and profile details
  const [selectedCompany, setSelectedCompany] = useState('Inter-Affaires');
  const [selectedProfile, setSelectedProfile] = useState<CollaboratorAccount | null>(null);
  const [employeePassword, setEmployeePassword] = useState('');
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [employeeError, setEmployeeError] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const [localCollaborators, setLocalCollaborators] = useState<CollaboratorAccount[]>(collaborators);

  useEffect(() => {
    if (collaborators && collaborators.length > 0) {
      setLocalCollaborators(collaborators);
    }
  }, [collaborators]);

  // Password verification states for trial collaborator rapid audits (modal)
  const [passwordPromptAccount, setPasswordPromptAccount] = useState<any | null>(null);
  const [promptPasswordInput, setPromptPasswordInput] = useState('');
  const [promptError, setPromptError] = useState('');

  // New States for Email Confirmation and Reset Password from URLs
  const [actionState, setActionState] = useState<{
    action: 'confirm_email' | 'reset_password' | 'none';
    token: string;
    email: string;
    status: 'loading' | 'success' | 'error' | 'idle';
    message: string;
  }>({ action: 'none', token: '', email: '', status: 'idle', message: '' });

  // Password reset fields
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Forgot password fields
  const [forgotEmailInput, setForgotEmailInput] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotSending, setIsForgotSending] = useState(false);

  // Email confirmation resending state
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');

  const [trialProspect, setTrialProspect] = useState<any>(() => {
    const saved = localStorage.getItem('carthage_trial_registered_prospect');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return null;
  });

  // Master password protection for the direct bypass console
  const [showUnlockBypassModal, setShowUnlockBypassModal] = useState(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Dev / audit shortcuts hidden by default on production domains for security
  const [showDirectBypass, setShowDirectBypass] = useState(() => {
    try {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return true;
      }
    } catch (e) {}
    return false;
  });

  // URL search parameter parsing to trigger confirmation or password reset views
  useEffect(() => {
    try {
      const revocationNotice = window.sessionStorage.getItem('elyssa_revocation_notice') || window.localStorage.getItem('elyssa_revocation_notice');
      if (revocationNotice) {
        setEnterpriseError(revocationNotice);
        window.sessionStorage.removeItem('elyssa_revocation_notice');
        window.localStorage.removeItem('elyssa_revocation_notice');
      }

      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const token = params.get('token');
      const email = params.get('email');

      if (action === 'confirm_email' && token && email) {
        setActionState({ action: 'confirm_email', token, email, status: 'loading', message: "Vérification et confirmation de votre adresse e-mail en cours..." });
        
        fetch('/api/auth/confirm-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token })
        })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            setActionState(prev => ({ ...prev, status: 'success', message: data.message }));
          } else {
            setActionState(prev => ({ ...prev, status: 'error', message: data.error }));
          }
        })
        .catch(() => {
          setActionState(prev => ({ ...prev, status: 'error', message: "Impossible de joindre le serveur d'authentification pour confirmer votre adresse e-mail." }));
        });
      } else if (action === 'reset_password' && token && email) {
        setActionState({ action: 'reset_password', token, email, status: 'idle', message: '' });
      }
    } catch (e) {
      console.error("Error reading URL search params:", e);
    }
  }, []);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setIsForgotSending(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmailInput.trim().toLowerCase() })
      });

      const data = await response.json();
      if (!response.ok) {
        setForgotError(data.error || "Une erreur s'est produite lors de la demande.");
      } else {
        setForgotSuccess(data.message || "E-mail de renouvellement envoyé avec succès !");
        setForgotEmailInput('');
      }
    } catch (err) {
      setForgotError("Une erreur réseau empêche la communication avec le serveur.");
    } finally {
      setIsForgotSending(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (newPasswordInput.length < 4) {
      setResetError("Le mot de passe global doit comporter au moins 4 caractères.");
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setResetError("Les mots de passe saisis ne correspondent pas.");
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: actionState.email,
          token: actionState.token,
          newPassword: newPasswordInput
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setResetError(data.error || "Le lien de renouvellement est expiré ou invalide.");
      } else {
        setResetSuccess(data.message || "Votre mot de passe a été réinitialisé avec succès !");
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        // Remove search params from url quietly
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {}
      }
    } catch (err) {
      setResetError("Une erreur de communication est survenue.");
    }
  };

  const handleResendConfirmation = async (emailToResend: string) => {
    setIsResending(true);
    setResendMessage('');
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToResend })
      });
      const data = await response.json();
      if (response.ok) {
        setResendMessage("L'e-mail de confirmation a été renvoyé avec succès !");
      } else {
        setResendMessage("Erreur : " + (data.error || "impossible de renvoyer l'e-mail."));
      }
    } catch (err) {
      setResendMessage("Échec de la connexion réseau.");
    } finally {
      setIsResending(false);
    }
  };

  const handleDevClick = () => {
    if (showDirectBypass) return;
    setShowUnlockBypassModal(true);
  };

  const handleVerifyUnlockBypass = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    if (unlockPasswordInput === 'Carthage2026!') {
      setShowDirectBypass(true);
      setShowUnlockBypassModal(false);
      setUnlockPasswordInput('');
    } else {
      setUnlockError('Code d\'accès administrateur incorrect.');
    }
  };

  // Stage 1: Validate enterprise common credentials
  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnterpriseError('');
    setUnconfirmedEmail('');
    setResendMessage('');

    if (!enterpriseEmail.trim() || !enterprisePassword.trim()) {
      setEnterpriseError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: enterpriseEmail.trim(),
          password: enterprisePassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setEnterpriseError(errorData.error || "Identifiants de l'entreprise ou mot de passe commun invalides.");
        if (errorData.requiresConfirmation && errorData.email) {
          setUnconfirmedEmail(errorData.email);
        }
        return;
      }

      const resData = await response.json();
      if (resData.type === 'super_admin') {
        onLoginSuccess(resData.session);
      } else if (resData.needsCompanyCreation) {
        setTempSession(resData.session);
        setCreateCompanyName('');
        setCreateCompanyPassword('');
        setStep('create_company');
      } else if (resData.type === 'company_direct') {
        const finalSession = {
          id: resData.session.id,
          name: resData.session.name,
          email: resData.session.email,
          role: resData.session.role || 'SUPER_ADMIN',
          companyName: resData.companyName,
          companyId: resData.companyId
        };
        try {
          localStorage.setItem('carthage_session', JSON.stringify(finalSession));
          localStorage.setItem('elyssa_active_session', JSON.stringify(finalSession));
          localStorage.setItem('carthage_active_tenant', resData.companyName);
        } catch (e) {}
        onLoginSuccess(finalSession);
      } else {
        if (Array.isArray(resData.collaborators)) {
          setLocalCollaborators(resData.collaborators);
        }
        setSelectedCompany(resData.companyName);
        setEmployeeSearch('');
        setStep('collaborator_selection');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification entreprise:', err);
      setEnterpriseError("Une erreur de communication est survenue avec le serveur de sécurité.");
    }
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateCompanyError('');
    setIsCreatingCompany(true);

    if (!createCompanyName.trim() || !createCompanyPassword.trim()) {
      setCreateCompanyError('Veuillez remplir tous les champs requis.');
      setIsCreatingCompany(false);
      return;
    }

    try {
      const response = await fetch('/api/db/add-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: createCompanyName.trim(),
          password: createCompanyPassword,
          collaboratorId: tempSession?.id,
          email: tempSession?.email,
          location: 'Tunisie',
          packId: 'trial',
          status: 'trial'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setCreateCompanyError(errorData.error || "Erreur lors de la création de l'entreprise.");
        setIsCreatingCompany(false);
        return;
      }

      const resData = await response.json();
      
      if (tempSession) {
        const finalSession = {
          ...tempSession,
          companyName: resData.company.companyName,
          companyId: resData.company.id
        };
        onLoginSuccess(finalSession);
      }
    } catch (err) {
      console.error('Error creating company:', err);
      setCreateCompanyError("Une erreur est survenue lors de la création de l'entreprise.");
    } finally {
      setIsCreatingCompany(false);
    }
  };

  // Stage 2: Selection
  const getCompanyEmployees = () => {
    let filtered = localCollaborators;
    if (selectedCompany === 'Inter-Affaires' || selectedCompany === 'Elyssa Entreprises S.A.') {
      // Find default collaborators
      const match = localCollaborators.filter(c => !c.company || c.company === 'Inter-Affaires' || c.company === 'Elyssa Entreprises S.A.');
      if (match.length > 0) filtered = match;
    } else if (selectedCompany) {
      const match = localCollaborators.filter(c => 
        c.company === selectedCompany || 
        c.company_id === selectedCompany || 
        c.companyId === selectedCompany ||
        (c.company && selectedCompany && c.company.toLowerCase() === selectedCompany.toLowerCase())
      );
      if (match.length > 0) filtered = match;
    }

    if (employeeSearch.trim()) {
      const criteria = employeeSearch.toLowerCase().trim();
      return filtered.filter(f => f.name.toLowerCase().includes(criteria) || f.role.toLowerCase().includes(criteria));
    }
    return filtered;
  };

  const handleSelectProfile = (profile: CollaboratorAccount) => {
    if (profile.status === 'Suspended') {
      setEnterpriseError("Votre accès est suspendu de manière temporaire. Veuillez contacter votre administrateur.");
      setStep('enterprise');
      return;
    }
    setSelectedProfile(profile);
    setEmployeePassword('');
    setEmployeeError('');
    setStep('collaborator_password');
  };

  const [isEmployeeSubmitting, setIsEmployeeSubmitting] = useState(false);

  // Stage 3: Validate individual employee password or master company password
  const handleEmployeePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeError('');
    setIsEmployeeSubmitting(true);

    if (!selectedProfile || !employeePassword.trim()) {
      setEmployeeError("Veuillez saisir votre code PIN ou mot de passe.");
      setIsEmployeeSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedProfile.id,
          password: employeePassword.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setEmployeeError(errorData.error || "Code PIN ou mot de passe incorrect.");
        setIsEmployeeSubmitting(false);
        return;
      }

      const resData = await response.json();

      // Immediately write session to localStorage to ensure immediate dashboard access
      try {
        localStorage.setItem('carthage_session', JSON.stringify(resData.session));
        localStorage.setItem('elyssa_active_session', JSON.stringify(resData.session));
        if (resData.session.companyName) {
          localStorage.setItem('carthage_active_tenant', resData.session.companyName);
        }
      } catch (e) {}

      onLoginSuccess(resData.session);
    } catch (err) {
      console.error('Erreur lors de la vérification employé:', err);
      setEmployeeError("Code PIN ou mot de passe incorrect.");
    } finally {
      setIsEmployeeSubmitting(false);
    }
  };

  // Quick direct credentials shortcuts
  const directBypassLogin = async (demoEmail: string, demoPass: string) => {
    try {
      const response = await fetch('/api/auth/direct-bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          password: demoPass
        })
      });

      if (response.ok) {
        const resData = await response.json();
        onLoginSuccess(resData.session);
      }
    } catch (err) {
      console.error('Bypass failed:', err);
    }
  };

  const handleVerifyPromptPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromptError('');

    if (!passwordPromptAccount) return;

    try {
      const response = await fetch('/api/auth/verify-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: passwordPromptAccount.id,
          password: promptPasswordInput,
          trialProspectPassword: trialProspect?.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setPromptError(errorData.error || "Mot de passe incorrect.");
        return;
      }

      const resData = await response.json();
      onLoginSuccess(resData.session);
      setPasswordPromptAccount(null);
      setPromptPasswordInput('');
    } catch (err) {
      console.error('Prompt error:', err);
      setPromptError("Erreur lors de la vérification de sécurité.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black select-none relative">
      
      {onBackToLanding && (
        <div className="absolute top-6 left-6 z-50">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition duration-200 bg-slate-800/40 hover:bg-slate-850 border border-slate-750/70 p-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer font-sans"
          >
            ← Retour à l'accueil
          </button>
        </div>
      )}
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <ElyssaLogo className="mx-auto w-14 h-14 rounded-2xl shadow-xl shadow-indigo-600/20 border border-indigo-500/30" />
        <h2 className="mt-6 text-2xl font-black tracking-tight text-white font-sans sm:text-3xl">
          Elyssa ERP
        </h2>
        <p className="mt-2 text-xs text-slate-400 font-mono tracking-wider uppercase">
          Portail d'Accès Sécurisé CRM Multi-Postes
        </p>


      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-850/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-750/70 sm:px-10">
          
          {/* ================= URL ACTIONS: EMAIL CONFIRMATION ================= */}
          {actionState.action === 'confirm_email' && (
            <div className="space-y-6 text-center py-4">
              {actionState.status === 'loading' && (
                <div className="flex flex-col items-center justify-center space-y-4 font-sans">
                  <RotateCw className="w-12 h-12 text-indigo-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-200">{actionState.message}</p>
                </div>
              )}

              {actionState.status === 'success' && (
                <div className="space-y-4 font-sans">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">E-mail Confirmé !</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{actionState.message}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActionState({ action: 'none', token: '', email: '', status: 'idle', message: '' });
                      setStep('enterprise');
                    }}
                    className="mt-2 w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase transition duration-150"
                  >
                    Aller à la Connexion →
                  </button>
                </div>
              )}

              {actionState.status === 'error' && (
                <div className="space-y-4 font-sans">
                  <div className="mx-auto h-12 w-12 rounded-full bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Échec de Validation</h3>
                  <p className="text-xs text-red-200 leading-relaxed bg-red-950/20 p-3 rounded-xl border border-red-900/30">{actionState.message}</p>
                  
                  {actionState.email && (
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isResending}
                        onClick={() => handleResendConfirmation(actionState.email)}
                        className="text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition underline cursor-pointer"
                      >
                        {isResending ? "Renvoi en cours..." : "Renvoyer l'e-mail d'activation →"}
                      </button>
                      {resendMessage && (
                        <p className="text-[10.5px] text-emerald-400 font-bold mt-2">{resendMessage}</p>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActionState({ action: 'none', token: '', email: '', status: 'idle', message: '' });
                      setStep('enterprise');
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase transition duration-150 mt-4"
                  >
                    Retourner à la page d'accueil
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= URL ACTIONS: RESET PASSWORD ================= */}
          {actionState.action === 'reset_password' && (
            <div className="space-y-6">
              <div className="text-center space-y-1 font-sans">
                <div className="inline-flex py-1 px-3 bg-red-950/60 border border-red-900 text-red-400 rounded-full text-[10px] uppercase font-black tracking-wider leading-none">
                  Nouveau Mot de Passe
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider pt-2">Réinitialisation</h3>
                <p className="text-[10.5px] text-slate-400 leading-normal">
                  Saisissez le nouveau mot de passe global d'entreprise pour le compte <strong>{actionState.email}</strong>.
                </p>
              </div>

              {resetError && (
                <div className="bg-red-950/50 border border-red-500/40 text-red-100 p-3 rounded-xl text-xs flex items-start gap-2.5 animate-pulse font-sans">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-100 p-3 rounded-xl text-xs flex flex-col gap-3 font-sans">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{resetSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActionState({ action: 'none', token: '', email: '', status: 'idle', message: '' });
                      setStep('enterprise');
                    }}
                    className="w-full py-2 bg-emerald-550 text-slate-950 hover:bg-emerald-450 font-black text-[10px] uppercase tracking-wider rounded-lg transition duration-150"
                  >
                    Me connecter maintenant →
                  </button>
                </div>
              )}

              {!resetSuccess && (
                <form className="space-y-4" onSubmit={handleResetPasswordSubmit}>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                      Nouveau Mot de Passe Global
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPasswordInput}
                        onChange={(e) => {
                          setNewPasswordInput(e.target.value);
                          setResetError('');
                        }}
                        placeholder="Min. 4 caractères"
                        className="block w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                      Confirmer le Mot de Passe
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPasswordInput}
                        onChange={(e) => {
                          setConfirmPasswordInput(e.target.value);
                          setResetError('');
                        }}
                        placeholder="Confirmez le mot de passe"
                        className="block w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActionState({ action: 'none', token: '', email: '', status: 'idle', message: '' });
                        setStep('enterprise');
                      }}
                      className="w-1/2 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition duration-150"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-red-600 hover:bg-red-550 text-white rounded-xl text-[10px] font-black uppercase transition duration-150"
                    >
                      Sauvegarder
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= STAGE 1.5: FORGOT PASSWORD REQUEST ================= */}
          {actionState.action === 'none' && step === 'forgot_password' && (
            <div className="space-y-6">
              <div className="text-center space-y-1 font-sans">
                <div className="inline-flex py-1 px-3 bg-indigo-950/60 border border-indigo-900 text-indigo-400 rounded-full text-[10px] uppercase font-black tracking-wider leading-none">
                  Mot de Passe Oublié
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider pt-2">Renouvellement d'Accès</h3>
                <p className="text-[10.5px] text-slate-400 leading-normal">
                  Renseignez l'adresse e-mail enregistrée de votre entreprise. Un lien de renouvellement sécurisé vous sera envoyé.
                </p>
              </div>

              {forgotError && (
                <div className="bg-red-950/50 border border-red-500/40 text-red-100 p-3 rounded-xl text-xs flex items-start gap-2.5 animate-pulse font-sans">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-100 p-3 rounded-xl text-xs flex flex-col gap-3 font-sans">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{forgotSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('enterprise')}
                    className="w-full py-2 bg-emerald-550 text-slate-950 hover:bg-emerald-450 font-black text-[10px] uppercase tracking-wider rounded-lg transition duration-150"
                  >
                    Retourner à la Connexion →
                  </button>
                </div>
              )}

              {!forgotSuccess && (
                <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                      Adresse e-mail de l'entreprise
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmailInput}
                        onChange={(e) => {
                          setForgotEmailInput(e.target.value);
                          setForgotError('');
                        }}
                        placeholder="ex: contact@entreprise.tn"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono text-left"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={isForgotSending}
                      onClick={() => {
                        setStep('enterprise');
                        setForgotError('');
                        setForgotSuccess('');
                      }}
                      className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-[10.5px] font-black uppercase transition duration-150"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotSending}
                      className="w-1/2 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10.5px] font-black uppercase transition duration-150 disabled:opacity-50"
                    >
                      {isForgotSending ? "Envoi..." : "Envoyer l'E-mail →"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          
          {/* ================= STAGE 1: ENTERPRISE ACCESS ================= */}
          {actionState.action === 'none' && step === 'enterprise' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <div className="inline-flex py-1 px-3 bg-indigo-950/60 border border-indigo-900 text-indigo-400 rounded-full text-[10px] uppercase font-black tracking-wider leading-none font-sans">
                  Étape 1 : Authentification Entreprise
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider pt-2 font-sans">Espace Commun de Connexion</h3>
                <p className="text-[10.5px] text-slate-400 leading-normal font-sans">
                  Veuillez renseigner le compte universel de votre entreprise pour lister les profils d'accès.
                </p>
              </div>

              {enterpriseError && (
                <div className="bg-red-950/50 border border-red-500/40 text-red-100 p-3 rounded-xl text-xs flex flex-col gap-2 animate-pulse font-sans">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{enterpriseError}</span>
                  </div>
                  {unconfirmedEmail && (
                    <div className="mt-1 pt-2 border-t border-red-900/40 flex flex-col gap-1 text-left">
                      <p className="text-[10px] text-slate-400 font-medium">Vous n'avez pas reçu le lien d'activation ?</p>
                      <button
                        type="button"
                        disabled={isResending}
                        onClick={() => handleResendConfirmation(unconfirmedEmail)}
                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition text-left cursor-pointer underline disabled:opacity-50"
                      >
                        {isResending ? "Renvoi en cours..." : "Renvoyer l'e-mail de confirmation →"}
                      </button>
                      {resendMessage && (
                        <p className="text-[10px] text-emerald-400 font-bold mt-1">{resendMessage}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleEnterpriseSubmit}>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                    Adresse e-mail commune / de domaine
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={enterpriseEmail}
                      onChange={(e) => {
                        setEnterpriseEmail(e.target.value);
                        setEnterpriseError('');
                      }}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 font-mono transition-all font-bold text-left"
                      placeholder="ex: contact@elyssa.pro"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">
                      Mot de passe global d'entreprise
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('forgot_password');
                        setForgotError('');
                        setForgotSuccess('');
                      }}
                      className="text-[9.5px] font-bold text-indigo-400 hover:text-indigo-300 transition underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showEnterprisePassword ? "text" : "password"}
                      required
                      value={enterprisePassword}
                      onChange={(e) => {
                        setEnterprisePassword(e.target.value);
                        setEnterpriseError('');
                      }}
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-left font-mono"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEnterprisePassword(!showEnterprisePassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors"
                    >
                      {showEnterprisePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-black text-white bg-indigo-650 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all uppercase tracking-wider text-center font-sans"
                  >
                    Valider l'Accès Entreprise →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= STEP: CREATE COMPANY ================= */}
          {step === 'create_company' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <div className="inline-flex py-1 px-3 bg-violet-950/60 border border-violet-900 text-violet-400 rounded-full text-[10px] uppercase font-black tracking-wider leading-none font-sans">
                  Configuration Multi-Tenant Strict
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider pt-2 font-sans">
                  Création de votre Entreprise
                </h3>
                <p className="text-[10.5px] text-slate-400 leading-normal font-sans">
                  Votre profil n'est rattaché à aucune entreprise active. Veuillez initialiser votre entreprise ci-dessous.
                </p>
              </div>

              {createCompanyError && (
                <div className="bg-red-950/50 border border-red-500/40 text-red-100 p-3 rounded-xl text-xs flex items-start gap-2.5 animate-pulse font-sans">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{createCompanyError}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleCreateCompanySubmit}>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                    Nom de votre Entreprise
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={createCompanyName}
                      onChange={(e) => {
                        setCreateCompanyName(e.target.value);
                        setCreateCompanyError('');
                      }}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 font-sans font-bold text-left"
                      placeholder="ex: Ma Super Entreprise S.A."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                    Mot de passe de l'Entreprise
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={createCompanyPassword}
                      onChange={(e) => {
                        setCreateCompanyPassword(e.target.value);
                        setCreateCompanyError('');
                      }}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-left font-mono"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('enterprise')}
                    className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-[10.5px] font-black uppercase transition duration-150"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCompany}
                    className="w-1/2 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10.5px] font-black uppercase transition duration-150 disabled:opacity-50"
                  >
                    {isCreatingCompany ? "Création..." : "Créer & Se Connecter →"}
                  </button>
                </div>
              </form>
            </div>
          )}


          {/* ================= STAGE 2: COLLABORATOR PROFILE SELECTION ("liste à ascenseur") ================= */}
          {step === 'collaborator_selection' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="inline-flex py-1 px-3 bg-emerald-950/60 border border-emerald-900 text-emerald-400 rounded-full text-[10px] uppercase font-black tracking-wider leading-none font-sans">
                  Étape 2 : Choix du Collaborateur
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider pt-2 font-sans">{selectedCompany}</h3>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  Chaque collaborateur travaille sur un poste différent. Veuillez choisir votre compte dans la liste ci-dessous.
                </p>
              </div>

              {/* Internal Search Bar to filter list easily */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher par nom ou rôle..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-[11px] placeholder-slate-550 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* LIST WITH SCROLLBAR ("liste à ascenseur") */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 rounded-xl border border-slate-800 bg-slate-950/30 p-2 scrollbar-thin scrollbar-thumb-slate-800">
                {getCompanyEmployees().length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-[11px] font-sans">
                    Aucun collaborateur trouvé pour ce filtre de recherche.
                  </div>
                ) : (
                  getCompanyEmployees().map((emp) => {
                    let avatarColor = 'bg-indigo-600/15 text-indigo-400 border-indigo-500/20';
                    if (emp.role === 'Manager') avatarColor = 'bg-purple-600/15 text-purple-400 border-purple-500/20';
                    if (emp.role === 'Director') avatarColor = 'bg-amber-600/15 text-amber-400 border-amber-500/20';
                    if (emp.role === 'Agent') avatarColor = 'bg-rose-600/15 text-rose-400 border-rose-500/20';

                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectProfile(emp)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-800/65 hover:bg-slate-750/70 border border-slate-700/70 hover:border-indigo-500/40 text-slate-300 hover:text-white transition flex items-center justify-between text-[11.5px] cursor-pointer font-sans"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${avatarColor}`}>
                            {emp.name.split(' ').map(n=>n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold block text-white leading-tight">{emp.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{emp.email}</span>
                          </div>
                        </div>
                        <span className={`text-[8.5px] font-bold p-0.5 px-2 rounded-md uppercase border ${
                          emp.role === 'Manager' ? 'bg-purple-950/60 border-purple-800 text-purple-300' :
                          emp.role === 'Director' ? 'bg-amber-950/60 border-amber-800 text-amber-300' :
                          emp.role === 'Agent' ? 'bg-rose-950/60 border-rose-800 text-rose-300' :
                          'bg-slate-900 border-slate-700 text-slate-300'
                        }`}>
                          {emp.role === 'Manager' ? 'DG / Dirigeant' : emp.role === 'Director' ? 'Directeur' : emp.role === 'Agent' ? 'Collaborateur' : 'Observateur'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep('enterprise')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition duration-200 font-sans"
                >
                  ← Changer de compte entreprise
                </button>
              </div>
            </div>
          )}


          {/* ================= STAGE 3: INDIVIDUAL PASSWORD VERIFICATION ================= */}
          {step === 'collaborator_password' && selectedProfile && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <div className="inline-flex py-1 px-3 bg-purple-950/60 border border-purple-900 text-purple-400 rounded-full text-[10px] uppercase font-black tracking-wider leading-none font-sans">
                  Étape 3 : Saisie du Mot de Passe
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider pt-2 font-sans font-black">S'authentifier en tant que</h3>
              </div>

              {/* Profile details preview card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center font-black text-sm">
                  {selectedProfile.name.split(' ').map(n=>n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-xs block leading-none">{selectedProfile.name}</span>
                    <span className="text-[8.5px] font-bold p-0.5 px-1.5 bg-slate-900 rounded text-slate-400 uppercase">
                      {selectedProfile.role === 'Manager' ? 'DG / Dirigeant' : selectedProfile.role === 'Director' ? 'Directeur' : selectedProfile.role === 'Agent' ? 'Collaborateur' : 'Observateur'}
                    </span>
                  </div>
                  <span className="text-slate-500 block font-mono text-[10px] mt-1 leading-none">
                    {selectedProfile.email}
                  </span>
                  <span className="text-[9.5px] text-indigo-400 font-semibold block mt-1.5 leading-none font-sans">
                    🏢 {selectedCompany}
                  </span>
                </div>
              </div>

              {employeeError && (
                <div className="bg-red-950/60 border border-red-500/40 text-red-200 p-2.5 rounded-xl text-xs font-sans">
                  {employeeError}
                </div>
              )}

              <form onSubmit={handleEmployeePasswordSubmit} className="space-y-4 font-semibold">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 font-sans tracking-wider text-center">
                    Saisissez votre code PIN (6 chiffres) ou mot de passe d'entreprise
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 border-0">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showEmployeePassword ? "text" : "password"}
                      required
                      value={employeePassword}
                      onChange={(e) => {
                        setEmployeePassword(e.target.value);
                        setEmployeeError('');
                      }}
                      autoFocus
                      placeholder="Code PIN ou Mot de Passe"
                      className="w-full bg-slate-800 text-white rounded-xl border border-slate-700 p-2.5 text-sm font-black focus:outline-none focus:border-indigo-500 font-mono text-center pl-10 pr-10 tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors"
                    >
                      {showEmployeePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isEmployeeSubmitting}
                    onClick={() => {
                      setStep('collaborator_selection');
                      setEmployeePassword('');
                      setEmployeeError('');
                    }}
                    className="w-1/2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-[10.5px] font-black uppercase py-2.5 transition cursor-pointer font-sans border-0 disabled:opacity-50"
                  >
                    ← Changer profil
                  </button>
                  <button
                    type="submit"
                    disabled={isEmployeeSubmitting}
                    className="w-1/2 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-[10.5px] font-black uppercase py-2.5 transition cursor-pointer border-0 shadow-sm font-sans flex items-center justify-center gap-2"
                  >
                    {isEmployeeSubmitting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Validation...</span>
                      </>
                    ) : (
                      <span>Valider la Session</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}


          {/* ================= CHIFFREMENT STATUS ================= */}
          <div className="mt-8 pt-6 border-t border-slate-750/70 text-center">
            <div 
              className="flex items-center justify-center gap-1.5 bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/30 font-sans select-none"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
              <span className="text-[9.5px] font-bold text-slate-300 uppercase tracking-widest leading-none font-sans">
                Portail Sécurisé • Chiffrement de Session Actif (AES-256)
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 🔐 PASSWORD AUDIT VERIFICATION MODAL */}
      {passwordPromptAccount && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 text-left">
            <div className="text-center space-y-1">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-sans">
                <Lock className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans pt-2">Sécurisation d'Accès Collaborateur</h3>
              <p className="text-[10px] text-slate-400 font-medium">Saisissez le mot de passe de votre profil d'audit pour accéder à {passwordPromptAccount.company || 'votre espace'}.</p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center space-x-2 text-[10.5px]">
              <div className="w-5 h-5 rounded-md bg-emerald-950/85 text-emerald-400 flex items-center justify-center font-bold text-[9px] font-sans">
                {passwordPromptAccount.initials}
              </div>
              <div>
                <span className="font-extrabold text-white block leading-none">{passwordPromptAccount.name}</span>
                <span className="text-slate-500 block font-mono leading-none mt-0.5 text-[9.5px]">{passwordPromptAccount.email}</span>
              </div>
            </div>

            <form onSubmit={handleVerifyPromptPassword} className="space-y-4 font-semibold font-sans">
              {promptError && (
                <div className="bg-red-950/60 border border-red-500/40 text-red-200 p-2 rounded-xl text-[10px]">
                  {promptError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 block pb-1">Mot d'Accès Individuel</label>
                <input
                  type="password"
                  value={promptPasswordInput}
                  onChange={(e) => { setPromptPasswordInput(e.target.value); setPromptError(''); }}
                  required
                  placeholder="Saisissez le mot de passe"
                  className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500 font-mono text-center tracking-widest"
                />
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => { setPasswordPromptAccount(null); setPromptPasswordInput(''); setPromptError(''); }}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black py-2.5 transition cursor-pointer border-0"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-650 hover:bg-emerald-550 text-white rounded-xl text-[10px] font-black py-2.5 transition cursor-pointer border-0 shadow-sm"
                  style={{ backgroundColor: '#10b981', color: '#090d16' }}
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔐 PASSWORD BYPASS CONSOLE ACCESS UNLOCK MODAL */}
      {showUnlockBypassModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 text-left">
            <div className="text-center space-y-1">
              <div className="mx-auto h-12 w-12 rounded-full bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-sans">
                <Lock className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans pt-2">Déverrouillage Console d'Audit</h3>
              <p className="text-[10px] text-slate-400 font-medium">Saisissez le code secret d'administration Elyssa pour activer les raccourcis d'accès direct.</p>
            </div>

            <form onSubmit={handleVerifyUnlockBypass} className="space-y-4 font-semibold font-sans">
              {unlockError && (
                <div className="bg-red-950/60 border border-red-500/40 text-red-200 p-2.5 rounded-xl text-[10px]">
                  {unlockError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 block pb-1">Code Secret Administrateur</label>
                <input
                  type="password"
                  value={unlockPasswordInput}
                  onChange={(e) => { setUnlockPasswordInput(e.target.value); setUnlockError(''); }}
                  required
                  placeholder="Saisissez le code secret"
                  className="w-full bg-slate-950 text-white rounded-xl border border-slate-800 p-2.5 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono text-center tracking-widest"
                />
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => { setShowUnlockBypassModal(false); setUnlockPasswordInput(''); setUnlockError(''); }}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-[10px] font-black py-2.5 transition cursor-pointer border-0"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black py-2.5 transition cursor-pointer border-0 shadow-sm"
                >
                  Déverrouiller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
