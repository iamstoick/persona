'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import type { SiteSettings, SkillGroup, SocialLink } from '@/lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  backgroundColor: '#0D0D0D',
  border: '1px solid #1F1F1F',
  color: '#E8E8E8',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#888888',
  fontSize: '0.75rem',
  marginBottom: '0.35rem',
  fontFamily: 'var(--font-mono)',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#141414',
  border: '1px solid #1F1F1F',
  padding: '1.5rem',
  marginBottom: '2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const saveButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  backgroundColor: '#63E6A0',
  color: '#0D0D0D',
  fontFamily: 'var(--font-space-grotesk)',
  fontWeight: 700,
  fontSize: '0.85rem',
  border: 'none',
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '1.1rem', color: '#E8E8E8', margin: 0 }}>
      {children}
    </h2>
  );
}

function SavedNote({ show }: { show: boolean }) {
  if (!show) return null;
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#63E6A0' }}>Saved ✓</span>;
}

export default function AdminSettingsPage() {
  const [loaded, setLoaded] = useState(false);

  const [hero, setHero] = useState({ badge: '', tagline: '' });
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);

  const [careerStart, setCareerStart] = useState('');
  const [groups, setGroups] = useState<SkillGroup[]>([]);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillsSaved, setSkillsSaved] = useState(false);

  const [email, setEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    authFetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: SiteSettings) => {
        setHero({ badge: data.hero?.badge || '', tagline: data.hero?.tagline || '' });
        setCareerStart(data.skills?.careerStart || '');
        setGroups(data.skills?.groups || []);
        setEmail(data.contact?.email || '');
        setHeadline(data.contact?.headline || '');
        setSocials(data.contact?.socials || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function saveHero() {
    setHeroSaving(true);
    try {
      await authFetch('/api/admin/settings/hero', { method: 'PUT', body: JSON.stringify(hero) });
      setHeroSaved(true);
      setTimeout(() => setHeroSaved(false), 2000);
    } finally {
      setHeroSaving(false);
    }
  }

  async function saveSkills() {
    setSkillsSaving(true);
    try {
      await authFetch('/api/admin/settings/skills', {
        method: 'PUT',
        body: JSON.stringify({ careerStart, groups }),
      });
      setSkillsSaved(true);
      setTimeout(() => setSkillsSaved(false), 2000);
    } finally {
      setSkillsSaving(false);
    }
  }

  async function saveContact() {
    setContactSaving(true);
    try {
      await authFetch('/api/admin/settings/contact', {
        method: 'PUT',
        body: JSON.stringify({ email, headline, socials }),
      });
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    } finally {
      setContactSaving(false);
    }
  }

  function updateGroup(i: number, patch: Partial<SkillGroup>) {
    setGroups(groups.map((g, gi) => (gi === i ? { ...g, ...patch } : g)));
  }

  function updateGroupTags(i: number, tagsStr: string) {
    updateGroup(i, { tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean) });
  }

  function addGroup() {
    setGroups([...groups, { label: '', tags: [] }]);
  }

  function removeGroup(i: number) {
    setGroups(groups.filter((_, gi) => gi !== i));
  }

  function updateSocial(i: number, patch: Partial<SocialLink>) {
    setSocials(socials.map((s, si) => (si === i ? { ...s, ...patch } : s)));
  }

  function addSocial() {
    setSocials([...socials, { label: '', href: '' }]);
  }

  function removeSocial(i: number) {
    setSocials(socials.filter((_, si) => si !== i));
  }

  if (!loaded) {
    return <p style={{ color: '#888888', fontFamily: 'var(--font-mono)' }}>Loading…</p>;
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8', marginBottom: '2rem' }}>
        Site settings
      </h1>

      {/* Hero */}
      <div style={cardStyle}>
        <SectionHeading>Hero</SectionHeading>
        <div>
          <label style={labelStyle}>Badge line</label>
          <input style={inputStyle} value={hero.badge} onChange={(e) => setHero({ ...hero, badge: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Tagline</label>
          <input style={inputStyle} value={hero.tagline} onChange={(e) => setHero({ ...hero, tagline: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={saveHero} disabled={heroSaving} style={saveButtonStyle}>
            {heroSaving ? 'Saving…' : 'Save'}
          </button>
          <SavedNote show={heroSaved} />
        </div>
      </div>

      {/* Skills */}
      <div style={cardStyle}>
        <SectionHeading>Skills</SectionHeading>
        <div style={{ width: '220px' }}>
          <label style={labelStyle}>Career start date</label>
          <input type="date" style={inputStyle} value={careerStart} onChange={(e) => setCareerStart(e.target.value)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={labelStyle}>Skill groups</label>
          {groups.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <input
                style={{ ...inputStyle, width: '180px', flexShrink: 0 }}
                placeholder="Category label"
                value={g.label}
                onChange={(e) => updateGroup(i, { label: e.target.value })}
              />
              <input
                style={inputStyle}
                placeholder="Tags, comma-separated"
                value={g.tags.join(', ')}
                onChange={(e) => updateGroupTags(i, e.target.value)}
              />
              <button onClick={() => removeGroup(i)} style={{ background: 'none', border: 'none', color: '#FF4444', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
          <button onClick={addGroup} style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #1F1F1F', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.4rem 0.75rem' }}>
            + Add group
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={saveSkills} disabled={skillsSaving} style={saveButtonStyle}>
            {skillsSaving ? 'Saving…' : 'Save'}
          </button>
          <SavedNote show={skillsSaved} />
        </div>
      </div>

      {/* Contact */}
      <div style={cardStyle}>
        <SectionHeading>Contact</SectionHeading>
        <div>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>Headline</label>
          <textarea
            style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={labelStyle}>Social links</label>
          {socials.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <input
                style={{ ...inputStyle, width: '140px', flexShrink: 0 }}
                placeholder="Label"
                value={s.label}
                onChange={(e) => updateSocial(i, { label: e.target.value })}
              />
              <input
                style={inputStyle}
                placeholder="https://..."
                value={s.href}
                onChange={(e) => updateSocial(i, { href: e.target.value })}
              />
              <button onClick={() => removeSocial(i)} style={{ background: 'none', border: 'none', color: '#FF4444', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
          <button onClick={addSocial} style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #1F1F1F', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer', padding: '0.4rem 0.75rem' }}>
            + Add social link
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={saveContact} disabled={contactSaving} style={saveButtonStyle}>
            {contactSaving ? 'Saving…' : 'Save'}
          </button>
          <SavedNote show={contactSaved} />
        </div>
      </div>
    </div>
  );
}
