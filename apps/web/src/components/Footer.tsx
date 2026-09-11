export function Footer() {
  return (
    <footer
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2rem',
        borderTop: '1px solid #1F1F1F',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888' }}>
        © {new Date().getFullYear()} Gerald Villorente
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888' }}>
        built with Next.js
      </span>
    </footer>
  );
}
