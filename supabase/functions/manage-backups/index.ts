import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALL_TABLES = [
  'courses', 'course_sections', 'lessons', 'students', 'teachers', 'profiles',
  'user_roles', 'subscriptions', 'timetable_entries', 'attendance', 'announcements',
  'notifications', 'chats', 'chat_messages', 'support_tickets', 'certificates',
  'student_progress', 'invoices', 'pricing_packages', 'landing_content',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
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

    const body = await req.json()
    const { action } = body

    // ==================== CREATE BACKUP ====================
    if (action === 'create_backup') {
      const { name, format, tables: requestedTables } = body as { name: string; format: 'json' | 'sql' | 'csv'; tables?: string[] }
      
      // Use requested tables or default to all
      const tablesToExport = requestedTables && requestedTables.length > 0
        ? ALL_TABLES.filter(t => requestedTables.includes(t))
        : ALL_TABLES

      // Fetch data for selected tables
      const exportData: Record<string, any[]> = {}
      for (const table of tablesToExport) {
        const { data } = await adminClient.from(table).select('*')
        exportData[table] = data || []
      }

      // Also include app settings from localStorage (passed from client)
      if (body.appSettings) {
        exportData['_app_settings'] = [body.appSettings]
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
        // SQL format
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
      const filePath = `${fileName}`

      const { error: uploadError } = await adminClient.storage
        .from('backups')
        .upload(filePath, new TextEncoder().encode(fileContent), {
          contentType: mimeType,
          upsert: true,
        })

      if (uploadError) {
        return new Response(JSON.stringify({ error: uploadError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Count records
      const totalRecords = Object.values(exportData).reduce((sum, rows) => sum + rows.length, 0)

      return new Response(JSON.stringify({
        success: true,
        file: fileName,
        format: ext,
        size: fileContent.length,
        total_records: totalRecords,
        tables: Object.fromEntries(Object.entries(exportData).map(([k, v]) => [k, v.length])),
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

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
