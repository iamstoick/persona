'use client';

import { useState, FormEvent } from 'react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  backgroundColor: '#141414',
  border: '1px solid #1F1F1F',
  color: '#E8E8E8',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
};

interface Props {
  email: string;
}

export function ContactForm({ email }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#141414',
          border: '1px solid #00C48C',
          color: '#00C48C',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
        }}
      >
        Message sent. I&apos;ll get back to you soon.
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', color: '#888888', fontSize: '0.8rem', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>Name</label>
          <input
            style={inputStyle}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: '#888888', fontSize: '0.8rem', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>Email</label>
          <input
            type="email"
            style={inputStyle}
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', color: '#888888', fontSize: '0.8rem', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>Subject</label>
        <input
          style={inputStyle}
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </div>

      <div>
        <label style={{ display: 'block', color: '#888888', fontSize: '0.8rem', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>Message</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: '180px' }}
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: '#FF4444', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          Failed to send. Try emailing directly: {email}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          padding: '0.875rem',
          backgroundColor: status === 'sending' ? '#888888' : '#63E6A0',
          color: '#0D0D0D',
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 700,
          fontSize: '0.95rem',
          border: 'none',
          cursor: status === 'sending' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'sending' ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}
