import type { Course } from '@/lib/api';

const DEFAULT_COURSES: Course[] = [
  {
    id: 'default-1',
    slug: 'ai-from-zero-to-hero',
    title: 'AI: From Zero to Hero',
    description: 'A 20-day, phase-by-phase course for newcomers who want to use AI to work faster and smarter — never more than an hour a day.',
    sort_order: 0,
  },
];

interface Props {
  courses?: Course[];
}

export function Courses({ courses = DEFAULT_COURSES }: Props) {
  return (
    <section
      id="courses"
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
        Courses
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {courses.map((course) => (
          <a
            key={course.id}
            href={`/courses/${course.slug}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.75rem',
              backgroundColor: '#141414',
              border: '1px solid #1F1F1F',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#63E6A0' }}>
              free for registered users
            </span>
            <h3
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#E8E8E8',
                margin: 0,
              }}
            >
              {course.title}
            </h3>
            {course.description && (
              <p style={{ color: '#888888', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                {course.description}
              </p>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#63E6A0', marginTop: 'auto' }}>
              View course →
            </span>
          </a>
        ))}
      </div>

      <div className="mobile-view-all" style={{ marginTop: '2rem' }}>
        <a href="/courses" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#63E6A0', textDecoration: 'none' }}>
          View all courses →
        </a>
      </div>
    </section>
  );
}
