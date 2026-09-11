import { Hero } from '@/components/Hero';
import { Skills } from '@/components/Skills';
import { Projects } from '@/components/Projects';
import { Writing } from '@/components/Writing';
import { Services } from '@/components/Services';
import { Courses } from '@/components/Courses';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { apiFetch, Post, PostsResponse, SiteSettings, Project, Service, Course } from '@/lib/api';

// Revalidate hourly: fresh enough for admin edits to show up, avoids a fetch to the API on every request.
export const revalidate = 3600;

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
