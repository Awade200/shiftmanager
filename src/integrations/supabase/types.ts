export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batch_consumption: {
        Row: {
          batch_id: string
          consumed_at: string
          consumed_quantity: number
          consumption_type: string
          id: string
          notes: string | null
          reference_id: string | null
        }
        Insert: {
          batch_id: string
          consumed_at?: string
          consumed_quantity: number
          consumption_type: string
          id?: string
          notes?: string | null
          reference_id?: string | null
        }
        Update: {
          batch_id?: string
          consumed_at?: string
          consumed_quantity?: number
          consumption_type?: string
          id?: string
          notes?: string | null
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_consumption_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "raw_material_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_expenses: {
        Row: {
          amount: number
          batch_id: string
          created_at: string
          description: string | null
          expense_type: string
          id: string
        }
        Insert: {
          amount: number
          batch_id: string
          created_at?: string
          description?: string | null
          expense_type: string
          id?: string
        }
        Update: {
          amount?: number
          batch_id?: string
          created_at?: string
          description?: string | null
          expense_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_expenses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "raw_material_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      finished_product_locations: {
        Row: {
          created_at: string
          id: string
          location: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finished_product_locations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
        ]
      }
      finished_products: {
        Row: {
          carton_size: number
          created_at: string
          id: string
          name: string
          price: number
          quantity: number
          sku: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          carton_size?: number
          created_at?: string
          id?: string
          name: string
          price?: number
          quantity?: number
          sku: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          carton_size?: number
          created_at?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
          sku?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          material_id: string
          order_id: string
          quantity: number
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          order_id: string
          quantity: number
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          order_id?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "raw_material_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipes: {
        Row: {
          created_at: string
          id: string
          material_id: string
          product_id: string
          quantity_required: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          product_id: string
          quantity_required?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          product_id?: string
          quantity_required?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_logs: {
        Row: {
          created_at: string
          id: string
          location: string
          notes: string | null
          product_id: string
          quantity_produced: number
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          notes?: string | null
          product_id: string
          quantity_produced: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          notes?: string | null
          product_id?: string
          quantity_produced?: number
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "finished_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      raw_material_batches: {
        Row: {
          batch_number: string
          created_at: string
          delivery_date: string
          id: string
          location: string
          material_id: string
          notes: string | null
          order_id: string | null
          quantity: number
          remaining_quantity: number
          supplier: string
          total_cost: number | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          delivery_date: string
          id?: string
          location: string
          material_id: string
          notes?: string | null
          order_id?: string | null
          quantity: number
          remaining_quantity: number
          supplier: string
          total_cost?: number | null
          unit_cost: number
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          delivery_date?: string
          id?: string
          location?: string
          material_id?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          remaining_quantity?: number
          supplier?: string
          total_cost?: number | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_batches_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_material_batches_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "raw_material_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_locations: {
        Row: {
          created_at: string
          id: string
          location: string
          material_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          material_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          material_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_locations_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_orders: {
        Row: {
          created_at: string
          delivery_location: string
          id: string
          linked_material_id: string
          notes: string | null
          order_date: string
          status: string
          supplier: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_location: string
          id?: string
          linked_material_id: string
          notes?: string | null
          order_date: string
          status?: string
          supplier: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_location?: string
          id?: string
          linked_material_id?: string
          notes?: string | null
          order_date?: string
          status?: string
          supplier?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_orders_linked_material_id_fkey"
            columns: ["linked_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          cost: number
          created_at: string
          id: string
          name: string
          quantity: number
          reorder_level: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          name: string
          quantity?: number
          reorder_level?: number
          supplier?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          reorder_level?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_material_fifo: {
        Args: {
          p_material_id: string
          p_location: string
          p_quantity: number
          p_consumption_type: string
          p_reference_id?: string
          p_notes?: string
        }
        Returns: {
          batch_id: string
          consumed_quantity: number
          remaining_quantity: number
        }[]
      }
      generate_batch_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: string
      }
      log_activity: {
        Args: {
          p_action: string
          p_table_name: string
          p_record_id?: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: string
      }
      validate_production_requirements: {
        Args: { p_product_id: string; p_quantity: number; p_location: string }
        Returns: {
          material_id: string
          material_name: string
          required_quantity: number
          available_quantity: number
          is_sufficient: boolean
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
