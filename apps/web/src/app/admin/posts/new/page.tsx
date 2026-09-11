import { PostForm } from '@/components/PostForm';

export default function NewPostPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8', marginBottom: '2rem' }}>
        New post
      </h1>
      <PostForm />
    </div>
  );
}
