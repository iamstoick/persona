import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'gv_db',
  user: process.env.POSTGRES_USER || 'gv_user',
  password: process.env.POSTGRES_PASSWORD || 'changeme',
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Default admin user (google_id placeholder — will be overwritten on first OAuth login)
    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE email = 'gerald@geraldvillorente.com'"
    );

    let adminId;
    if (existing.length === 0) {
      const { rows } = await client.query(
        `INSERT INTO users (google_id, email, name, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id`,
        ['REPLACE_WITH_REAL_GOOGLE_ID', 'gerald@geraldvillorente.com', 'Gerald Villorente']
      );
      adminId = rows[0].id;
      console.log('Created admin user:', adminId);
    } else {
      adminId = existing[0].id;
      console.log('Admin user already exists:', adminId);
    }

    // Primary navigation menu
    const { rows: menuRows } = await client.query(
      `INSERT INTO menus (name) VALUES ('primary_nav')
       ON CONFLICT DO NOTHING
       RETURNING id`
    );

    if (menuRows.length > 0) {
      const menuId = menuRows[0].id;
      const navItems = [
        { label: 'Home', url: '/', order: 1 },
        { label: 'Blog', url: '/blog', order: 2 },
        { label: 'Projects', url: '/projects', order: 3 },
        { label: 'Contact', url: '/contact', order: 4 },
      ];

      for (const item of navItems) {
        await client.query(
          `INSERT INTO menu_items (menu_id, label, url, "order")
           VALUES ($1, $2, $3, $4)`,
          [menuId, item.label, item.url, item.order]
        );
      }
      console.log('Seeded primary_nav menu.');
    }

    // Seed categories
    const categories = [
      { name: 'Engineering', slug: 'engineering' },
      { name: 'DevOps', slug: 'devops' },
      { name: 'Drupal', slug: 'drupal' },
      { name: 'Leadership', slug: 'leadership' },
      { name: 'Projects', slug: 'projects' },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug]
      );
    }
    console.log('Seeded categories.');

    // Sample published post
    await client.query(
      `INSERT INTO posts (type, status, slug, title, excerpt, is_featured, author_id, published_at, content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
       ON CONFLICT (slug) DO NOTHING`,
      [
        'post',
        'published',
        'hello-world',
        'Starting Over in Public',
        'Why I rebuilt my site from scratch — and what I learned shipping software at scale while nobody was watching.',
        true,
        adminId,
        JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Every engineer has a graveyard of personal projects — half-finished ideas, overly ambitious rewrites, and portfolio sites that never shipped. This is the one that did.',
                },
              ],
            },
          ],
        }),
      ]
    );
    console.log('Seeded sample post.');

    // Default site settings (hero, skills, contact) — editable later from /admin/settings
    const defaultSettings = {
      hero: {
        badge: 'Senior Engineer · Drupal · DevOps',
        tagline: 'Support infrastructure. Ship things that scale.',
      },
      skills: {
        careerStart: '2013-06-01',
        groups: [
          { label: 'CMS & Platform', tags: ['Drupal 10/11', 'PHP', 'Symfony', 'Composer'] },
          { label: 'DevOps & Infra', tags: ['Kubernetes', 'Terraform', 'Docker', 'GCP', 'AWS'] },
          { label: 'Pipelines', tags: ['GitHub Actions', 'CircleCI', 'Jenkins', 'ArgoCD'] },
          { label: 'Observability', tags: ['Grafana', 'Prometheus', 'ELK', 'New Relic'] },
        ],
      },
      contact: {
        email: 'gerald@geraldvillorente.com',
        socials: [
          { label: 'GitHub', href: 'https://github.com/geraldvillorente' },
          { label: 'LinkedIn', href: 'https://linkedin.com/in/geraldvillorente' },
          { label: 'X', href: 'https://twitter.com/geraldvillorente' },
        ],
      },
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await client.query(
        `INSERT INTO site_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(value)]
      );
    }
    console.log('Seeded site settings.');

    // Default projects
    const { rows: projectCount } = await client.query('SELECT COUNT(*) FROM projects');
    if (parseInt(projectCount[0].count) === 0) {
      const defaultProjects = [
        {
          title: 'geraldvillorente.com',
          excerpt: 'Personal site built on Next.js 16, Express 5, and PostgreSQL. Monorepo, Docker-first, deployed on a VPS.',
          tags: ['next.js', 'express', 'postgresql', 'docker'],
          githubUrl: 'https://github.com/geraldvillorente/geraldvillorente.com',
        },
        {
          title: 'Drupal CI Pipeline',
          excerpt: 'Reusable GitHub Actions workflow for Drupal — automated testing, code quality checks, and Pantheon deployments.',
          tags: ['drupal', 'github-actions', 'pantheon', 'php'],
          githubUrl: 'https://github.com/geraldvillorente/drupal-ci-pipeline',
        },
      ];
      for (const [i, p] of defaultProjects.entries()) {
        await client.query(
          `INSERT INTO projects (title, excerpt, tags, github_url, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [p.title, p.excerpt, p.tags, p.githubUrl, i]
        );
      }
      console.log('Seeded default projects.');
    }

    // Default services
    const { rows: serviceCount } = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(serviceCount[0].count) === 0) {
      const defaultServices = [
        { title: 'Drupal architecture & audits', description: 'Site-building review, performance audits, and upgrade paths to Drupal 10/11.' },
        { title: 'DevOps & CI/CD setup', description: 'Pipelines, containerization, and Kubernetes deployments built for your team’s workflow.' },
        { title: 'Fractional platform engineering', description: 'Ongoing, part-time engineering support for teams that need senior coverage without a full hire.' },
      ];
      for (const [i, s] of defaultServices.entries()) {
        await client.query(
          `INSERT INTO services (title, description, sort_order) VALUES ($1, $2, $3)`,
          [s.title, s.description, i]
        );
      }
      console.log('Seeded default services.');
    }

    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
