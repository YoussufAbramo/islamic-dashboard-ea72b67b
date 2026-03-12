export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          content_ar: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          scheduled_at: string | null
          target_audience: string | null
          title: string
          title_ar: string | null
        }
        Insert: {
          content: string
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          scheduled_at?: string | null
          target_audience?: string | null
          title: string
          title_ar?: string | null
        }
        Update: {
          content?: string
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          scheduled_at?: string | null
          target_audience?: string | null
          title?: string
          title_ar?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          status: string
          student_id: string
          timetable_entry_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id: string
          timetable_entry_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          timetable_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_timetable_entry_id_fkey"
            columns: ["timetable_entry_id"]
            isOneToOne: false
            referencedRelation: "timetable_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auto_backup_config: {
        Row: {
          enabled: boolean
          format: string
          id: string
          retention_count: number
          schedule: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          format?: string
          id?: string
          retention_count?: number
          schedule?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          format?: string
          id?: string
          retention_count?: number
          schedule?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string | null
          content_ar: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          excerpt_ar: string | null
          featured_image: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          excerpt_ar?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          excerpt_ar?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          issued_at: string
          issued_by: string | null
          recipient_id: string
          recipient_type: string
          status: string
          title: string
          title_ar: string | null
        }
        Insert: {
          certificate_number?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          recipient_id: string
          recipient_type?: string
          status?: string
          title: string
          title_ar?: string | null
        }
        Update: {
          certificate_number?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          recipient_id?: string
          recipient_type?: string
          status?: string
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_members: {
        Row: {
          chat_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          is_deleted: boolean
          message: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          message: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_profiles_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          is_group: boolean
          is_suspended: boolean
          name: string | null
          student_id: string | null
          subscription_id: string | null
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean
          is_suspended?: boolean
          name?: string | null
          student_id?: string | null
          subscription_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean
          is_suspended?: boolean
          name?: string | null
          student_id?: string | null
          subscription_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      course_categories: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          parent_id: string | null
          sort_order: number
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          parent_id?: string | null
          sort_order?: number
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          parent_id?: string | null
          sort_order?: number
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      course_levels: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          sort_order: number
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          sort_order?: number
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          sort_order?: number
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_sections: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sort_order: number
          title: string
          title_ar: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
          title_ar?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_tracks: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          sort_order: number
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          sort_order?: number
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          sort_order?: number
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          duration_weeks: number | null
          id: string
          image_url: string | null
          level_id: string | null
          skill_level: string
          status: string
          title: string
          title_ar: string | null
          track_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          duration_weeks?: number | null
          id?: string
          image_url?: string | null
          level_id?: string | null
          skill_level?: string
          status?: string
          title: string
          title_ar?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          duration_weeks?: number | null
          id?: string
          image_url?: string | null
          level_id?: string | null
          skill_level?: string
          status?: string
          title?: string
          title_ar?: string | null
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "course_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_cycle: string
          course_id: string | null
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          original_price: number | null
          paid_at: string | null
          sale_price: number | null
          share_token: string
          status: string
          student_id: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          course_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          original_price?: number | null
          paid_at?: string | null
          sale_price?: number | null
          share_token?: string
          status?: string
          student_id: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          course_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          original_price?: number | null
          paid_at?: string | null
          sale_price?: number | null
          share_token?: string
          status?: string
          student_id?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_content: {
        Row: {
          content: Json
          id: string
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_sections: {
        Row: {
          course_section_id: string
          created_at: string
          id: string
          sort_order: number
          title: string
          title_ar: string | null
        }
        Insert: {
          course_section_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
          title_ar?: string | null
        }
        Update: {
          course_section_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
          title_ar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sections_course_section_id_fkey"
            columns: ["course_section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          section_id: string
          sort_order: number
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          section_id: string
          sort_order?: number
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          section_id?: string
          sort_order?: number
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "lesson_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_gateway_config: {
        Row: {
          encrypted_keys: Json
          gateway_id: string
          id: string
          is_active: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          encrypted_keys?: Json
          gateway_id: string
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          encrypted_keys?: Json
          gateway_id?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          content: string | null
          content_ar: string | null
          id: string
          is_published: boolean
          slug: string
          title: string
          title_ar: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          content_ar?: string | null
          id?: string
          is_published?: boolean
          slug: string
          title: string
          title_ar?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          content_ar?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      pricing_packages: {
        Row: {
          billing_cycle: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          is_featured: boolean
          max_courses: number
          max_students: number
          max_teachers: number
          regular_price: number
          sale_price: number | null
          sort_order: number
          subtitle: string | null
          subtitle_ar: string | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_courses?: number
          max_students?: number
          max_teachers?: number
          regular_price?: number
          sale_price?: number | null
          sort_order?: number
          subtitle?: string | null
          subtitle_ar?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_courses?: number
          max_students?: number
          max_teachers?: number
          regular_price?: number
          sale_price?: number | null
          sort_order?: number
          subtitle?: string | null
          subtitle_ar?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          score: number | null
          student_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          score?: number | null
          student_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          assigned_teacher_id: string | null
          created_at: string
          id: string
          lesson_duration: number | null
          user_id: string
          weekly_repeat: number | null
        }
        Insert: {
          assigned_teacher_id?: string | null
          created_at?: string
          id?: string
          lesson_duration?: number | null
          user_id: string
          weekly_repeat?: number | null
        }
        Update: {
          assigned_teacher_id?: string | null
          created_at?: string
          id?: string
          lesson_duration?: number | null
          user_id?: string
          weekly_repeat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          course_id: string
          created_at: string
          id: string
          lesson_duration: number | null
          price: number | null
          renewal_date: string | null
          schedule_days: string[] | null
          schedule_time: string | null
          start_date: string
          status: string
          student_id: string
          subscription_type: string
          teacher_id: string | null
          updated_at: string
          weekly_lessons: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          lesson_duration?: number | null
          price?: number | null
          renewal_date?: string | null
          schedule_days?: string[] | null
          schedule_time?: string | null
          start_date?: string
          status?: string
          student_id: string
          subscription_type?: string
          teacher_id?: string | null
          updated_at?: string
          weekly_lessons?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          lesson_duration?: number | null
          price?: number | null
          renewal_date?: string | null
          schedule_days?: string[] | null
          schedule_time?: string | null
          start_date?: string
          status?: string
          student_id?: string
          subscription_type?: string
          teacher_id?: string | null
          updated_at?: string
          weekly_lessons?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_departments: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      support_priorities: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          department: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          priority: string
          resolution_notes: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          department?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          priority?: string
          resolution_notes?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          department?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          priority?: string
          resolution_notes?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          specialization: string | null
          user_id: string
          weekly_schedule: Json | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          specialization?: string | null
          user_id: string
          weekly_schedule?: Json | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          specialization?: string | null
          user_id?: string
          weekly_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          course_id: string | null
          created_at: string
          duration_minutes: number
          id: string
          lesson_id: string | null
          scheduled_at: string
          status: string
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lesson_id?: string | null
          scheduled_at: string
          status?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lesson_id?: string | null
          scheduled_at?: string
          status?: string
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_pages: {
        Row: {
          content: string | null
          content_ar: string | null
          created_at: string
          created_by: string | null
          id: string
          slug: string
          status: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          slug: string
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_ar?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          slug?: string
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invoice_by_share_token: {
        Args: { _token: string }
        Returns: {
          amount: number
          billing_cycle: string
          course_id: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          notes: string
          paid_at: string
          status: string
          student_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chat_member: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_enrolled_in_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      lesson_type:
        | "table_of_content"
        | "revision"
        | "read_listen"
        | "memorization"
        | "exercise_text_match"
        | "exercise_choose_correct"
        | "exercise_choose_multiple"
        | "exercise_rearrange"
        | "exercise_missing_text"
        | "exercise_true_false"
        | "exercise_listen_choose"
        | "homework"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
      lesson_type: [
        "table_of_content",
        "revision",
        "read_listen",
        "memorization",
        "exercise_text_match",
        "exercise_choose_correct",
        "exercise_choose_multiple",
        "exercise_rearrange",
        "exercise_missing_text",
        "exercise_true_false",
        "exercise_listen_choose",
        "homework",
      ],
    },
  },
} as const
