import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // Get user role to determine cleanup strategy
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    const userRole = roleData?.role

    // Delete profile picture from storage if exists
    const { data: files } = await supabaseAdmin.storage
      .from('profile_pictures')
      .list(userId)

    if (files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`)
      await supabaseAdmin.storage
        .from('profile_pictures')
        .remove(filePaths)
    }

    // Role-specific cleanup
    if (userRole === 'service_provider') {
      // Delete provider profile
      await supabaseAdmin
        .from('provider_profiles')
        .delete()
        .eq('user_id', userId)

      // Delete job requests
      await supabaseAdmin
        .from('job_requests')
        .delete()
        .eq('provider_id', userId)

      // Delete ratings
      await supabaseAdmin
        .from('provider_ratings')
        .delete()
        .eq('provider_id', userId)
    } else if (userRole === 'homeowner') {
      // Delete jobs posted by homeowner
      await supabaseAdmin
        .from('jobs')
        .delete()
        .eq('posted_by', userId)

      // Delete ratings given by homeowner
      await supabaseAdmin
        .from('provider_ratings')
        .delete()
        .eq('homeowner_id', userId)
    }

    // Delete user role
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    // Delete auth user account (admin operation)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
