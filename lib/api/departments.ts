import { supabase } from '@/lib/supabase'

export async function listDepartments() {
  const { data, error } = await supabase.from('departments').select('*')
  return { data, error }
}

export async function addDepartment(name: string) {
  const { data, error } = await supabase.from('departments').insert({ name })
  return { data, error }
}

export async function updateDepartment(id: string, name: string) {
  const { data, error } = await supabase.from('departments').update({ name }).eq('id', id)
  return { data, error }
}

export async function deleteDepartment(id: string) {
  const { data, error } = await supabase.from('departments').delete().eq('id', id)
  return { data, error }
}
