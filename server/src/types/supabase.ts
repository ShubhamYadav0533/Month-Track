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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          created_at: string | null
          credit_limit: number | null
          id: string
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          credit_limit?: number | null
          id?: string
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          credit_limit?: number | null
          id?: string
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          battery_pct: number | null
          break_minutes: number
          check_in: string | null
          check_out: string | null
          created_at: string | null
          device_name: string | null
          early_leave_minutes: number
          employee_id: string
          gps_location: string | null
          id: string
          ip_address: string | null
          late_minutes: number
          network_type: string | null
          notes: string | null
          office_name: string | null
          overtime_minutes: number
          photo_url: string | null
          status: string
          total_work_minutes: number
        }
        Insert: {
          attendance_date: string
          battery_pct?: number | null
          break_minutes?: number
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          device_name?: string | null
          early_leave_minutes?: number
          employee_id: string
          gps_location?: string | null
          id?: string
          ip_address?: string | null
          late_minutes?: number
          network_type?: string | null
          notes?: string | null
          office_name?: string | null
          overtime_minutes?: number
          photo_url?: string | null
          status?: string
          total_work_minutes?: number
        }
        Update: {
          attendance_date?: string
          battery_pct?: number | null
          break_minutes?: number
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          device_name?: string | null
          early_leave_minutes?: number
          employee_id?: string
          gps_location?: string | null
          id?: string
          ip_address?: string | null
          late_minutes?: number
          network_type?: string | null
          notes?: string | null
          office_name?: string | null
          overtime_minutes?: number
          photo_url?: string | null
          status?: string
          total_work_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_breaks: {
        Row: {
          attendance_id: string
          break_end: string | null
          break_start: string
          break_type: string
          created_at: string | null
          duration_minutes: number
          id: string
        }
        Insert: {
          attendance_id: string
          break_end?: string | null
          break_start: string
          break_type?: string
          created_at?: string | null
          duration_minutes?: number
          id?: string
        }
        Update: {
          attendance_id?: string
          break_end?: string | null
          break_start?: string
          break_type?: string
          created_at?: string | null
          duration_minutes?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_breaks_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          recurring: boolean | null
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          recurring?: boolean | null
          status: string
          title: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          recurring?: boolean | null
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          monthly_limit: number
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          monthly_limit: number
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          monthly_limit?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string | null
          end_datetime: string
          event_type: string | null
          id: string
          location: string | null
          notes: string | null
          start_datetime: string
          title: string
          user_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          end_datetime: string
          event_type?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_datetime: string
          title: string
          user_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          end_datetime?: string
          event_type?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          start_datetime?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_planner: {
        Row: {
          activity: string
          completed: boolean | null
          created_at: string | null
          id: string
          planner_date: string
          task_id: string | null
          time_slot: string
          user_id: string | null
        }
        Insert: {
          activity: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          planner_date: string
          task_id?: string | null
          time_slot: string
          user_id?: string | null
        }
        Update: {
          activity?: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          planner_date?: string
          task_id?: string | null
          time_slot?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_planner_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_planner_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          department: string
          designation: string
          email: string
          employee_code: string
          full_name: string
          id: string
          joining_date: string
          manager_name: string | null
          office_location: string
          shift_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          designation: string
          email: string
          employee_code: string
          full_name: string
          id?: string
          joining_date: string
          manager_name?: string | null
          office_location: string
          shift_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          designation?: string
          email?: string
          employee_code?: string
          full_name?: string
          id?: string
          joining_date?: string
          manager_name?: string | null
          office_location?: string
          shift_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_shift"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: string
          location: string | null
          payment_method: string
          receipt_url: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          location?: string | null
          payment_method: string
          receipt_url?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          location?: string | null
          payment_method?: string
          receipt_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          saved_amount: number
          target_amount: number
          target_date: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          saved_amount: number
          target_amount: number
          target_date?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          saved_amount?: number
          target_amount?: number
          target_date?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          best_streak: number | null
          color: string | null
          completed_days: Json | null
          created_at: string | null
          current_streak: number | null
          goal_type: string | null
          icon: string | null
          id: string
          target_value: number | null
          title: string
          user_id: string | null
        }
        Insert: {
          best_streak?: number | null
          color?: string | null
          completed_days?: Json | null
          created_at?: string | null
          current_streak?: number | null
          goal_type?: string | null
          icon?: string | null
          id?: string
          target_value?: number | null
          title: string
          user_id?: string | null
        }
        Update: {
          best_streak?: number | null
          color?: string | null
          completed_days?: Json | null
          created_at?: string | null
          current_streak?: number | null
          goal_type?: string | null
          icon?: string | null
          id?: string
          target_value?: number | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          holiday_date: string
          holiday_name: string
          id: string
          is_optional: boolean | null
        }
        Insert: {
          created_at?: string | null
          holiday_date: string
          holiday_name: string
          id?: string
          is_optional?: boolean | null
        }
        Update: {
          created_at?: string | null
          holiday_date?: string
          holiday_name?: string
          id?: string
          is_optional?: boolean | null
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          income_date: string
          source: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          income_date: string
          source: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          income_date?: string
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          attachment: string | null
          comments: string | null
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string
          start_date: string
          status: string
          total_days: number
        }
        Insert: {
          approved_by?: string | null
          attachment?: string | null
          comments?: string | null
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason: string
          start_date: string
          status?: string
          total_days?: number
        }
        Update: {
          approved_by?: string | null
          attachment?: string | null
          comments?: string | null
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          start_date?: string
          status?: string
          total_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      office_locations: {
        Row: {
          allowed_radius: number
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          office_name: string
        }
        Insert: {
          allowed_radius?: number
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          office_name: string
        }
        Update: {
          allowed_radius?: number
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          office_name?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          amount: number
          auto_deduct: boolean | null
          category: string
          created_at: string | null
          frequency: string
          id: string
          next_due_date: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          auto_deduct?: boolean | null
          category: string
          created_at?: string | null
          frequency?: string
          id?: string
          next_due_date: string
          type?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          auto_deduct?: boolean | null
          category?: string
          created_at?: string | null
          frequency?: string
          id?: string
          next_due_date?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          notification_type: string | null
          repeat_interval: number | null
          repeat_type: string | null
          snooze_minutes: number | null
          sound: string | null
          task_id: string | null
          trigger_time: string
          user_id: string | null
          vibration: boolean | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notification_type?: string | null
          repeat_interval?: number | null
          repeat_type?: string | null
          snooze_minutes?: number | null
          sound?: string | null
          task_id?: string | null
          trigger_time: string
          user_id?: string | null
          vibration?: boolean | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notification_type?: string | null
          repeat_interval?: number | null
          repeat_type?: string | null
          snooze_minutes?: number | null
          sound?: string | null
          task_id?: string | null
          trigger_time?: string
          user_id?: string | null
          vibration?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          saved_amount: number | null
          target_amount: number
          target_date: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          saved_amount?: number | null
          target_amount: number
          target_date?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          saved_amount?: number | null
          target_amount?: number
          target_date?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number
          created_at: string | null
          end_time: string
          grace_minutes: number
          id: string
          required_hours: number
          shift_name: string
          start_time: string
        }
        Insert: {
          break_minutes?: number
          created_at?: string | null
          end_time: string
          grace_minutes?: number
          id?: string
          required_hours?: number
          shift_name: string
          start_time: string
        }
        Update: {
          break_minutes?: number
          created_at?: string | null
          end_time?: string
          grace_minutes?: number
          id?: string
          required_hours?: number
          shift_name?: string
          start_time?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          priority: string
          reminder_date: string | null
          section: string
          title: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority: string
          reminder_date?: string | null
          section: string
          title: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string
          reminder_date?: string | null
          section?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          attachment: string | null
          category: string
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          payment_method: string
          recurring: boolean | null
          sub_category: string | null
          title: string
          transaction_date: string
          type: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment?: string | null
          category: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          payment_method: string
          recurring?: boolean | null
          sub_category?: string | null
          title: string
          transaction_date: string
          type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment?: string | null
          category?: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          payment_method?: string
          recurring?: boolean | null
          sub_category?: string | null
          title?: string
          transaction_date?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          currency: string | null
          email: string
          id: string
          monthly_income: number | null
          name: string
          salary_date: number | null
          savings_goal: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          email: string
          id?: string
          monthly_income?: number | null
          name: string
          salary_date?: number | null
          savings_goal?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          email?: string
          id?: string
          monthly_income?: number | null
          name?: string
          salary_date?: number | null
          savings_goal?: number | null
          updated_at?: string | null
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
