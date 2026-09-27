'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { adminFetch } from './lib/client';
import { errorMessage, useAdminData } from './lib/useAdminData';
import { Notice, Panel, adminStyles as s } from './ui';
import { Button } from '@/components/ui/Button';
import { SelectField, TextArea, TextField } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'select';
  optional?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
}

interface OrderedListProps<T extends { id: string }> {
  /** Route admin : « /admin/experiences ». Doit accepter GET, POST, PATCH /:id, DELETE /:id, PUT /order. */
  endpoint: string;
  fields: FieldDef[];
  /** Valeur de chaque champ pour pré-remplir la modification. */
  valueOf: (item: T, field: string) => string;
  renderItem: (item: T) => ReactNode;
  addLabel: string;
  itemName: string;
}

/**
 * Liste ordonnée éditable (parcours, domaines…) : ajout, modification sur place,
 * suppression avec confirmation, flèches pour changer l'ordre.
 */
export function OrderedList<T extends { id: string }>({
  endpoint,
  fields,
  valueOf,
  renderItem,
  addLabel,
  itemName,
}: OrderedListProps<T>) {
  const { data: items, error, setData } = useAdminData<T[]>(endpoint);
  const [editing, setEditing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'erreur'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  function bodyOf(form: HTMLFormElement): Record<string, string> {
    return Object.fromEntries(fields.map((f) => [f.name, String(new FormData(form).get(f.name) ?? '').trim()]));
  }

  async function submit(e: FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    const form = e.currentTarget;
    setSending(true);
    try {
      const saved = await adminFetch<T>(id ? `${endpoint}/${id}` : endpoint, {
        method: id ? 'PATCH' : 'POST',
        json: bodyOf(form),
      });
      setData(id ? items!.map((x) => (x.id === id ? saved : x)) : [...(items ?? []), saved]);
      setEditing(null);
      if (!id) form.reset();
      setFeedback({ tone: 'ok', text: id ? `${itemName} modifié(e).` : `${itemName} ajouté(e).` });
    } catch (err) {
      setFeedback({ tone: 'erreur', text: errorMessage(err) });
    } finally {
      setSending(false);
    }
  }

  async function remove(item: T) {
    if (!window.confirm(`Supprimer cet élément ? Cette action est définitive.`)) return;
    try {
      await adminFetch<void>(`${endpoint}/${item.id}`, { method: 'DELETE' });
      setData(items!.filter((x) => x.id !== item.id));
      setFeedback({ tone: 'ok', text: `${itemName} supprimé(e).` });
    } catch (err) {
      setFeedback({ tone: 'erreur', text: errorMessage(err) });
    }
  }

  async function move(index: number, delta: number) {
    if (!items) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(index + delta, 0, moved!);
    setData(next);
    try {
      setData(await adminFetch<T[]>(`${endpoint}/order`, { method: 'PUT', json: { ids: next.map((x) => x.id) } }));
    } catch (err) {
      setData(items);
      setFeedback({ tone: 'erreur', text: errorMessage(err) });
    }
  }

  function renderFields(prefix: string, item?: T) {
    return fields.map((f) => {
      const common = {
        name: f.name,
        label: f.label,
        hint: f.hint,
        optional: f.optional,
        defaultValue: item ? valueOf(item, f.name) : undefined,
      };
      // Un seul formulaire affiché à la fois (ajout ou modification) : les id des champs restent uniques.
      const key = `${prefix}-${f.name}`;
      if (f.type === 'textarea') return <TextArea key={key} {...common} rows={4} />;
      if (f.type === 'select')
        return <SelectField key={key} {...common} options={f.options ?? []} placeholder={f.optional ? 'Aucune' : 'Choisir…'} />;
      return <TextField key={key} {...common} />;
    });
  }

  return (
    <>
      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
      {error && <Notice tone="erreur">{error}</Notice>}

      {items && items.length === 0 && <p className={s.empty}>Aucun élément pour l’instant.</p>}
      {items && items.length > 0 && (
        <ol className={s.list}>
          {items.map((item, i) => (
            <li key={item.id} className={s.row}>
              {editing === item.id ? (
                <form className={`${s.form} ${s.rowMain}`} onSubmit={(e) => void submit(e, item.id)} noValidate>
                  {renderFields(item.id, item)}
                  <div className={s.formActions}>
                    <Button type="submit" variant="plein" disabled={sending}>
                      Enregistrer
                    </Button>
                    <button type="button" className={s.linkButton} onClick={() => setEditing(null)}>
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className={s.rowMain}>{renderItem(item)}</div>
                  <button type="button" className={s.iconButton} onClick={() => void move(i, -1)} disabled={i === 0} aria-label="Monter">
                    <Icon name="chevron-left" style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  <button type="button" className={s.iconButton} onClick={() => void move(i, 1)} disabled={i === items.length - 1} aria-label="Descendre">
                    <Icon name="chevron-right" style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  <button type="button" className={s.linkButton} onClick={() => setEditing(item.id)}>
                    Modifier
                  </button>
                  <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove(item)}>
                    Supprimer
                  </button>
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      <Panel title={addLabel} id="ajout">
        <form className={s.form} onSubmit={(e) => void submit(e)} noValidate>
          {editing === null && renderFields('nouveau')}
          <div className={s.formActions}>
            <Button type="submit" variant="plein" icon="plus" disabled={sending || editing !== null}>
              {addLabel}
            </Button>
          </div>
        </form>
      </Panel>
    </>
  );
}
