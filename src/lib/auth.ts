import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function getCurrentUserOrgId(): Promise<string | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  // Fetch organization_id from the public.users table
  const { data: dbUser, error: dbError } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (dbError || !dbUser) {
    console.error('Error fetching user organization:', dbError)
    return null
  }

  return dbUser.organization_id
}

export async function getCurrentUserRole(): Promise<string | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  const { data: dbUser, error: dbError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbError || !dbUser) {
    console.error('Error fetching user role:', dbError)
    return null
  }

  return dbUser.role
}
