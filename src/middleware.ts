import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Gerbang autentikasi:
 *  - belum login → /login
 *  - sudah login tapi wajib ganti password (password sementara) → /ganti-password
 *  - me-refresh cookie sesi Supabase di setiap request
 * Flag `must_change_password` ada di app_metadata (hanya bisa diubah server).
 */
function redirectTo(request: NextRequest, source: NextResponse, pathname: string, search = '') {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const res = NextResponse.redirect(url);
  source.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isApi = path.startsWith('/api/');
  const isLogin = path === '/login';
  const mustChange = user?.app_metadata?.must_change_password === true;

  if (!user) {
    if (isLogin) return response;
    if (isApi) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });
    const next = path === '/' ? '' : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return redirectTo(request, response, '/login', next);
  }

  if (isLogin) return redirectTo(request, response, mustChange ? '/ganti-password' : '/');

  if (mustChange && !isApi && path !== '/ganti-password') {
    return redirectTo(request, response, '/ganti-password');
  }

  if (!mustChange && path === '/ganti-password') {
    return redirectTo(request, response, '/pengaturan');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
