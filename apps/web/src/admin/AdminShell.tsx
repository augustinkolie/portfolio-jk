'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LOGIN_PATH, useAuth } from './AuthProvider';
import styles from './AdminShell.module.css';
import { NotificationsMenu, ProfileMenu } from './TopBarMenus';

const NAV = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/projets', label: 'Réalisations' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/formations', label: 'Formations' },
  { href: '/admin/inscriptions', label: 'Inscriptions' },
  { href: '/admin/plans', label: 'Plans' },
  { href: '/admin/parcours', label: 'Parcours' },
  { href: '/admin/domaines', label: 'Domaines' },
  { href: '/admin/parametres', label: 'Paramètres' },
  { href: '/admin/compte', label: 'Mon compte' },
] as const;

/** Cadre de l'admin : navigation latérale (tiroir sur mobile) et garde de session. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  if (pathname === LOGIN_PATH) return <>{children}</>;

  if (status !== 'authenticated') {
    return (
      <p className={styles.loading} role="status">
        Vérification de la session…
      </p>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link href="/admin" className={styles.brand}>
          Administration
        </Link>
        <div className={styles.tools}>
          <NotificationsMenu />
          <ProfileMenu />
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls="admin-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
            <span className={styles.toggleText}>{open ? 'Fermer' : 'Menu'}</span>
          </button>
        </div>
      </header>

      <nav id="admin-nav" className={styles.nav} data-open={open} aria-label="Administration">
        <ul>
          {NAV.map((item) => {
            const current = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={current ? 'page' : undefined}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main id="contenu" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
