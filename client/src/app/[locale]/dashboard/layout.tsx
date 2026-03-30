'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Settings, LogOut, 
  Menu, X, Briefcase, Wallet, BarChart3, ClipboardList, ChevronRight, Truck, History
} from 'lucide-react';
import { clsx } from 'clsx';
import { hasPermission, Role } from '@/config/permissions';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

// --- INTERFACES MODIFIÉES ---
interface User { nom: string; prenom: string; roles: Role[]; } // <--- roles au pluriel (tableau)
interface NavItem { name: string; href: string; icon: React.ElementType; }

// --- CONTENU DU MENU (Commun Mobile/Desktop) ---
function SidebarContent({ navItems, user, pathname, handleLogout, closeSidebar }: {
    navItems: NavItem[]; user: User; pathname: string;
    handleLogout: () => void; closeSidebar: () => void;
}) {
    const t = useTranslations('Sidebar');
    const t_page_team = useTranslations('TeamPage.roles'); // Pour traduire les noms des rôles

    return (
        <div className="flex flex-col h-full bg-white text-gray-900">
            {/* EN-TÊTE SIDEBAR */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-black">be COLOR</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{t('subtitle')}</p>
                </div>
                <button onClick={closeSidebar} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                </button>
            </div>

            {/* NAVIGATION SCROLLABLE */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.endsWith(item.href) || (item.href !== '/dashboard' && pathname.includes(item.href));
                    
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href} 
                            onClick={closeSidebar}
                            className={clsx(
                                'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                                isActive 
                                    ? 'bg-black text-white shadow-md shadow-gray-200' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                            )}
                        >
                            <Icon size={20} className={clsx("transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-black")} />
                            <span className="flex-1">{item.name}</span>
                            {isActive && <ChevronRight size={16} className="text-gray-500 opacity-50"/>}
                        </Link>
                    );
                })}
            </nav>

            {/* PIED DE PAGE SIDEBAR (LANGUE + PROFIL) */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <LanguageSwitcher />
                </div>

                <div className="flex items-center gap-3 px-2 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {user.prenom ? user.prenom.charAt(0) : 'U'}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.prenom} {user.nom}</p>
                        {/* AFFICHAGE MULTI-RÔLES TRADUITS */}
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">
                            {user.roles?.map(r => t_page_team(r)).join(' / ')}
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all"
                >
                    <LogOut size={18} /> {t('logout')}
                </button>
            </div>
        </div>
    );
}

// --- LAYOUT PRINCIPAL RESPONSIVE ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const t = useTranslations('Sidebar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
          router.push('/login');
        } else {
          try {
              const parsedUser = JSON.parse(userData);
              
              // NORMALISATION : On s'assure que 'roles' est un tableau, même si c'est l'ancien format 'role'
              const normalizedRoles = parsedUser.roles || (parsedUser.role ? [parsedUser.role] : []);
              
              setUser({
                  ...parsedUser,
                  roles: normalizedRoles
              });
              
              const cleanPath = pathname.replace(/^\/(fr|ar)/, '') || '/';
              
              // Vérification de permission avec le tableau de rôles
              if (!hasPermission(normalizedRoles, cleanPath)) {
                // Redirection si accès refusé
              }
          } catch (e) {
              console.error("Erreur parsing user", e);
              router.push('/login');
          }
        }
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const allNavItems: NavItem[] = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('agenda'), href: '/dashboard/agenda', icon: Calendar },
    { name: t('appointments'), href: '/dashboard/appointments', icon: ClipboardList },
    { name: t('clients'), href: '/dashboard/clients', icon: Users },
    { name: t('caisse'), href: '/dashboard/caisse', icon: Wallet },
    { name: t('stats'), href: '/dashboard/stats', icon: BarChart3 },
    { name: t('services'), href: '/dashboard/services', icon: Scissors },
    { name: t('team'), href: '/dashboard/team', icon: Briefcase },
    { name: t('suppliers'), href: '/dashboard/suppliers', icon: Truck },
    { name: t('history'), href: "/dashboard/history", icon: History },
    { name: t('settings'), href: '/dashboard/settings', icon: Settings },
  ];

  // FILTRAGE DES ITEMS
  const navItems = user ? allNavItems.filter(item => {
      const userRoles = user.roles || [];
      
      // 1. Si SUPERADMIN est présent dans le tableau, il voit tout
      if (userRoles.includes('SUPERADMIN')) return true;

      // 2. On cache le dashboard (racine) pour les non-admins
      if (item.href === '/dashboard') return false;
      
      // 3. On utilise la fonction de permission (doit être mise à jour pour accepter Role[])
      return hasPermission(userRoles, item.href);
  }) : [];

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 animate-pulse">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-base" dir={pathname.includes('/ar') ? 'rtl' : 'ltr'}>
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent navItems={navItems} user={user} pathname={pathname} handleLogout={handleLogout} closeSidebar={() => setIsSidebarOpen(false)} />
      </aside>

      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 z-30 bg-white border-r border-gray-200">
        <SidebarContent navItems={navItems} user={user} pathname={pathname} handleLogout={handleLogout} closeSidebar={() => {}} />
      </aside>

      <main className="flex-1 md:pl-72 min-h-screen flex flex-col transition-all duration-300">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 p-4 md:hidden flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg active:scale-95 transition">
                    <Menu size={26} />
                </button>
                <span className="font-bold text-lg text-gray-900">be COLOR</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                {user.prenom.charAt(0)}
            </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
            {children}
        </div>
      </main>
    </div>
  );
}