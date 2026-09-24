// Shared Open Graph image card. Rendered by Next's ImageResponse (satori), so this
// must stick to inline styles + flexbox: no tailwind, no CSS grid, system fonts only.
export interface OgCardProps {
  kicker: string;
  title: string;
  description?: string | null;
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function OgCard({ kicker, title, description }: OgCardProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#0D0D0D',
        padding: '72px 80px',
        fontFamily: "'Segoe UI', Inter, -apple-system, Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#63E6A0',
            marginBottom: 28,
          }}
        >
          {truncate(kicker, 48)}
        </span>
        <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, color: '#E8E8E8' }}>
          {truncate(title, 90)}
        </span>
        {description ? (
          <span style={{ fontSize: 30, lineHeight: 1.4, color: '#888888', marginTop: 24 }}>
            {truncate(description, 160)}
          </span>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 64, height: 8, backgroundColor: '#63E6A0', marginRight: 20 }} />
        <span style={{ fontSize: 26, color: '#888888' }}>geraldvillorente.com</span>
      </div>
    </div>
  );
}
