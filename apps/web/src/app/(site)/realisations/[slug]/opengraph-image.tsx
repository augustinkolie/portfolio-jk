import { ImageResponse } from 'next/og';
import { api } from '@/lib/api';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Fiche du projet';

/** Image de partage (WhatsApp, Facebook…) : tirage cyanotype avec le cartouche du projet. */
export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const [project, settings] = await Promise.all([api.project((await params).slug), api.settings()]);
  const title = project?.title ?? settings.company.name;
  const facts = project
    ? [project.location, String(project.year), project.size].filter((v): v is string => Boolean(v))
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: '#1d4a73',
          color: '#f2f5f8',
          backgroundImage:
            'linear-gradient(to right, rgba(242,245,248,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(242,245,248,0.08) 1px, transparent 1px)',
          backgroundSize: '96px 96px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 32, fontWeight: 600 }}>{settings.company.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
          {facts.length > 0 && (
            <div style={{ display: 'flex', border: '2px solid #f2f5f8', alignSelf: 'flex-start' }}>
              {facts.map((fact, i) => (
                <div
                  key={fact}
                  style={{
                    display: 'flex',
                    padding: '12px 24px',
                    fontSize: 30,
                    borderLeft: i === 0 ? 'none' : '1px solid rgba(242,245,248,0.5)',
                  }}
                >
                  {fact}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
