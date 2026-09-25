// Server-side (SSR/route handlers) runs inside the web container, where the API is
// reachable at its Docker service name, not `localhost` — API_INTERNAL_URL covers that.
// Client-side (the browser) always uses NEXT_PUBLIC_API_URL, since it runs on the host.
const API =
  typeof window === 'undefined'
    ? process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export interface Post {
  id: string;
  type: string;
  status: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: Record<string, unknown> | null;
  featured_image_url: string | null;
  is_featured: boolean;
  author_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  read_time?: number;
  categories?: string[];
  tags?: string[];
}

export interface PostsResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
}

export interface SkillGroup {
  label: string;
  tags: string[];
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  hero?: { badge: string; tagline: string };
  skills?: { careerStart: string; groups: SkillGroup[] };
  contact?: { email: string; headline?: string; socials: SocialLink[] };
}

export interface Project {
  id: string;
  title: string;
  excerpt: string | null;
  tags: string[];
  github_url: string | null;
  sort_order: number;
}

export interface Service {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface CourseLessonSummary {
  id: string;
  day_number: number;
  title: string;
  duration_minutes: number;
  summary: string | null;
  completed: boolean;
}

export interface CoursePhase {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: CourseLessonSummary[];
}

export interface CourseDetail extends Course {
  phases: CoursePhase[];
  authenticated: boolean;
}

export interface SlideDeck {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  slide_count: number;
  sort_order: number;
}

export interface Slide {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  notes: Record<string, unknown> | null;
  sort_order: number;
}

export interface SlideDeckDetail extends SlideDeck {
  slides: Slide[];
}

export interface CourseLessonFull {
  id: string;
  title: string;
  duration_minutes: number;
  summary: string | null;
  content: Record<string, unknown> | null;
  day_number: number;
  phase_title: string;
  course_title: string;
  course_slug: string;
  completed: boolean;
}
