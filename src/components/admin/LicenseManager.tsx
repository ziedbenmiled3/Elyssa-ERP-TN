import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  Building2, 
  Sparkles,
  Lock,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { TenantSubscription, FieldAgentLicense } from '../../types/mobileTerrain';
import { MobileLicenseService } from '../../services/mobileLicenseService';
import { CollaboratorAccount } from '../../types';

interface LicenseManagerProps {
  tenantId?: string;
  activeCompanyName?: string;
  collaborators?: CollaboratorAccount[];
  onNavigateToStore?: () => void;
  isTrial?: boolean;
  isDemoTenant?: boolean;
}

/**
 * Composant LicenseManager - Affectation et gestion des Licences Terrain (PWA Mobile MOD-11)
 * Contrôle rigoureusement les quotas de souscription maxFieldAgents et bloque tout dépassement.
 */
export const LicenseManager: React.FC<LicenseManagerProps> = ({
  tenantId = 'Inter-Affaires',
  activeCompanyName,
  collaborators = [],
  onNavigateToStore,
  isTrial = true,
  isDemoTenant
}) => {
  // Détermination stricte du mode DÉMO vs PROD
  const isDemo = Boolean(
    isDemoTenant ||
    tenantId === 'company_demo' ||
    tenantId?.toLowerCase().includes('démo') ||
    tenantId?.toLowerCase().includes('demo') ||
    activeCompanyName?.toLowerCase().includes('démo') ||
    activeCompanyName?.toLowerCase().includes('demo')
  );

  // États locaux
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [agents, setAgents] = useState<FieldAgentLicense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  
  // Gestion des erreurs / alertes
  const [quotaAlert, setQuotaAlert] = useState<{ show: boolean; message: string; blockedAgentName?: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal d'ajout rapide de licences
  const [showAddSeatModal, setShowAddSeatModal] = useState<boolean>(false);
  const [extraSeatsCount, setExtraSeatsCount] = useState<number>(1);

  // Chargement des données
  const loadData = async () => {
    setLoading(true);
    try {
      const sub = await MobileLicenseService.getTenantSubscription(tenantId, isDemo);
      const agList = await MobileLicenseService.getTenantFieldAgents(tenantId, isDemo, collaborators);
      setSubscription(sub);
      setAgents(agList);
    } catch (err) {
      console.error('[LicenseManager] Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId, isDemo, collaborators]);

  if (loading || !subscription) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-3" />
        <span>Chargement du gestionnaire de licences terrain...</span>
      </div>
    );
  }

  // Calculs des quotas
  const activeLicensedAgents = agents.filter(a => a.hasMobileLicense);
  const activeCount = activeLicensedAgents.length;
  const maxQuota = subscription.quotas.maxFieldAgents;
  const isQuotaReached = activeCount >= maxQuota;
  const quotaPercentage = Math.min(100, Math.round((activeCount / Math.max(1, maxQuota)) * 100));

  // Extrait la liste unique des départements
  const departments = ['ALL', ...Array.from(new Set(agents.map(a => a.department).filter(Boolean)))];

  // Filtrage des collaborateurs
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || agent.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Action : Bascule de l'interrupteur (Toggle)
  const handleToggleLicense = async (agent: FieldAgentLicense) => {
    const targetState = !agent.hasMobileLicense;

    // Masquer les alertes précédentes
    setQuotaAlert(null);

    // Blocage strict si tentative d'activation et quota max atteint
    if (targetState && activeCount >= maxQuota) {
      setQuotaAlert({
        show: true,
        message: `Quota d'agents terrain atteint (${activeCount}/${maxQuota} licences attribuées). Vous devez souscrire des licences supplémentaires pour autoriser ${agent.agentName}.`,
        blockedAgentName: agent.agentName
      });
      return;
    }

    // Exécution de la modification
    const result = await MobileLicenseService.toggleAgentLicense(
      tenantId,
      agent.agentId,
      targetState,
      subscription,
      agents
    );

    if (result.success && result.updatedAgents) {
      setAgents(result.updatedAgents);
      setToastMessage(result.message);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setQuotaAlert({
        show: true,
        message: result.message,
        blockedAgentName: agent.agentName
      });
    }
  };

  // Ajout de sièges supplémentaires
  const handleAddSeatsConfirm = async () => {
    const updatedSub = await MobileLicenseService.addExtraSeats(tenantId, extraSeatsCount, subscription);
    setSubscription(updatedSub);
    setShowAddSeatModal(false);
    setQuotaAlert(null);
    setToastMessage(`Nouveau quota validé ! +${extraSeatsCount} licence(s) ajoutée(s). Quota total : ${updatedSub.quotas.maxFieldAgents} agents.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            &times;
          </button>
        </div>
      )}

      {/* ALERTE BLOQUANTE SI QUOTA DÉPASSÉ / ATTEINT */}
      {quotaAlert && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/40 rounded-2xl text-amber-200 space-y-3 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-amber-300 text-base flex items-center gap-2">
                  <span>Quota de Licences Terrain Atteint</span>
                  {quotaAlert.blockedAgentName && (
                    <span className="text-xs font-normal px-2 py-0.5 bg-amber-500/20 text-amber-200 rounded border border-amber-500/30">
                      Blocage : {quotaAlert.blockedAgentName}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {quotaAlert.message}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setQuotaAlert(null)}
              className="text-amber-400 hover:text-amber-100 p-1"
            >
              &times;
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-amber-500/20">
            <button
              onClick={() => setShowAddSeatModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Acheter des licences supplémentaires (39 TND/mois)</span>
            </button>

            {onNavigateToStore && (
              <button
                onClick={onNavigateToStore}
                className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center gap-1.5"
              >
                <span>Consulter le Module Store</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* EN-TÊTE DU GESTIONNAIRE DE LICENCES & JAUGE D'UTILISATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Résumé de la Licence & Tenant */}
        <div className="lg:col-span-2 p-6 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Affectation des Licences Agents Terrain
                </h3>
                <p className="text-xs text-slate-400">
                  Attribuez les accès à l'application PWA Mobile Terrain (MOD-11) aux collaborateurs RH.
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              title="Rafraîchir les licences"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Baromètre / Jauge de Quota */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                Utilisation des Licences Terrain :
              </span>
              <span className="font-bold text-white">
                <strong className={isQuotaReached ? "text-amber-400 font-black" : "text-emerald-400 font-bold"}>
                  {activeCount}
                </strong> / {maxQuota} licences actives ({quotaPercentage}%)
              </span>
            </div>

            {/* Barre de progression avec code couleur */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  quotaPercentage >= 100 
                    ? 'bg-amber-500' 
                    : quotaPercentage >= 80 
                      ? 'bg-amber-400' 
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>{Math.max(0, maxQuota - activeCount)} licence(s) disponible(s)</span>
              <span>
                {isTrial || subscription.plan === 'TRIAL' || tenantId === 'MD' ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Offre : ÉVALUATION ILLIMITÉE (5 licences terrain test incluses)
                  </span>
                ) : (
                  `Offre : ${subscription.plan} (${subscription.addOnPricing.pricePerExtraFieldAgent} TND/mois/agent sup)`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Carte d'Achat Rapide de Seats */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950/60 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Besoin de plus d'agents ?</span>
            </div>
            <h4 className="font-bold text-white text-base">Ajoutez des licences en 1 clic</h4>
            <p className="text-xs text-slate-400">
              Chaque licence donne accès à l'application PWA terrain, la géolocalisation GPS et le contrôle biométrique IA.
            </p>
          </div>

          <button
            onClick={() => setShowAddSeatModal(true)}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter des Licences (+39 TND)</span>
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE ET FILTRES */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Champ de recherche */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou rôle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filtre par Département */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 shrink-0">Département :</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'Tous les départements' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLEAU / LISTE DES EMPLOYÉS ET INTERRUPTEURS DE LICENCE */}
      <div className="overflow-hidden bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Collaborateur / Agent</th>
                <th className="py-4 px-6">Département & Rôle</th>
                <th className="py-4 px-6 text-center">Accès Mobile Terrain (MOD-11)</th>
                <th className="py-4 px-6 text-right">Statut Licence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-slate-800/80 rounded-full text-slate-400 border border-slate-700">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-200">
                        {agents.length === 0 
                          ? "Aucun collaborateur enregistré pour ce compte"
                          : "Aucun collaborateur trouvé pour ce filtre"
                        }
                      </p>
                      <p className="text-xs text-slate-500 max-w-md">
                        {agents.length === 0 
                          ? "Rendez-vous dans la section Gestion des Collaborateurs pour ajouter des salariés réels à votre organisation avant d'activer leurs licences PWA Mobile Terrain (MOD-11)."
                          : "Modifiez vos critères de recherche ou sélectionnez un autre département pour afficher les agents."
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAgents.map(agent => {
                  const isLicensed = agent.hasMobileLicense;

                  return (
                    <tr 
                      key={agent.agentId}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isLicensed ? 'bg-indigo-950/10' : ''
                      }`}
                    >
                      {/* Nom & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${
                            isLicensed 
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {agent.agentName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                              <span>{agent.agentName}</span>
                              {agent.agentId === 'demo-emp_4' || agent.agentName.toLowerCase().includes('mohamed ali') ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                  Force de Vente / Van Sales
                                </span>
                              ) : agent.agentId === 'demo-emp_7' || agent.agentName.toLowerCase().includes('hamza ben salem') ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                                  Logistique & Expéditions
                                </span>
                              ) : null}
                              {isLicensed && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  PWA Active
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{agent.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Rôle & Département */}
                      <td className="py-4 px-6">
                        <div className="text-slate-200 font-medium">{agent.role}</div>
                        <div className="text-xs text-slate-400">{agent.department}</div>
                      </td>

                      {/* TOGGLE SWITCH : INTERRUPTEUR D'ACTIVATION DES LICENCES TERRAIN */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleLicense(agent)}
                            className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isLicensed ? 'bg-indigo-600' : 'bg-slate-700'
                            }`}
                            aria-label={`Bascule licence pour ${agent.agentName}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isLicensed ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Statut & Date d'attribution */}
                      <td className="py-4 px-6 text-right">
                        {isLicensed ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <UserCheck className="w-3.5 h-3.5" />
                              Licence Active
                            </span>
                            {agent.assignedAt && (
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                Depuis : {agent.assignedAt}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <UserX className="w-3.5 h-3.5" />
                            Non attribué
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL D'AJOUT RAPIDE DE SEATS */}
      {showAddSeatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Acheter des Licences Terrain
              </h3>
              <button 
                onClick={() => setShowAddSeatModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p className="text-xs text-slate-400">
                Ajustez le nombre d'agents terrain pouvant utiliser l'application PWA simultanément.
              </p>

              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={() => setExtraSeatsCount(Math.max(1, extraSeatsCount - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold hover:bg-slate-700"
                >
                  -
                </button>
                <div className="text-2xl font-black text-amber-400 px-4">
                  +{extraSeatsCount}
                </div>
                <button
                  onClick={() => setExtraSeatsCount(extraSeatsCount + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold hover:bg-slate-700"
                >
                  +
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nouveau quota total :</span>
                  <strong className="text-white">{maxQuota + extraSeatsCount} agents</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coût mensuel additionnel :</span>
                  <strong className="text-amber-400">{(extraSeatsCount * 39).toFixed(0)} TND / mois HT</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddSeatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAddSeatsConfirm}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
              >
                Confirmer l'ajout (+{extraSeatsCount} seat)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
