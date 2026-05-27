import { supabase } from '@/lib/supabase'

export async function listBranches() {
  const { data, error } = await supabase.from('branches').select('*')
  return { data, error }
}

export async function addBranch(name: string) {
  const { data, error } = await supabase.from('branches').insert({ name })
  return { data, error }
}

export async function updateBranch(id: string, name: string) {
  const { data, error } = await supabase.from('branches').update({ name }).eq('id', id)
  return { data, error }
}

export async function deleteBranch(id: string) {
  const { data, error } = await supabase.from('branches').delete().eq('id', id)
  return { data, error }
}
