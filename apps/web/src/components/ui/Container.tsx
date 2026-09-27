import type { ElementType, ReactNode } from 'react';
import styles from './Container.module.css';

interface ContainerProps {
  children: ReactNode;
  as?: ElementType;
  /** Largeur de lecture (70 caractères) au lieu de la grille complète. */
  narrow?: boolean;
  className?: string;
}

/** Largeur maximale et gouttières latérales, identiques sur tout le site. */
export function Container({ children, as: Tag = 'div', narrow = false, className }: ContainerProps) {
  const classes = [styles.container, narrow && styles.narrow, className].filter(Boolean).join(' ');
  return <Tag className={classes}>{children}</Tag>;
}
