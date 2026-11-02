import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { ProfileMissing } from '@/components/layout/ProfileMissing';
import type { Profile } from '@/lib/types';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, class_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return <ProfileMissing />;

  return <AppShell profile={profile as Profile}>{children}</AppShell>;
}
