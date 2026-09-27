import { Icon } from '@/components/ui/Icon';
import { whatsappUrl } from '@/lib/site';
import styles from './WhatsAppButton.module.css';

/** Bouton WhatsApp fixe, sur toutes les pages publiques : canal prioritaire en Guinée (§4.6). */
export function WhatsAppButton({ phone }: { phone: string }) {
  if (!phone) return null;
  return (
    <a
      className={styles.button}
      href={whatsappUrl(phone, 'Bonjour, je souhaite des informations sur un projet.')}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon name="whatsapp" size={28} />
      <span className="sr-only">Écrire sur WhatsApp</span>
    </a>
  );
}
