import { Hero } from '@/components/Hero';
import { Skills } from '@/components/Skills';
import { Projects } from '@/components/Projects';
import { Writing } from '@/components/Writing';
import { Services } from '@/components/Services';
import { Courses } from '@/components/Courses';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { apiFetch, Post, PostsResponse, SiteSettings, Project, Service, Course } from '@/lib/api';

// Render on every request rather than prerendering at build time: `next build` runs in
// a stage with no network route to the api container, so a build-time ISR snapshot of
// this page always bakes in the empty/fallback data (no featured post, no projects, etc.)
// and only self-heals up to an hour later when the ISR window happens to revalidate.
// The api layer already caches its own responses (Redis), so this stays cheap.
export const dynamic = 'force-dynamic';

async function getHomeData() {
  const [postsResult, settings, projects, services, courses] = await Promise.all([
    Promise.all([
      apiFetch<Post>('/api/posts/featured'),
      apiFetch<PostsResponse>('/api/posts?type=post&status=published&limit=3'),
    ])
      .then(([featured, posts]) => ({ featured, posts: posts.data }))
      .catch(() => ({ featured: null as Post | null, posts: [] as Post[] })),
    apiFetch<SiteSettings>('/api/settings').catch(() => ({} as SiteSettings)),
    apiFetch<Project[]>('/api/projects').catch(() => undefined),
    apiFetch<Service[]>('/api/services').catch(() => undefined),
    apiFetch<Course[]>('/api/courses').catch(() => undefined),
  ]);

  return { ...postsResult, settings, projects, services, courses };
}

export default async function HomePage() {
  const { featured, posts, settings, projects, services, courses } = await getHomeData();

  return (
    <>
      <Hero badge={settings.hero?.badge} tagline={settings.hero?.tagline} />
      <Skills careerStart={settings.skills?.careerStart} groups={settings.skills?.groups} />
      <Projects projects={projects} />
      <Writing featured={featured} posts={posts} />
      <Services services={services} />
      <Courses courses={courses} />
      <Contact
        email={settings.contact?.email}
        headline={settings.contact?.headline}
        socials={settings.contact?.socials}
      />
      <Footer />
    </>
  );
}
