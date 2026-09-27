'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import styles from './RichTextEditor.module.css';

interface RichTextEditorProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (html: string) => void;
}

interface ToolButton {
  label: string;
  run: (e: Editor) => void;
  active?: (e: Editor) => boolean;
}

// Jeu d'options réduit (§5.3) : exactement ce que l'API accepte après nettoyage.
const TOOLS: ToolButton[] = [
  { label: 'Titre', run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading', { level: 2 }) },
  { label: 'Sous-titre', run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e) => e.isActive('heading', { level: 3 }) },
  { label: 'Gras', run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold') },
  { label: 'Italique', run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
  { label: 'Liste', run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
  { label: 'Liste numérotée', run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') },
  {
    label: 'Lien',
    run: (e) => {
      const current = e.getAttributes('link').href as string | undefined;
      const url = window.prompt('Adresse du lien (laisser vide pour le retirer) :', current ?? 'https://');
      if (url === null) return;
      if (url.trim() === '' || url === 'https://') e.chain().focus().unsetLink().run();
      else e.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    },
    active: (e) => e.isActive('link'),
  },
];

export function RichTextEditor({ id, label, hint, error, value, onChange }: RichTextEditorProps) {
  const labelId = `${id}-libelle`;
  const describedBy = [hint && `${id}-aide`, error && `${id}-erreur`].filter(Boolean).join(' ') || undefined;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto', 'tel'] },
      }),
    ],
    content: value,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        id,
        class: styles.content ?? '',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': 'true' } : {}),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  return (
    <div className={styles.field}>
      <span className={styles.label} id={labelId}>
        {label}
      </span>
      {hint && (
        <p className={styles.hint} id={`${id}-aide`}>
          {hint}
        </p>
      )}
      <div className={`${styles.frame} ${error ? styles.invalid : ''}`}>
        <div className={styles.toolbar} role="toolbar" aria-label={`Mise en forme : ${label}`}>
          {TOOLS.map((tool) => (
            <button
              key={tool.label}
              type="button"
              className={styles.tool}
              aria-pressed={editor && tool.active ? tool.active(editor) : undefined}
              disabled={!editor}
              onClick={() => editor && tool.run(editor)}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
      {error && (
        <p className={styles.error} id={`${id}-erreur`}>
          {error}
        </p>
      )}
    </div>
  );
}
