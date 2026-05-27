import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { data, error } = await supabase.from('branches').select('*')

  console.log('Supabase branches fetch:', { data, error })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ branches: data ?? [] })
}
