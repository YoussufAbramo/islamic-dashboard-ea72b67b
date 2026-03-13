import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-backup-secret',
}

const ALL_TABLES = [
  'courses', 'course_sections', 'lessons', 'students', 'teachers', 'profiles',
  'user_roles', 'subscriptions', 'timetable_entries', 'attendance', 'announcements',
  'notifications', 'chats', 'chat_messages', 'support_tickets', 'certificates',
  'student_progress', 'invoices', 'pricing_packages', 'landing_content',
]

async function createBackupFile(adminClient: any, name: string, format: string, tables: string[]) {
  const exportData: Record<string, any[]> = {}
  for (const table of tables) {
    const { data } = await adminClient.from(table).select('*')
    exportData[table] = data || []
  }

  let fileContent: string
  let mimeType: string
  let ext: string

  if (format === 'json') {
    fileContent = JSON.stringify({ exported_at: new Date().toISOString(), data: exportData }, null, 2)
    mimeType = 'application/json'
    ext = 'json'
  } else if (format === 'csv') {
    let csvContent = ''
    for (const [table, rows] of Object.entries(exportData)) {
      if (!rows || rows.length === 0) continue
      const headers = Object.keys(rows[0])
      csvContent += `\n=== ${table} ===\n`
      csvContent += headers.join(',') + '\n'
      rows.forEach(row => {
        csvContent += headers.map(h => {
          const val = row[h]
          if (val === null) return ''
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(',') + '\n'
      })
    }
    fileContent = csvContent
    mimeType = 'text/csv'
    ext = 'csv'
  } else {
    let sqlContent = `-- Backup generated at ${new Date().toISOString()}\n-- Platform Full Backup\n\n`
    for (const [table, rows] of Object.entries(exportData)) {
      if (!rows || rows.length === 0 || table.startsWith('_')) continue
      sqlContent += `-- Table: ${table}\n`
      for (const row of rows) {
        const cols = Object.keys(row)
        const vals = cols.map(c => {
          const v = row[c]
          if (v === null) return 'NULL'
          if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
          if (typeof v === 'number') return String(v)
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`
          return `'${String(v).replace(/'/g, "''")}'`
        })
        sqlContent += `INSERT INTO public.${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`
      }
      sqlContent += '\n'
    }
    fileContent = sqlContent
    mimeType = 'application/sql'
    ext = 'sql'
  }

  const fileName = `${name}.${ext}`
  const { error: uploadError } = await adminClient.storage
    .from('backups')
    .upload(fileName, new TextEncoder().encode(fileContent), {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) throw new Error(uploadError.message)

  const totalRecords = Object.values(exportData).reduce((sum, rows) => sum + rows.length, 0)
  return { fileName, ext, size: fileContent.length, totalRecords, tables: Object.fromEntries(Object.entries(exportData).map(([k, v]) => [k, v.length])) }
}

async function enforceRetention(adminClient: any, retentionCount: number) {
  const { data: files } = await adminClient.storage.from('backups').list('', {
    limit: 500,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  const autoFiles = (files || []).filter((f: any) => f.name.startsWith('auto-backup-') && f.name !== '.emptyFolderPlaceholder')

  if (autoFiles.length > retentionCount) {
    const toDelete = autoFiles.slice(retentionCount).map((f: any) => f.name)
    if (toDelete.length > 0) {
      await adminClient.storage.from('backups').remove(toDelete)
    }
    return toDelete.length
  }
  return 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const body = await req.json()
    const { action } = body

    // ==================== RUN AUTO BACKUP (called by cron) ====================
    if (action === 'run_auto_backup') {
      // Accept: x-backup-secret header OR Authorization with anon/service key
      const cronSecret = Deno.env.get('BACKUP_CRON_SECRET')
      const providedSecret = req.headers.get('x-backup-secret')
      const authHeader = req.headers.get('Authorization') || ''
      
      console.log('Auth debug:', { 
        hasSecret: !!providedSecret, 
        secretMatch: cronSecret && providedSecret === cronSecret,
        authHeaderPrefix: authHeader.substring(0, 20),
        anonKeyPrefix: anonKey.substring(0, 20),
        anonKeyMatch: authHeader === `Bearer ${anonKey}`,
      })
      
      const secretValid = cronSecret && providedSecret === cronSecret
      const keyValid = authHeader === `Bearer ${anonKey}` || authHeader === `Bearer ${serviceRoleKey}`
      
      if (!secretValid && !keyValid) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey)

      // Check if auto backup is enabled
      const { data: config } = await adminClient.from('auto_backup_config').select('*').limit(1).single()
      if (!config || !config.enabled) {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Auto backup is disabled' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const now = new Date()

      // Check scheduled_time: only run if current UTC hour matches the configured hour
      const scheduledTime = config.scheduled_time || '02:00'
      const [scheduledHour] = scheduledTime.split(':').map(Number)
      const currentHour = now.getUTCHours()
      
      if (currentHour !== scheduledHour) {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: `Not scheduled hour (current: ${currentHour}, scheduled: ${scheduledHour})` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Check schedule: daily runs every time, weekly only on Sundays, monthly on 1st
      const dayOfWeek = now.getUTCDay() // 0 = Sunday
      const dayOfMonth = now.getUTCDate()

      if (config.schedule === 'weekly' && dayOfWeek !== 0) {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Not scheduled day (weekly)' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (config.schedule === 'monthly' && dayOfMonth !== 1) {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: 'Not scheduled day (monthly)' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Create the backup
      const dateStr = now.toISOString().slice(0, 10)
      const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '-')
      const backupName = `auto-backup-${dateStr}_${timeStr}`

      const result = await createBackupFile(adminClient, backupName, config.format || 'json', ALL_TABLES)

      // Enforce retention
      const deleted = await enforceRetention(adminClient, config.retention_count || 7)

      return new Response(JSON.stringify({ success: true, ...result, retention_deleted: deleted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // All other actions require admin auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', caller.id).single()
    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== CREATE BACKUP ====================
    if (action === 'create_backup') {
      const { name, format, tables: requestedTables } = body as { name: string; format: 'json' | 'sql' | 'csv'; tables?: string[] }

      const tablesToExport = requestedTables && requestedTables.length > 0
        ? ALL_TABLES.filter(t => requestedTables.includes(t))
        : ALL_TABLES

      const result = await createBackupFile(adminClient, name, format, tablesToExport)

      return new Response(JSON.stringify({
        success: true,
        file: result.fileName,
        format: result.ext,
        size: result.size,
        total_records: result.totalRecords,
        tables: result.tables,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== LIST BACKUPS ====================
    if (action === 'list_backups') {
      const { data, error } = await adminClient.storage.from('backups').list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const backups = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
        name: f.name,
        size: f.metadata?.size || 0,
        created_at: f.created_at,
        format: f.name.split('.').pop() || 'unknown',
      }))

      return new Response(JSON.stringify({ success: true, backups }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== DELETE BACKUP ====================
    if (action === 'delete_backup') {
      const { fileName } = body
      const { error } = await adminClient.storage.from('backups').remove([fileName])
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== DOWNLOAD BACKUP ====================
    if (action === 'download_backup') {
      const { fileName } = body
      const { data, error } = await adminClient.storage.from('backups').createSignedUrl(fileName, 300)
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ success: true, url: data.signedUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== TEST AUTO BACKUP (manual trigger for testing) ====================
    if (action === 'test_auto_backup') {
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '-')
      const backupName = `auto-backup-${dateStr}_${timeStr}`

      const { data: config } = await adminClient.from('auto_backup_config').select('*').limit(1).single()
      const format = config?.format || 'json'
      const retentionCount = config?.retention_count || 7

      const result = await createBackupFile(adminClient, backupName, format, ALL_TABLES)
      const deleted = await enforceRetention(adminClient, retentionCount)

      return new Response(JSON.stringify({
        success: true,
        ...result,
        retention_deleted: deleted,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('manage-backups error:', err)
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
