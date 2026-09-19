'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Stats {
  total: number;
  draft: number;
  published: number;
}

interface Post {
  id: string;
  title: string;
  status: string;
  updated_at: string;
}

interface StudentProgress {
  user_id: string;
  user_name: string;
  user_email: string;
  course_id: string;
  course_title: string;
  completed_lessons: string;
  total_lessons: string;
  last_activity: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, published: 0 });
  const [recent, setRecent] = useState<Post[]>([]);
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);

  useEffect(() => {
    authFetch('/api/admin/posts')
      .then((r) => r.json())
      .then((posts: Post[]) => {
        const published = posts.filter((p) => p.status === 'published').length;
        const draft = posts.filter((p) => p.status === 'draft').length;
        setStats({ total: posts.length, published, draft });
        setRecent(posts.slice(0, 5));

        // Build last-30-day publish chart
        const days: Record<string, number> = {};
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          days[d.toISOString().slice(0, 10)] = 0;
        }
        posts
          .filter((p) => p.status === 'published' && p.updated_at)
          .forEach((p) => {
            const key = p.updated_at.slice(0, 10);
            if (key in days) days[key]++;
          });
        setChartData(Object.entries(days).map(([date, count]) => ({ date: date.slice(5), count })));
      })
      .catch(() => {});

    authFetch('/api/admin/courses/progress')
      .then((r) => r.json())
      .then((data: StudentProgress[]) => setProgress(Array.isArray(data) ? data : []))
      .catch(() => setProgress([]));
  }, []);

  const STAT_CARDS = [
    { label: 'Total posts', value: stats.total },
    { label: 'Published', value: stats.published, color: '#00C48C' },
    { label: 'Drafts', value: stats.draft, color: '#FFB800' },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8', marginBottom: '2rem' }}>
        Dashboard
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {STAT_CARDS.map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F', padding: '1.5rem' }}>
            <p style={{ color: '#888888', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '2.5rem', fontWeight: 800, color: color || '#E8E8E8' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F', padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '1rem', fontWeight: 700, color: '#E8E8E8', marginBottom: '1rem' }}>
          Publications (last 30 days)
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={8}>
            <XAxis dataKey="date" tick={{ fill: '#888888', fontSize: 10 }} interval={6} />
            <YAxis tick={{ fill: '#888888', fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #1F1F1F', color: '#E8E8E8' }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#63E6A0" fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F', padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '1rem', fontWeight: 700, color: '#E8E8E8', marginBottom: '1rem' }}>
          Recent activity
        </h2>
        {recent.map((post) => (
          <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #1F1F1F' }}>
            <span style={{ color: '#E8E8E8', fontSize: '0.9rem' }}>{post.title}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: post.status === 'published' ? '#00C48C' : '#FFB800' }}>
              {post.status}
            </span>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F', padding: '1.5rem', marginTop: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '1rem', fontWeight: 700, color: '#E8E8E8', marginBottom: '1rem' }}>
          Student progress
        </h2>
        {progress.length === 0 && (
          <p style={{ color: '#888888', fontSize: '0.85rem', margin: 0 }}>No one has started a course yet.</p>
        )}
        {progress.map((p) => {
          const completed = parseInt(p.completed_lessons, 10);
          const total = parseInt(p.total_lessons, 10);
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <div key={`${p.user_id}-${p.course_id}`} style={{ padding: '0.85rem 0', borderBottom: '1px solid #1F1F1F' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ color: '#E8E8E8', fontSize: '0.9rem' }}>
                  {p.user_name} <span style={{ color: '#888888', fontSize: '0.75rem' }}>({p.user_email})</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: pct === 100 ? '#63E6A0' : '#888888' }}>
                  {completed}/{total} · {pct}%
                </span>
              </div>
              <p style={{ color: '#888888', fontSize: '0.8rem', margin: '0 0 0.4rem' }}>{p.course_title}</p>
              <div style={{ height: '5px', backgroundColor: '#0D0D0D' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct === 100 ? '#63E6A0' : '#63E6A088' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
