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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_label: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          added_by: string | null
          added_by_email: string | null
          created_at: string
          email: string
          id: string
          note: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          added_by?: string | null
          added_by_email?: string | null
          created_at?: string
          email: string
          id?: string
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          added_by?: string | null
          added_by_email?: string | null
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      applications: {
        Row: {
          business_confirmed: boolean
          confirmation_message: string | null
          created_at: string
          id: string
          job_id: string
          match_score: number
          matched_criteria: Json
          message: string | null
          offer_type: string
          owner_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          worker_confirmed: boolean
          worker_id: string
        }
        Insert: {
          business_confirmed?: boolean
          confirmation_message?: string | null
          created_at?: string
          id?: string
          job_id: string
          match_score?: number
          matched_criteria?: Json
          message?: string | null
          offer_type?: string
          owner_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_confirmed?: boolean
          worker_id: string
        }
        Update: {
          business_confirmed?: boolean
          confirmation_message?: string | null
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number
          matched_criteria?: Json
          message?: string | null
          offer_type?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_confirmed?: boolean
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      banned_identities: {
        Row: {
          banned_by: string | null
          banned_by_email: string | null
          banned_user_id: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          reason: string | null
        }
        Insert: {
          banned_by?: string | null
          banned_by_email?: string | null
          banned_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          reason?: string | null
        }
        Update: {
          banned_by?: string | null
          banned_by_email?: string | null
          banned_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      business_contacts: {
        Row: {
          contact_name: string | null
          contact_position: string | null
          created_at: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          contact_position?: string | null
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string | null
          contact_position?: string | null
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_documents: {
        Row: {
          created_at: string
          doc_type: string | null
          document_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          document_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          document_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_locations: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          admin_notes: string
          alvara: string | null
          area: string | null
          avatar_url: string | null
          business_name: string | null
          categories: Json
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          display_initials: string
          facebook_url: string | null
          google_maps_url: string | null
          id: string
          instagram_url: string | null
          is_early_bird: boolean
          languages_required: Json
          nif: string
          preferred_roles: Json
          rating: number
          rating_count: number
          sub_sector: string
          tiktok_url: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          admin_notes?: string
          alvara?: string | null
          area?: string | null
          avatar_url?: string | null
          business_name?: string | null
          categories?: Json
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          display_initials?: string
          facebook_url?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_url?: string | null
          is_early_bird?: boolean
          languages_required?: Json
          nif?: string
          preferred_roles?: Json
          rating?: number
          rating_count?: number
          sub_sector?: string
          tiktok_url?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          admin_notes?: string
          alvara?: string | null
          area?: string | null
          avatar_url?: string | null
          business_name?: string | null
          categories?: Json
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          display_initials?: string
          facebook_url?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_url?: string | null
          is_early_bird?: boolean
          languages_required?: Json
          nif?: string
          preferred_roles?: Json
          rating?: number
          rating_count?: number
          sub_sector?: string
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      confirmation_window: {
        Row: {
          auto_expiry: boolean
          created_at: string
          end_time: string
          id: number
          reminder_30min: boolean
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          auto_expiry?: boolean
          created_at?: string
          end_time?: string
          id?: number
          reminder_30min?: boolean
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          auto_expiry?: boolean
          created_at?: string
          end_time?: string
          id?: number
          reminder_30min?: boolean
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_reveals: {
        Row: {
          business_id: string
          created_at: string
          id: string
          worker_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          worker_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          worker_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          application_id: string
          business_agreed: boolean
          business_ended: boolean
          business_id: string
          created_at: string
          id: string
          job_id: string
          location_shared: boolean
          status: Database["public"]["Enums"]["conversation_status"]
          updated_at: string
          worker_agreed: boolean
          worker_ended: boolean
          worker_id: string
        }
        Insert: {
          application_id: string
          business_agreed?: boolean
          business_ended?: boolean
          business_id: string
          created_at?: string
          id?: string
          job_id: string
          location_shared?: boolean
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          worker_agreed?: boolean
          worker_ended?: boolean
          worker_id: string
        }
        Update: {
          application_id?: string
          business_agreed?: boolean
          business_ended?: boolean
          business_id?: string
          created_at?: string
          id?: string
          job_id?: string
          location_shared?: boolean
          status?: Database["public"]["Enums"]["conversation_status"]
          updated_at?: string
          worker_agreed?: boolean
          worker_ended?: boolean
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          assigned_admin_id: string | null
          assigned_admin_label: string
          business_label: string
          created_at: string
          deadline: string | null
          id: string
          internal_notes: string
          issue_type: string
          priority: string
          resolution_summary: string
          status: string
          title: string
          updated_at: string
          worker_label: string
        }
        Insert: {
          assigned_admin_id?: string | null
          assigned_admin_label?: string
          business_label?: string
          created_at?: string
          deadline?: string | null
          id?: string
          internal_notes?: string
          issue_type?: string
          priority?: string
          resolution_summary?: string
          status?: string
          title: string
          updated_at?: string
          worker_label?: string
        }
        Update: {
          assigned_admin_id?: string | null
          assigned_admin_label?: string
          business_label?: string
          created_at?: string
          deadline?: string | null
          id?: string
          internal_notes?: string
          issue_type?: string
          priority?: string
          resolution_summary?: string
          status?: string
          title?: string
          updated_at?: string
          worker_label?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          body: string
          created_at: string
          error: string | null
          id: string
          recipient_email: string
          recipient_id: string | null
          status: string
          subject: string
          template_key: string | null
          triggered_by: string
        }
        Insert: {
          body: string
          created_at?: string
          error?: string | null
          id?: string
          recipient_email: string
          recipient_id?: string | null
          status?: string
          subject: string
          template_key?: string | null
          triggered_by?: string
        }
        Update: {
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          recipient_email?: string
          recipient_id?: string | null
          status?: string
          subject?: string
          template_key?: string | null
          triggered_by?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          enabled: boolean
          id: string
          name: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_catalog: {
        Row: {
          active: boolean
          created_at: string
          emoji: string
          id: string
          name: string
          skills: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          emoji?: string
          id?: string
          name: string
          skills?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          skills?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          atividade: string
          created_at: string
          date: string | null
          end_date: string | null
          end_time: string | null
          id: string
          languages: Json
          note: string | null
          owner_id: string
          rate: number
          role: string
          skills: Json
          spots: number
          spots_remaining: number
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["job_status"]
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
          working_days: Json
        }
        Insert: {
          atividade?: string
          created_at?: string
          date?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          languages?: Json
          note?: string | null
          owner_id: string
          rate?: number
          role: string
          skills?: Json
          spots?: number
          spots_remaining?: number
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
          working_days?: Json
        }
        Update: {
          atividade?: string
          created_at?: string
          date?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          languages?: Json
          note?: string | null
          owner_id?: string
          rate?: number
          role?: string
          skills?: Json
          spots?: number
          spots_remaining?: number
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
          working_days?: Json
        }
        Relationships: []
      }
      kpi_settings: {
        Row: {
          category: string
          created_at: string
          enabled: boolean
          formula: string
          frequency: string
          id: string
          is_custom: boolean
          name: string
          sort_order: number
          target: number
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          enabled?: boolean
          formula?: string
          frequency?: string
          id?: string
          is_custom?: boolean
          name: string
          sort_order?: number
          target?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          enabled?: boolean
          formula?: string
          frequency?: string
          id?: string
          is_custom?: boolean
          name?: string
          sort_order?: number
          target?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_intake: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          kind: string
          payload: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          kind: string
          payload?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          kind?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          cities: string[]
          created_at: string
          currency: string
          description: string
          id: number
          platform_name: string
          sectors: string[]
          timezone: string
          updated_at: string
        }
        Insert: {
          cities?: string[]
          created_at?: string
          currency?: string
          description?: string
          id?: number
          platform_name?: string
          sectors?: string[]
          timezone?: string
          updated_at?: string
        }
        Update: {
          cities?: string[]
          created_at?: string
          currency?: string
          description?: string
          id?: number
          platform_name?: string
          sectors?: string[]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_lists: {
        Row: {
          active: boolean
          created_at: string
          id: string
          list_key: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          list_key: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          list_key?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profile_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          profile_id: string
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_status_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          email: string
          full_name: string | null
          id: string
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: []
      }
      registration_counters: {
        Row: {
          business_count: number
          business_limit: number
          id: number
          updated_at: string
          worker_count: number
          worker_limit: number
        }
        Insert: {
          business_count?: number
          business_limit?: number
          id?: number
          updated_at?: string
          worker_count?: number
          worker_limit?: number
        }
        Update: {
          business_count?: number
          business_limit?: number
          id?: number
          updated_at?: string
          worker_count?: number
          worker_limit?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          conversation_id: string
          created_at: string
          id: string
          job_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          job_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          job_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worker_contacts: {
        Row: {
          created_at: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      worker_documents: {
        Row: {
          created_at: string
          haccp_document_url: string | null
          id_document_type: string | null
          id_document_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          haccp_document_url?: string | null
          id_document_type?: string | null
          id_document_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          haccp_document_url?: string | null
          id_document_type?: string | null
          id_document_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      worker_profiles: {
        Row: {
          admin_notes: string
          atividade: boolean
          atividade_number: string
          availability_visible: boolean
          available_days: Json
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          experience: Json
          haccp_verified: boolean
          id: string
          languages: Json
          looking_for: Json
          main_role: string | null
          main_role_years: number | null
          messages_open: boolean
          min_rate: number | null
          name: string | null
          nationality: string | null
          portfolio_url: string | null
          rating: number
          rating_count: number
          residence: string | null
          shifts_completed: number
          sub_roles: Json
          time_slots: Json
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          admin_notes?: string
          atividade?: boolean
          atividade_number?: string
          availability_visible?: boolean
          available_days?: Json
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          experience?: Json
          haccp_verified?: boolean
          id?: string
          languages?: Json
          looking_for?: Json
          main_role?: string | null
          main_role_years?: number | null
          messages_open?: boolean
          min_rate?: number | null
          name?: string | null
          nationality?: string | null
          portfolio_url?: string | null
          rating?: number
          rating_count?: number
          residence?: string | null
          shifts_completed?: number
          sub_roles?: Json
          time_slots?: Json
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          admin_notes?: string
          atividade?: boolean
          atividade_number?: string
          availability_visible?: boolean
          available_days?: Json
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          experience?: Json
          haccp_verified?: boolean
          id?: string
          languages?: Json
          looking_for?: Json
          main_role?: string | null
          main_role_years?: number | null
          messages_open?: boolean
          min_rate?: number | null
          name?: string | null
          nationality?: string | null
          portfolio_url?: string | null
          rating?: number
          rating_count?: number
          residence?: string | null
          shifts_completed?: number
          sub_roles?: Json
          time_slots?: Json
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      worker_profiles_public: {
        Row: {
          atividade: boolean | null
          available_days: Json | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          haccp_verified: boolean | null
          id: string | null
          languages: Json | null
          looking_for: Json | null
          main_role: string | null
          main_role_years: number | null
          min_rate: number | null
          name: string | null
          nationality: string | null
          portfolio_url: string | null
          rating: number | null
          rating_count: number | null
          shifts_completed: number | null
          sub_roles: Json | null
          time_slots: Json | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          atividade?: boolean | null
          available_days?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          haccp_verified?: boolean | null
          id?: string | null
          languages?: Json | null
          looking_for?: Json | null
          main_role?: string | null
          main_role_years?: number | null
          min_rate?: number | null
          name?: string | null
          nationality?: string | null
          portfolio_url?: string | null
          rating?: number | null
          rating_count?: number | null
          shifts_completed?: number | null
          sub_roles?: Json | null
          time_slots?: Json | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          atividade?: boolean | null
          available_days?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          haccp_verified?: boolean | null
          id?: string | null
          languages?: Json | null
          looking_for?: Json | null
          main_role?: string | null
          main_role_years?: number | null
          min_rate?: number | null
          name?: string | null
          nationality?: string | null
          portfolio_url?: string | null
          rating?: number | null
          rating_count?: number | null
          shifts_completed?: number | null
          sub_roles?: Json | null
          time_slots?: Json | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_email_role: {
        Args: { _email: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      claim_pending_intake: { Args: never; Returns: Json }
      confirm_application: {
        Args: { _app_id: string; _message?: string }
        Returns: string
      }
      create_private_offer: {
        Args: {
          _date: string
          _end: string
          _rate: number
          _role: string
          _start: string
          _worker_id: string
        }
        Returns: string
      }
      create_shift_offer: {
        Args: { _job_id: string; _worker_id: string }
        Returns: string
      }
      end_job: { Args: { _conversation_id: string }; Returns: undefined }
      get_applicant_worker_profiles: {
        Args: { _worker_ids: string[] }
        Returns: {
          avatar_url: string
          main_role: string
          name: string
          rating: number
          user_id: string
          verified: boolean
        }[]
      }
      get_public_business_profiles: {
        Args: { _user_ids?: string[] }
        Returns: {
          area: string
          avatar_url: string
          business_name: string
          categories: Json
          category: string
          city: string
          created_at: string
          description: string
          display_initials: string
          id: string
          is_early_bird: boolean
          languages_required: Json
          preferred_roles: Json
          rating: number
          rating_count: number
          sub_sector: string
          updated_at: string
          user_id: string
          verified: boolean
        }[]
      }
      get_public_reviews: {
        Args: { _reviewee_id: string }
        Returns: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewer_name: string
          reviewer_type: string
        }[]
      }
      has_pending_review: { Args: { _user: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_identity_banned: {
        Args: { _email: string; _phone: string }
        Returns: boolean
      }
      normalize_phone: { Args: { _phone: string }; Returns: string }
      set_agreement: {
        Args: { _conversation_id: string; _send_location?: boolean }
        Returns: undefined
      }
      submit_review: {
        Args: { _comment: string; _conversation_id: string; _rating: number }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "worker" | "business" | "admin"
      app_role: "admin" | "moderator" | "user"
      application_status:
        | "applied"
        | "matched"
        | "rejected"
        | "confirmed"
        | "working"
        | "completed"
        | "cancelled"
      conversation_status: "open" | "agreed" | "completed" | "closed"
      job_status: "open" | "closed" | "filled" | "private_offer" | "draft"
      job_type: "single" | "parttime"
      profile_status:
        | "incomplete"
        | "pending_review"
        | "approved"
        | "rejected"
        | "blocked"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_type: ["worker", "business", "admin"],
      app_role: ["admin", "moderator", "user"],
      application_status: [
        "applied",
        "matched",
        "rejected",
        "confirmed",
        "working",
        "completed",
        "cancelled",
      ],
      conversation_status: ["open", "agreed", "completed", "closed"],
      job_status: ["open", "closed", "filled", "private_offer", "draft"],
      job_type: ["single", "parttime"],
      profile_status: [
        "incomplete",
        "pending_review",
        "approved",
        "rejected",
        "blocked",
      ],
    },
  },
} as const
