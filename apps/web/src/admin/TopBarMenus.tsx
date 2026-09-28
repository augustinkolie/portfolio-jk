'use client';

import type { NotificationsDto } from '@btp/shared';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from './AuthProvider';
import { adminFetch } from './lib/client';
import styles from './TopBarMenus.module.css';

const POLL_MS = 60_000;
const TIME = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

/** « il y a 5 minutes », « hier »… */
function ago(iso: string): string {
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60_000);
  if (minutes > -60) return TIME.format(Math.min(minutes, 0), 'minute');
  const hours = Math.round(minutes / 60);
  if (hours > -24) return TIME.format(hours, 'hour');
  return TIME.format(Math.round(hours / 24), 'day');
}

/**
 * Menu déroulant accessible : bouton aria-expanded, fermeture par Échap (focus rendu au bouton),
 * clic à l'extérieur ou changement de page.
 */
function Dropdown({
  label,
  button,
  children,
  className,
}: {
  label: string;
  button: ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);
  useEffect(close, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.dropdown} ref={root}>
      <button
        type="button"
        ref={trigger}
        className={`${styles.trigger} ${className ?? ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        {button}
      </button>
      <div id={panelId} className={styles.panel} hidden={!open}>
        {open && children(close)}
      </div>
    </div>
  );
}

/** Cloche : messages non lus et inscriptions nouvelles. Actualisée chaque minute et à chaque page. */
export function NotificationsMenu() {
  const pathname = usePathname();
  const [data, setData] = useState<NotificationsDto | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await adminFetch<NotificationsDto>('/admin/notifications'));
      setFailed(false);
    } catch {
      setFailed(true); // la cloche reste utilisable ; les pages affichent leurs propres erreurs
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  useEffect(() => {
    const tick = () => document.visibilityState === 'visible' && void load();
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [load]);

  const total = data?.total ?? 0;
  const label = total > 0 ? `Notifications : ${total} en attente` : 'Notifications : rien de nouveau';

  return (
    <Dropdown
      label={label}
      button={
        <>
          <Icon name="bell" size={22} />
          {total > 0 && (
            <span className={`${styles.count} num`} aria-hidden="true">
              {total > 99 ? '99+' : total}
            </span>
          )}
        </>
      }
    >
      {() => (
        <div className={styles.notifications}>
          <p className={styles.panelTitle}>Notifications</p>
          {failed && !data && <p className={styles.empty}>Impossible de charger les notifications. Réessayez dans un instant.</p>}
          {data && data.items.length === 0 && (
            <p className={styles.empty}>Rien de nouveau : tous les messages et inscriptions ont été vus.</p>
          )}
          {data && data.items.length > 0 && (
            <ul className={styles.list}>
              {data.items.map((n) => (
                <li key={`${n.type}-${n.id}`}>
                  <Link
                    href={n.type === 'message' ? `/admin/messages?ouvrir=${n.id}` : '/admin/inscriptions'}
                    className={styles.item}
                  >
                    <span className={styles.kind} data-type={n.type}>
                      {n.type === 'message' ? 'Message' : 'Inscription'}
                    </span>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemDetail}>{n.detail}</span>
                    <time className={styles.itemTime} dateTime={n.createdAt}>
                      {ago(n.createdAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {data && (
            <div className={styles.panelFoot}>
              <Link href="/admin/messages">
                Messages{data.messages > 0 ? ` (${data.messages} non lu${data.messages > 1 ? 's' : ''})` : ''}
              </Link>
              <Link href="/admin/inscriptions">
                Inscriptions{data.enrollments > 0 ? ` (${data.enrollments} nouvelle${data.enrollments > 1 ? 's' : ''})` : ''}
              </Link>
            </div>
          )}
        </div>
      )}
    </Dropdown>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

/** Profil : nom, e-mail, compte, site public, déconnexion. */
export function ProfileMenu() {
  const { user, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  if (!user) return null;

  return (
    <Dropdown
      label={`Profil : ${user.name}`}
      className={styles.profileTrigger}
      button={
        <>
          <span className={styles.avatar} aria-hidden="true">
            {initials(user.name)}
          </span>
          <span className={styles.profileName}>{user.name}</span>
          <Icon name="chevron-down" size={16} />
        </>
      }
    >
      {() => (
        <div className={styles.profile}>
          <div className={styles.identity}>
            <span className={`${styles.avatar} ${styles.avatarLarge}`} aria-hidden="true">
              {initials(user.name)}
            </span>
            <p>
              <strong>{user.name}</strong>
              <br />
              <span className={styles.email}>{user.email}</span>
            </p>
          </div>
          <ul className={styles.actions}>
            <li>
              <Link href="/admin/compte">
                <Icon name="user" size={20} />
                Mon compte
              </Link>
            </li>
            <li>
              <a href="/" target="_blank" rel="noopener">
                <Icon name="external" size={20} />
                Voir le site
              </a>
            </li>
            <li>
              <button
                type="button"
                disabled={leaving}
                onClick={() => {
                  setLeaving(true);
                  void logout();
                }}
              >
                <Icon name="logout" size={20} />
                {leaving ? 'Déconnexion…' : 'Se déconnecter'}
              </button>
            </li>
          </ul>
        </div>
      )}
    </Dropdown>
  );
}
