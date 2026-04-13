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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_backgrounds: {
        Row: {
          background_type: string
          background_value: string | null
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          background_type?: string
          background_value?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          background_type?: string
          background_value?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          business_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          facebook: string | null
          id: string
          industry: string | null
          instagram: string | null
          linkedin: string | null
          location: string | null
          registration_number: string | null
          services: string | null
          theme_preference: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facebook?: string | null
          id?: string
          industry?: string | null
          instagram?: string | null
          linkedin?: string | null
          location?: string | null
          registration_number?: string | null
          services?: string | null
          theme_preference?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facebook?: string | null
          id?: string
          industry?: string | null
          instagram?: string | null
          linkedin?: string | null
          location?: string | null
          registration_number?: string | null
          services?: string | null
          theme_preference?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_profile: {
        Row: {
          company_name: string
          contact_email: string | null
          created_at: string
          enable_message_form: boolean
          id: string
          industry: string | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          motto: string | null
          twitter_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name?: string
          contact_email?: string | null
          created_at?: string
          enable_message_form?: boolean
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          motto?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          created_at?: string
          enable_message_form?: boolean
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          motto?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean
          recipient_user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          recipient_user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          recipient_user_id?: string | null
        }
        Relationships: []
      }
      galleries: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          month_id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          month_id: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          month_id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "galleries_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          duration: number | null
          file_size: number | null
          id: string
          media_type: string
          media_url: string
          parent_id: string
          parent_type: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration?: number | null
          file_size?: number | null
          id?: string
          media_type: string
          media_url: string
          parent_id: string
          parent_type: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration?: number | null
          file_size?: number | null
          id?: string
          media_type?: string
          media_url?: string
          parent_id?: string
          parent_type?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      months: {
        Row: {
          background_type: string | null
          background_value: string | null
          created_at: string
          display_order: number | null
          id: string
          name: string
          updated_at: string
          user_id: string
          year_id: string
        }
        Insert: {
          background_type?: string | null
          background_value?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          year_id: string
        }
        Update: {
          background_type?: string | null
          background_value?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          year_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "months_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          billing_period: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          price_kes: number
          storage_limit: number
        }
        Insert: {
          billing_period?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          price_kes: number
          storage_limit: number
        }
        Update: {
          billing_period?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          price_kes?: number
          storage_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_name: string | null
          facebook: string | null
          gallery_privacy: string | null
          id: string
          instagram: string | null
          is_published: boolean | null
          linkedin: string | null
          location: string | null
          occupation: string | null
          profile_type: string | null
          theme_preference: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          facebook?: string | null
          gallery_privacy?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean | null
          linkedin?: string | null
          location?: string | null
          occupation?: string | null
          profile_type?: string | null
          theme_preference?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          facebook?: string | null
          gallery_privacy?: string | null
          id?: string
          instagram?: string | null
          is_published?: boolean | null
          linkedin?: string | null
          location?: string | null
          occupation?: string | null
          profile_type?: string | null
          theme_preference?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      user_payments: {
        Row: {
          amount_kes: number
          created_at: string
          id: string
          payment_date: string | null
          payment_method: string | null
          payment_status: string
          pesapal_merchant_reference: string | null
          pesapal_tracking_id: string | null
          plan_id: string
          subscription_end: string | null
          subscription_start: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kes: number
          created_at?: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          pesapal_merchant_reference?: string | null
          pesapal_tracking_id?: string | null
          plan_id: string
          subscription_end?: string | null
          subscription_start?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kes?: number
          created_at?: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          pesapal_merchant_reference?: string | null
          pesapal_tracking_id?: string | null
          plan_id?: string
          subscription_end?: string | null
          subscription_start?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
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
      user_storage: {
        Row: {
          created_at: string
          id: string
          storage_limit: number
          storage_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          storage_limit?: number
          storage_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          storage_limit?: number
          storage_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      years: {
        Row: {
          background_type: string | null
          background_value: string | null
          created_at: string
          display_order: number | null
          id: string
          name: string
          updated_at: string
          user_id: string
          year_number: number | null
        }
        Insert: {
          background_type?: string | null
          background_value?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          year_number?: number | null
        }
        Update: {
          background_type?: string | null
          background_value?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          year_number?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_user_storage: { Args: { p_user_id: string }; Returns: number }
      get_year_type: { Args: { year_number: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
