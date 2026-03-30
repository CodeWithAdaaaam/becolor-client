// src/config/permissions.ts

export type Role = 'SUPERADMIN' | 'RECEPTIONIST' | 'COIFFEUR' | 'ONGLERIE' | 'ESTHETICIENNE';

// Pages autorisées pour tout le personnel (non-admins)
const STAFF_PATHS = [
  '/dashboard/agenda',
  '/dashboard/appointments',
  '/dashboard/clients',
  '/dashboard/caisse',
  '/dashboard/history'
];

// Configuration des accès
const PERMISSIONS: Record<Role, string[]> = {
  SUPERADMIN: ['*'], // '*' signifie accès total
  RECEPTIONIST: STAFF_PATHS,
  COIFFEUR: STAFF_PATHS,
  ONGLERIE: STAFF_PATHS,
  ESTHETICIENNE: STAFF_PATHS,
};

export const hasPermission = (userRoles: Role[], path: string): boolean => {
  if (!userRoles || !Array.isArray(userRoles)) return false;

  // 1. Si SUPERADMIN est présent, accès immédiat
  if (userRoles.includes('SUPERADMIN')) return true;

  // 2. Nettoyage du path (on enlève la locale /fr ou /ar)
  const cleanPath = path.replace(/^\/(fr|ar)/, '') || '/';

  // 3. On vérifie si l'un des rôles de l'utilisateur permet d'accéder à ce chemin
  return userRoles.some(role => {
    const allowedPaths = PERMISSIONS[role] || [];
    // On vérifie si le chemin actuel commence par l'un des chemins autorisés
    return allowedPaths.some(allowedPath => cleanPath.startsWith(allowedPath));
  });
};