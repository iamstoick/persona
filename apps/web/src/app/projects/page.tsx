'use client';

import { useEffect, useState } from 'react';
import { apiFetch, Project } from '@/lib/api';
import { TerminalCard } from '@/components/TerminalCard';
import { TerminalHeading } from '@/components/TerminalHeading';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    apiFetch<Project[]>('/api/projects')
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }, []);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <TerminalHeading text="$ ls ./projects" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem',
          }}
        >
          {projects.map((project) => (
            <TerminalCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
