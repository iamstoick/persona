export default function NotFound() {
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#63E6A0', letterSpacing: '0.15em', marginBottom: '1rem' }}>404</p>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '2rem', fontWeight: 800, color: '#E8E8E8', marginBottom: '1rem' }}>Page not found.</h1>
        <a href="/" style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>← Go home</a>
      </div>
    </div>
  );
}
