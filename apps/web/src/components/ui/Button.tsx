import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

/**
 * - devis : jaune signal, réservé au bouton « Demander un devis » (§3.3)
 * - plein : action principale partout ailleurs (« Envoyer la demande », « Publier »)
 * - trait : action secondaire
 * - plan : action sur fond cyanotype
 */
export type ButtonVariant = 'devis' | 'plein' | 'trait' | 'plan';

interface CommonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: IconName;
  /** Pleine largeur (utile sur mobile). */
  block?: boolean;
  className?: string;
}

type LinkButtonProps = CommonProps & { href: string; external?: boolean };
type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: never };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

function classes({ variant = 'plein', block, className }: CommonProps): string {
  return [styles.button, styles[variant], block && styles.block, className].filter(Boolean).join(' ');
}

export function Button(props: ButtonProps) {
  const content = (
    <>
      {props.icon && <Icon name={props.icon} size="1.25em" />}
      <span>{props.children}</span>
    </>
  );

  if (props.href !== undefined) {
    const { href, external } = props;
    if (external) {
      return (
        <a className={classes(props)} href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link className={classes(props)} href={href}>
        {content}
      </Link>
    );
  }

  const { children: _c, variant: _v, icon: _i, block: _b, className: _cl, type = 'button', ...rest } =
    props;
  return (
    <button className={classes(props)} type={type} {...rest}>
      {content}
    </button>
  );
}

interface ActionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** Lien texte suivi d'une flèche : « Voir les réalisations → ». */
export function ActionLink({ href, children, className }: ActionLinkProps) {
  return (
    <Link className={[styles.actionLink, className].filter(Boolean).join(' ')} href={href}>
      <span>{children}</span>
      <Icon name="arrow-right" size="1.1em" />
    </Link>
  );
}
