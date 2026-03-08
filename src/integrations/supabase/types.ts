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
          active: boolean
          available_balance: number | null
          balance: number
          balance_updated_at: string | null
          created_at: string
          credit_limit: number | null
          currency: string
          cutoff_date: number | null
          id: string
          institution: string | null
          last_statement_balance: number | null
          name: string
          payment_date: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          available_balance?: number | null
          balance?: number
          balance_updated_at?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          cutoff_date?: number | null
          id?: string
          institution?: string | null
          last_statement_balance?: number | null
          name: string
          payment_date?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          available_balance?: number | null
          balance?: number
          balance_updated_at?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          cutoff_date?: number | null
          id?: string
          institution?: string | null
          last_statement_balance?: number | null
          name?: string
          payment_date?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_memory: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          memory_type: string
          salience_score: number | null
          summary: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          memory_type?: string
          salience_score?: number | null
          summary: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          memory_type?: string
          salience_score?: number | null
          summary?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          file_url: string
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          mime_type: string | null
          ocr_confidence: number | null
          ocr_status: string
          parse_status: string
          parsed_text: string | null
          source: string
          uploaded_via: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          mime_type?: string | null
          ocr_confidence?: number | null
          ocr_status?: string
          parse_status?: string
          parsed_text?: string | null
          source?: string
          uploaded_via?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          mime_type?: string | null
          ocr_confidence?: number | null
          ocr_status?: string
          parse_status?: string
          parsed_text?: string | null
          source?: string
          uploaded_via?: string | null
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
          color: string | null
          created_at: string
          default_budget: number | null
          icon: string
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          default_budget?: number | null
          icon?: string
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          type?: string
          user_id: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          default_budget?: number | null
          icon?: string
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          active: boolean
          apr: number | null
          available_credit: number | null
          bank: string
          closing_day: number | null
          created_at: string
          credit_limit: number
          current_balance: number
          due_day: number | null
          id: string
          last_four: string | null
          linked_account_id: string | null
          minimum_payment: number | null
          name: string
          no_interest_payment: number | null
          notes: string | null
          statement_balance: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          apr?: number | null
          available_credit?: number | null
          bank: string
          closing_day?: number | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          due_day?: number | null
          id?: string
          last_four?: string | null
          linked_account_id?: string | null
          minimum_payment?: number | null
          name: string
          no_interest_payment?: number | null
          notes?: string | null
          statement_balance?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          apr?: number | null
          available_credit?: number | null
          bank?: string
          closing_day?: number | null
          created_at?: string
          credit_limit?: number
          current_balance?: number
          due_day?: number | null
          id?: string
          last_four?: string | null
          linked_account_id?: string | null
          minimum_payment?: number | null
          name?: string
          no_interest_payment?: number | null
          notes?: string | null
          statement_balance?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          active: boolean
          apr: number | null
          created_at: string
          creditor: string | null
          current_balance: number
          due_day: number | null
          id: string
          minimum_payment: number | null
          name: string
          notes: string | null
          original_amount: number
          payoff_priority: number | null
          strategy_tag: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          apr?: number | null
          created_at?: string
          creditor?: string | null
          current_balance?: number
          due_day?: number | null
          id?: string
          minimum_payment?: number | null
          name: string
          notes?: string | null
          original_amount?: number
          payoff_priority?: number | null
          strategy_tag?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          apr?: number | null
          created_at?: string
          creditor?: string | null
          current_balance?: number
          due_day?: number | null
          id?: string
          minimum_payment?: number | null
          name?: string
          notes?: string | null
          original_amount?: number
          payoff_priority?: number | null
          strategy_tag?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      income_allocations: {
        Row: {
          amount: number
          created_at: string
          destination_account_id: string | null
          id: string
          income_transaction_id: string | null
          jar_type: string
          percentage: number
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          destination_account_id?: string | null
          id?: string
          income_transaction_id?: string | null
          jar_type: string
          percentage?: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          destination_account_id?: string | null
          id?: string
          income_transaction_id?: string | null
          jar_type?: string
          percentage?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_allocations_destination_account_id_fkey"
            columns: ["destination_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_allocations_income_transaction_id_fkey"
            columns: ["income_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
      jar_settings: {
        Row: {
          created_at: string
          education: number
          effective_from: string
          financial_freedom: number
          give: number
          id: string
          long_term_savings: number
          necessities: number
          play: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education?: number
          effective_from?: string
          financial_freedom?: number
          give?: number
          id?: string
          long_term_savings?: number
          necessities?: number
          play?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education?: number
          effective_from?: string
          financial_freedom?: number
          give?: number
          id?: string
          long_term_savings?: number
          necessities?: number
          play?: number
          updated_at?: string
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
      receivables: {
        Row: {
          amount_paid: number
          amount_total: number
          concept: string | null
          created_at: string
          debtor_name: string
          due_date: string | null
          id: string
          last_reminder_at: string | null
          notes: string | null
          reminder_enabled: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          amount_total?: number
          concept?: string | null
          created_at?: string
          debtor_name: string
          due_date?: string | null
          id?: string
          last_reminder_at?: string | null
          notes?: string | null
          reminder_enabled?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          amount_total?: number
          concept?: string | null
          created_at?: string
          debtor_name?: string
          due_date?: string | null
          id?: string
          last_reminder_at?: string | null
          notes?: string | null
          reminder_enabled?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          id: string
          last_sent_at: string | null
          next_run_at: string | null
          reminder_type: string
          schedule_config: Json | null
          schedule_type: string
          target_entity_id: string | null
          target_entity_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          next_run_at?: string | null
          reminder_type: string
          schedule_config?: Json | null
          schedule_type?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          next_run_at?: string | null
          reminder_type?: string
          schedule_config?: Json | null
          schedule_type?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
          updated_at?: string
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
          credit_card_id: string | null
          currency: string
          date: string
          debt_id: string | null
          description: string | null
          duplicate_of_transaction_id: string | null
          id: string
          merchant: string | null
          notes: string | null
          parse_confidence: number | null
          receivable_id: string | null
          source: string
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
          credit_card_id?: string | null
          currency?: string
          date?: string
          debt_id?: string | null
          description?: string | null
          duplicate_of_transaction_id?: string | null
          id?: string
          merchant?: string | null
          notes?: string | null
          parse_confidence?: number | null
          receivable_id?: string | null
          source?: string
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
          credit_card_id?: string | null
          currency?: string
          date?: string
          debt_id?: string | null
          description?: string | null
          duplicate_of_transaction_id?: string | null
          id?: string
          merchant?: string | null
          notes?: string | null
          parse_confidence?: number | null
          receivable_id?: string | null
          source?: string
          status?: string
          to_account?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_credit_card"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_debt"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_duplicate"
            columns: ["duplicate_of_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_receivable"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      user_financial_preferences: {
        Row: {
          created_at: string
          debt_strategy_default: string | null
          id: string
          monthly_income_goal: number | null
          motivational_tone: string | null
          preferred_currency: string
          telegram_daily_digest_enabled: boolean
          telegram_digest_hour: number | null
          updated_at: string
          user_id: string
          week_start_day: number | null
        }
        Insert: {
          created_at?: string
          debt_strategy_default?: string | null
          id?: string
          monthly_income_goal?: number | null
          motivational_tone?: string | null
          preferred_currency?: string
          telegram_daily_digest_enabled?: boolean
          telegram_digest_hour?: number | null
          updated_at?: string
          user_id: string
          week_start_day?: number | null
        }
        Update: {
          created_at?: string
          debt_strategy_default?: string | null
          id?: string
          monthly_income_goal?: number | null
          motivational_tone?: string | null
          preferred_currency?: string
          telegram_daily_digest_enabled?: boolean
          telegram_digest_hour?: number | null
          updated_at?: string
          user_id?: string
          week_start_day?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      debt_obligations_view: {
        Row: {
          active: boolean | null
          apr: number | null
          available_credit: number | null
          creditor: string | null
          current_balance: number | null
          due_day: number | null
          minimum_payment: number | null
          name: string | null
          no_interest_payment: number | null
          obligation_id: string | null
          obligation_source: string | null
          payoff_priority: number | null
          user_id: string | null
          utilization_pct: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_account_balance: {
        Args: { p_account_id: string; p_delta: number }
        Returns: undefined
      }
      increment_credit_card_balance: {
        Args: { p_card_id: string; p_delta: number }
        Returns: undefined
      }
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
