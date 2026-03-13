import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.test("drop all students", async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  
  const { data: studentRoles } = await adminClient
    .from('user_roles')
    .select('user_id')
    .eq('role', 'student');
  
  console.log(`Found ${studentRoles?.length || 0} students`);
  
  if (!studentRoles || studentRoles.length === 0) {
    console.log('No students to delete');
    return;
  }

  let deleted = 0;
  const errors: string[] = [];
  
  for (const { user_id } of studentRoles) {
    try {
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) { errors.push(`${user_id}: ${error.message}`); }
      else { deleted++; }
    } catch (e: any) { errors.push(`${user_id}: ${e.message}`); }
  }
  
  console.log(`Deleted ${deleted}/${studentRoles.length} students`);
  if (errors.length > 0) console.log('Errors:', errors);
});
