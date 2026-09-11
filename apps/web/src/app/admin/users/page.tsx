'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const ROLES = ['subscriber', 'editor', 'admin'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  function load() {
    authFetch('/api/admin/users').then((r) => r.json()).then((data) => setUsers(Array.isArray(data) ? data : [])).catch(() => setUsers([]));
  }

  useEffect(load, []);

  async function changeRole(id: string, role: string) {
    await authFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }).catch(() => {});
    load();
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8', marginBottom: '2rem' }}>Users</h1>

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F1F1F' }}>
              {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #1F1F1F' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#E8E8E8', fontSize: '0.9rem' }}>{user.name}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{user.email}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    style={{ backgroundColor: '#0D0D0D', border: '1px solid #1F1F1F', color: '#E8E8E8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
