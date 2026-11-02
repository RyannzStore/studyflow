import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StudyFlow — X TKJ 1',
    short_name: 'StudyFlow',
    description: 'Organize Your School Life.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f5f9',
    theme_color: '#4f46e5',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
