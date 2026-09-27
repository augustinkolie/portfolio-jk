import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SiteNav } from './SiteNav';
import styles from './SiteHeader.module.css';

export function SiteHeader({ companyName }: { companyName: string }) {
  return (
    <header className={styles.header}>
      <Container className={styles.bar}>
        <Link href="/" className={styles.brand}>
          {companyName}
        </Link>
        <SiteNav />
        <Button href="/contact" variant="devis" className={styles.cta}>
          Demander un devis
        </Button>
      </Container>
    </header>
  );
}
