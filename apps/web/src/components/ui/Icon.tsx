import type { SVGProps } from 'react';

/**
 * Jeu d'icônes réduit, dessiné au trait comme un plan : extrémités carrées, angles vifs.
 * Seules les icônes réellement utilisées figurent ici.
 */
const PATHS = {
  'arrow-right': 'M4 12h15M13 6l6 6-6 6',
  'arrow-left': 'M20 12H5M11 6l-6 6 6 6',
  'chevron-left': 'M15 5l-7 7 7 7',
  'chevron-right': 'M9 5l7 7-7 7',
  close: 'M5 5l14 14M19 5L5 19',
  menu: 'M3 7h18M3 12h18M3 17h18',
  plus: 'M12 4v16M4 12h16',
  minus: 'M4 12h16',
  'chevron-down': 'M5 9l7 7 7-7',
  bell: 'M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  logout: 'M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  document: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  check: 'M4 12.5l5 5L20 6.5',
  phone:
    'M5 3.5h4l1.5 5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5 5 1.5v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z',
  mail: 'M3 5.5h18v13H3zM3 6l9 7 9-7',
  'map-pin': 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
} as const;

export type IconName = keyof typeof PATHS | 'whatsapp';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  name: IconName;
  /** Taille en px ou en unité CSS. Par défaut : 1em, suit la taille du texte. */
  size?: number | string;
  /** Texte lu par les lecteurs d'écran. Sans titre, l'icône est décorative. */
  title?: string;
}

export function Icon({ name, size = '1em', title, ...rest }: IconProps) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      focusable="false"
      {...a11y}
      {...rest}
    >
      {name === 'whatsapp' ? (
        // Logo WhatsApp simplifié (forme pleine) : canal prioritaire, doit être reconnu d'un coup d'œil.
        <path
          fill="currentColor"
          d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2l-.5-.3z"
        />
      ) : (
        <path
          d={PATHS[name]}
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      )}
    </svg>
  );
}
