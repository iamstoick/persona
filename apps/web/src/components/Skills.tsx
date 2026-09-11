import type { SkillGroup } from '@/lib/api';

const DEFAULT_CAREER_START = '2013-06-01';

const DEFAULT_SKILL_GROUPS: SkillGroup[] = [
  { label: 'CMS & Platform', tags: ['Drupal 10/11', 'PHP', 'Symfony', 'Composer'] },
  { label: 'DevOps & Infra', tags: ['Kubernetes', 'Terraform', 'Docker', 'GCP', 'AWS'] },
  { label: 'Pipelines', tags: ['GitHub Actions', 'CircleCI', 'Jenkins', 'ArgoCD'] },
  { label: 'Observability', tags: ['Grafana', 'Prometheus', 'ELK', 'New Relic'] },
];

interface Props {
  careerStart?: string;
  groups?: SkillGroup[];
}

function yearsSince(startIso: string): number {
  const start = new Date(startIso);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  const anniversaryPassed =
    now.getMonth() > start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() >= start.getDate());
  if (!anniversaryPassed) years -= 1;
  return years;
}

export function Skills({ careerStart = DEFAULT_CAREER_START, groups = DEFAULT_SKILL_GROUPS }: Props) {
  const years = yearsSince(careerStart);
  const startYear = new Date(careerStart).getFullYear();

  return (
    <section
      id="skills"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '4rem 2rem 6rem',
        scrollMarginTop: '80px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#E8E8E8',
          marginBottom: '2.5rem',
          letterSpacing: '-0.03em',
        }}
      >
        Skills
      </h2>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2.5rem',
          marginBottom: '2.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid #1F1F1F',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '3.5rem',
              fontWeight: 700,
              color: '#63E6A0',
              lineHeight: 1,
            }}
          >
            {years}+
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888', marginTop: '0.5rem' }}>
            years of professional experience
          </div>
        </div>
        <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: '#1F1F1F' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#888888' }}>
          counting live since <span style={{ color: '#E8E8E8' }}>{startYear}</span> — present
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1px',
          backgroundColor: '#1F1F1F',
          border: '1px solid #1F1F1F',
        }}
      >
        {groups.map((group) => (
          <div key={group.label} style={{ backgroundColor: '#141414', padding: '1.5rem 1.25rem' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '1rem',
              }}
            >
              {group.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {group.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#0D0D0D',
                    color: '#E8E8E8',
                    borderRadius: '2px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
