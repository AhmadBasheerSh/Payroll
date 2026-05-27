import { supabase } from '@/lib/supabase'

export async function listNotifications() {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
  return { data, error }
}

export async function markAllNotificationsRead() {
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('read', false)
  return { data, error }
}

export async function markNotificationRead(id: string) {
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  return { data, error }
}
