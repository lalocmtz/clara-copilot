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
      accounts: {
        Row: {
          balance: number
          balance_updated_at: string | null
          created_at: string
          credit_limit: number | null
          currency: string
          cutoff_date: number | null
          id: string
          name: string
          payment_date: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          balance_updated_at?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          cutoff_date?: number | null
          id?: string
          name: string
          payment_date?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          balance_updated_at?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          cutoff_date?: number | null
          id?: string
          name?: string
          payment_date?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          budgeted: number
          category: string
          category_icon: string
          created_at: string
          id: string
          period: string
          spent: number
          user_id: string
        }
        Insert: {
          budgeted?: number
          category: string
          category_icon?: string
          created_at?: string
          id?: string
          period?: string
          spent?: number
          user_id: string
        }
        Update: {
          budgeted?: number
          category?: string
          category_icon?: string
          created_at?: string
          id?: string
          period?: string
          spent?: number
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string
          id: string
          name: string
          sort_order: number
          type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          name: string
          sort_order?: number
          type?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          cost_basis: number
          created_at: string
          current_value: number
          id: string
          last_updated: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          cost_basis?: number
          created_at?: string
          current_value?: number
          id?: string
          last_updated?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          cost_basis?: number
          created_at?: string
          current_value?: number
          id?: string
          last_updated?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          demo_seeded: boolean
          display_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_seeded?: boolean
          display_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          demo_seeded?: boolean
          display_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      statement_imports: {
        Row: {
          account_name: string
          created_at: string
          file_name: string
          id: string
          period_end: string | null
          period_start: string | null
          transactions_count: number
          user_id: string
        }
        Insert: {
          account_name: string
          created_at?: string
          file_name: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          transactions_count?: number
          user_id: string
        }
        Update: {
          account_name?: string
          created_at?: string
          file_name?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          transactions_count?: number
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          billing_day: number | null
          category: string | null
          category_icon: string
          created_at: string
          frequency: string
          id: string
          name: string
          next_date: string
          paid: boolean
          sub_type: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_day?: number | null
          category?: string | null
          category_icon?: string
          created_at?: string
          frequency?: string
          id?: string
          name: string
          next_date: string
          paid?: boolean
          sub_type?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_day?: number | null
          category?: string | null
          category_icon?: string
          created_at?: string
          frequency?: string
          id?: string
          name?: string
          next_date?: string
          paid?: boolean
          sub_type?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      telegram_links: {
        Row: {
          created_at: string
          id: string
          telegram_chat_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          telegram_chat_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          telegram_chat_id?: number
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account: string
          amount: number
          category: string
          category_icon: string
          created_at: string
          currency: string
          date: string
          id: string
          merchant: string | null
          notes: string | null
          status: string
          to_account: string | null
          type: string
          user_id: string
        }
        Insert: {
          account: string
          amount: number
          category: string
          category_icon?: string
          created_at?: string
          currency?: string
          date?: string
          id?: string
          merchant?: string | null
          notes?: string | null
          status?: string
          to_account?: string | null
          type: string
          user_id: string
        }
        Update: {
          account?: string
          amount?: number
          category?: string
          category_icon?: string
          created_at?: string
          currency?: string
          date?: string
          id?: string
          merchant?: string | null
          notes?: string | null
          status?: string
          to_account?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
