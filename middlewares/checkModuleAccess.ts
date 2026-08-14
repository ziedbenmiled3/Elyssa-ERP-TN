import { Request, Response, NextFunction } from 'express';

export interface EnterpriseContext {
  companyId: string;
  subscriptions: string[]; // Active modules e.g., ['FINANCE_BILLING', 'STOCKS_FOURNISSEURS', 'COMMUNICATION_HUB']
}

declare global {
  namespace Express {
    interface Request {
      enterpriseContext?: EnterpriseContext;
    }
  }
}

/**
 * Middleware to check commercial subscriptions and their critical dependencies.
 * @param requestedModule The name of the module being accessed (e.g., 'PRODUCTION_GPAO')
 * @param hardDependencies Hard dependencies absolutely required to run this module
 */
export function checkModuleAccess(requestedModule: string, hardDependencies: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Resolve enterprise context (typically set by upstream session/token authentication)
    const context = req.enterpriseContext;

    if (!context) {
      return res.status(401).json({
        error: 'Unauthorized_Context',
        message: 'Contexte entreprise introuvable. Veuillez vous authentifier.'
      });
    }

    const { subscriptions = [] } = context;

    // 1. Check if the target requested module is active in subscriptions
    const isSubscribed = subscriptions.includes(requestedModule);
    if (!isSubscribed) {
      return res.status(403).json({
        error: 'Feature_Locked',
        module: requestedModule,
        message: `Le module '${requestedModule}' n'est pas actif dans votre offre Elyssa ERP. Veuillez ajuster vos abonnements.`
      });
    }

    // 2. Verify that all critical (hard) dependencies of the requested module are subscribed
    const missingDeps = hardDependencies.filter(dep => !subscriptions.includes(dep));
    if (missingDeps.length > 0) {
      return res.status(422).json({
        error: 'Missing_Hard_Dependency',
        requestedModule,
        missing: missingDeps,
        message: `Impossible de charger le module '${requestedModule}'. Les modules requis suivants sont manquants : ${missingDeps.join(', ')}.`
      });
    }

    next();
  };
}
