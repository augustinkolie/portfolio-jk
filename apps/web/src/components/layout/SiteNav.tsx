'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import styles from './SiteHeader.module.css';

const LINKS = [
  { href: '/realisations', label: 'Réalisations' },
  { href: '/expertises', label: 'Expertises' },
  { href: '/formations', label: 'Formations' },
  { href: '/plans', label: 'Plans' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
] as const;

/** Navigation principale. Sur mobile, un bouton ouvre la liste (seul JS de l'en-tête). */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fermer le menu après navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav className={styles.nav} aria-label="Navigation principale">
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="menu-principal"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={open ? 'close' : 'menu'} size={24} />
        <span>{open ? 'Fermer' : 'Menu'}</span>
      </button>
      <ul id="menu-principal" className={styles.links} data-open={open}>
        {LINKS.map((link) => {
          const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link href={link.href} aria-current={current ? 'page' : undefined}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
