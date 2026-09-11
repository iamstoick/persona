import type { Project } from '@/lib/api';
import { TerminalCard } from '@/components/TerminalCard';
import { TerminalHeading } from '@/components/TerminalHeading';

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'static-1',
    title: 'geraldvillorente.com',
    excerpt: 'Personal site built on Next.js 16, Express 5, and PostgreSQL. Monorepo, Docker-first, deployed on a VPS.',
    tags: ['next.js', 'express', 'postgresql', 'docker'],
    github_url: 'https://github.com/geraldvillorente/geraldvillorente.com',
    sort_order: 0,
  },
  {
    id: 'static-2',
    title: 'Drupal CI Pipeline',
    excerpt: 'Reusable GitHub Actions workflow for Drupal — automated testing, code quality checks, and Pantheon deployments.',
    tags: ['drupal', 'github-actions', 'pantheon', 'php'],
    github_url: 'https://github.com/geraldvillorente/drupal-ci-pipeline',
    sort_order: 1,
  },
];

interface Props {
  projects?: Project[];
}

export function Projects({ projects = DEFAULT_PROJECTS }: Props) {
  return (
    <section
      id="projects"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '4rem 2rem 6rem',
        scrollMarginTop: '80px',
      }}
    >
      <TerminalHeading text="$ ls ./projects" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {projects.map((project) => (
          <TerminalCard key={project.id} project={project} />
        ))}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <a href="/projects" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#63E6A0', textDecoration: 'none' }}>
          All projects →
        </a>
      </div>
    </section>
  );
}
