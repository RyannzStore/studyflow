import Link from 'next/link';
import { EmptyIllustration } from '@/components/svg/EmptyState';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="card max-w-md p-8 text-center">
        <div className="flex justify-center">
          <EmptyIllustration size={150} />
        </div>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-slate-500">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 px-5 text-[15px] font-semibold text-white shadow-glow"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
