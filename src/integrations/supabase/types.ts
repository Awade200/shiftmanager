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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alawoye_activity_logs: {
        Row: {
          action_type: string
          admin_id: string
          client_id: string
          consultation_id: string | null
          created_at: string
          description: string
          id: string
          prescription_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          client_id: string
          consultation_id?: string | null
          created_at?: string
          description: string
          id?: string
          prescription_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          client_id?: string
          consultation_id?: string | null
          created_at?: string
          description?: string
          id?: string
          prescription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alawoye_activity_logs_admin_fk"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "egbg_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alawoye_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "egbg_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alawoye_activity_logs_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "egbg_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alawoye_activity_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "egbg_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alawoye_activity_logs_consultation_fk"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "egbg_consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alawoye_activity_logs_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "egbg_consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alawoye_activity_logs_prescription_fk"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "egbg_prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alawoye_activity_logs_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "egbg_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          excerpt: string | null
          featured: boolean
          featured_image_url: string | null
          id: string
          published: boolean
          read_time: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category?: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          published?: boolean
          read_time?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          published?: boolean
          read_time?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          pricing_option_id: string | null
          product_id: string
          quantity: number
          session_id: string | null
          updated_at: string
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pricing_option_id?: string | null
          product_id: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pricing_option_id?: string | null
          product_id?: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_pricing_option_id_fkey"
            columns: ["pricing_option_id"]
            isOneToOne: false
            referencedRelation: "product_pricing_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          client_name: string
          created_at: string
          default_location: string
          id: string
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          default_location: string
          id?: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          default_location?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity?: number
          subtotal?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_products"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_fee: number
          delivery_method: string | null
          id: string
          notes: string | null
          order_number: string
          order_status: string
          payment_method: string
          payment_proof_submitted: boolean | null
          payment_proof_verified: boolean | null
          payment_status: string
          paystack_reference: string | null
          pickup_location_id: string | null
          shipping_address: string
          shipping_city: string
          shipping_state: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          delivery_method?: string | null
          id?: string
          notes?: string | null
          order_number: string
          order_status?: string
          payment_method?: string
          payment_proof_submitted?: boolean | null
          payment_proof_verified?: boolean | null
          payment_status?: string
          paystack_reference?: string | null
          pickup_location_id?: string | null
          shipping_address: string
          shipping_city: string
          shipping_state: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          delivery_method?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          order_status?: string
          payment_method?: string
          payment_proof_submitted?: boolean | null
          payment_proof_verified?: boolean | null
          payment_status?: string
          paystack_reference?: string | null
          pickup_location_id?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_state?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_orders_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "pickup_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      days: {
        Row: {
          created_at: string
          day_date: string
          has_conflicts: boolean | null
          has_unresolved: boolean | null
          id: string
          last_import_session_id: string | null
          mobile_number: string
          shift_count: number | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_date: string
          has_conflicts?: boolean | null
          has_unresolved?: boolean | null
          id?: string
          last_import_session_id?: string | null
          mobile_number: string
          shift_count?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_date?: string
          has_conflicts?: boolean | null
          has_unresolved?: boolean | null
          id?: string
          last_import_session_id?: string | null
          mobile_number?: string
          shift_count?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_rates: {
        Row: {
          created_at: string
          id: string
          rate: number
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          rate?: number
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          rate?: number
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      ecommerce_products: {
        Row: {
          benefits: string[] | null
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          name: string
          price: number
          sku: string | null
          slug: string
          status: string
          stock_quantity: number
          tags: string[] | null
          units_per_pack: number | null
          updated_at: string
          usage_instructions: string | null
          weight_per_unit: number | null
        }
        Insert: {
          benefits?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          name: string
          price?: number
          sku?: string | null
          slug: string
          status?: string
          stock_quantity?: number
          tags?: string[] | null
          units_per_pack?: number | null
          updated_at?: string
          usage_instructions?: string | null
          weight_per_unit?: number | null
        }
        Update: {
          benefits?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          name?: string
          price?: number
          sku?: string | null
          slug?: string
          status?: string
          stock_quantity?: number
          tags?: string[] | null
          units_per_pack?: number | null
          updated_at?: string
          usage_instructions?: string | null
          weight_per_unit?: number | null
        }
        Relationships: []
      }
      egbg_admin_users: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          password: string
          role: Database["public"]["Enums"]["egbg_admin_role"]
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          password: string
          role: Database["public"]["Enums"]["egbg_admin_role"]
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          password?: string
          role?: Database["public"]["Enums"]["egbg_admin_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      egbg_appointments: {
        Row: {
          client_id: string
          consultation_id: string | null
          created_at: string
          created_by_admin_id: string
          date: string
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          consultation_id?: string | null
          created_at?: string
          created_by_admin_id: string
          date: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          consultation_id?: string | null
          created_at?: string
          created_by_admin_id?: string
          date?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "egbg_appointments_admin_fk"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "egbg_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egbg_appointments_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "egbg_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egbg_appointments_consultation_fk"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "egbg_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      egbg_clients: {
        Row: {
          address: string | null
          allergies: string | null
          client_id: string | null
          created_at: string
          created_by_admin_id: string | null
          current_medications: string | null
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          is_active: boolean | null
          last_visit: string | null
          medical_history: string | null
          phone_number: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          client_id?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          current_medications?: string | null
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_active?: boolean | null
          last_visit?: string | null
          medical_history?: string | null
          phone_number: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          client_id?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          current_medications?: string | null
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_active?: boolean | null
          last_visit?: string | null
          medical_history?: string | null
          phone_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "egbg_clients_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "egbg_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      egbg_consultations: {
        Row: {
          client_id: string
          consultation_date: string
          created_at: string
          diagnosis: string | null
          follow_up_date: string | null
          herbalist_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["egbg_consultation_status"]
          symptoms: string | null
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          consultation_date: string
          created_at?: string
          diagnosis?: string | null
          follow_up_date?: string | null
          herbalist_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["egbg_consultation_status"]
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          consultation_date?: string
          created_at?: string
          diagnosis?: string | null
          follow_up_date?: string | null
          herbalist_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["egbg_consultation_status"]
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "egbg_consultations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "egbg_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egbg_consultations_herbalist_id_fkey"
            columns: ["herbalist_id"]
            isOneToOne: false
            referencedRelation: "egbg_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      egbg_prescriptions: {
        Row: {
          consultation_id: string
          created_at: string
          dispensed_at: string | null
          dosage: string
          duration: string
          frequency: string
          id: string
          instructions: string | null
          medicine_name: string
          status: string | null
        }
        Insert: {
          consultation_id: string
          created_at?: string
          dispensed_at?: string | null
          dosage: string
          duration: string
          frequency: string
          id?: string
          instructions?: string | null
          medicine_name: string
          status?: string | null
        }
        Update: {
          consultation_id?: string
          created_at?: string
          dispensed_at?: string | null
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string | null
          medicine_name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "egbg_prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "egbg_consultations"
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
      import_sessions: {
        Row: {
          created_at: string
          days_found: number | null
          days_saved: number | null
          days_skipped: number | null
          id: string
          mobile_number: string
          session_data: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          days_found?: number | null
          days_saved?: number | null
          days_skipped?: number | null
          id?: string
          mobile_number: string
          session_data?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          days_found?: number | null
          days_saved?: number | null
          days_skipped?: number | null
          id?: string
          mobile_number?: string
          session_data?: Json | null
          status?: string
        }
        Relationships: []
      }
      mobile_auth: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_verified: boolean
          last_login: string | null
          mobile_number: string
          pin_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_verified?: boolean
          last_login?: string | null
          mobile_number: string
          pin_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_verified?: boolean
          last_login?: string | null
          mobile_number?: string
          pin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          channel: string
          day_date: string | null
          error_message: string | null
          id: string
          mobile_number: string
          reminder_type: string | null
          sent_at: string | null
          shift_id: string | null
          status: string
        }
        Insert: {
          channel: string
          day_date?: string | null
          error_message?: string | null
          id?: string
          mobile_number: string
          reminder_type?: string | null
          sent_at?: string | null
          shift_id?: string | null
          status: string
        }
        Update: {
          channel?: string
          day_date?: string | null
          error_message?: string | null
          id?: string
          mobile_number?: string
          reminder_type?: string | null
          sent_at?: string | null
          shift_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email: string | null
          email_enabled: boolean | null
          id: string
          mobile_number: string
          phone_number: string | null
          reminder_hours_before: number | null
          sms_enabled: boolean | null
          updated_at: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          email_enabled?: boolean | null
          id?: string
          mobile_number: string
          phone_number?: string | null
          reminder_hours_before?: number | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          email_enabled?: boolean | null
          id?: string
          mobile_number?: string
          phone_number?: string | null
          reminder_hours_before?: number | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
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
      payment_settings: {
        Row: {
          created_at: string
          id: string
          setting_name: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_name: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_name?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pickup_locations: {
        Row: {
          address: string
          city: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          operating_hours: string | null
          phone: string | null
          state: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          operating_hours?: string | null
          phone?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          operating_hours?: string | null
          phone?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pricing_options: {
        Row: {
          created_at: string
          discount_percentage: number | null
          id: string
          is_default: boolean | null
          name: string
          price_per_unit: number
          product_id: string
          quantity: number
          total_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          is_default?: boolean | null
          name: string
          price_per_unit: number
          product_id: string
          quantity?: number
          total_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          is_default?: boolean | null
          name?: string
          price_per_unit?: number
          product_id?: string
          quantity?: number
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_pricing_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_products"
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
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          price_modifier: number | null
          product_id: string
          sku_suffix: string | null
          stock_quantity: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          price_modifier?: number | null
          product_id: string
          sku_suffix?: string | null
          stock_quantity?: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          price_modifier?: number | null
          product_id?: string
          sku_suffix?: string | null
          stock_quantity?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_products"
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
          display_name: string | null
          hourly_rate: number | null
          id: string
          mobile_number: string | null
          pay_frequency: string | null
          role: string | null
          tax_code: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          hourly_rate?: number | null
          id: string
          mobile_number?: string | null
          pay_frequency?: string | null
          role?: string | null
          tax_code?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          hourly_rate?: number | null
          id?: string
          mobile_number?: string | null
          pay_frequency?: string | null
          role?: string | null
          tax_code?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_mobile_number_fkey"
            columns: ["mobile_number"]
            isOneToOne: false
            referencedRelation: "mobile_auth"
            referencedColumns: ["mobile_number"]
          },
        ]
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
      shifts: {
        Row: {
          client_name: string
          created_at: string
          date: string
          day_id: string | null
          duration: number
          earnings: number
          end_time: string
          hourly_rate: number
          id: string
          is_paid: boolean
          location: string | null
          mobile_number: string | null
          shift_key: string
          start_time: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name: string
          created_at?: string
          date: string
          day_id?: string | null
          duration: number
          earnings: number
          end_time: string
          hourly_rate: number
          id?: string
          is_paid?: boolean
          location?: string | null
          mobile_number?: string | null
          shift_key: string
          start_time: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string
          created_at?: string
          date?: string
          day_id?: string | null
          duration?: number
          earnings?: number
          end_time?: string
          hourly_rate?: number
          id?: string
          is_paid?: boolean
          location?: string | null
          mobile_number?: string | null
          shift_key?: string
          start_time?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_mobile_number_fkey"
            columns: ["mobile_number"]
            isOneToOne: false
            referencedRelation: "mobile_auth"
            referencedColumns: ["mobile_number"]
          },
        ]
      }
      testimonials: {
        Row: {
          approved: boolean
          created_at: string
          customer_image_url: string | null
          customer_location: string | null
          customer_name: string
          featured: boolean
          id: string
          product_used: string | null
          rating: number
          testimonial_text: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          customer_image_url?: string | null
          customer_location?: string | null
          customer_name: string
          featured?: boolean
          id?: string
          product_used?: string | null
          rating?: number
          testimonial_text: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          customer_image_url?: string | null
          customer_location?: string | null
          customer_name?: string
          featured?: boolean
          id?: string
          product_used?: string | null
          rating?: number
          testimonial_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          session_id: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          session_id?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          session_id?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ecommerce_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_material_fifo: {
        Args: {
          p_consumption_type: string
          p_location: string
          p_material_id: string
          p_notes?: string
          p_quantity: number
          p_reference_id?: string
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
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      get_or_create_day: {
        Args: { p_day_date: string; p_mobile_number: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: string
      }
      set_config: {
        Args: { setting_name: string; setting_value: string }
        Returns: undefined
      }
      validate_production_requirements: {
        Args: { p_location: string; p_product_id: string; p_quantity: number }
        Returns: {
          available_quantity: number
          is_sufficient: boolean
          material_id: string
          material_name: string
          required_quantity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      egbg_admin_role: "receptionist" | "herbalist" | "supervisor"
      egbg_consultation_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      egbg_gender: "male" | "female" | "other"
      gender_type: "male" | "female" | "other"
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
      app_role: ["admin", "customer"],
      egbg_admin_role: ["receptionist", "herbalist", "supervisor"],
      egbg_consultation_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      egbg_gender: ["male", "female", "other"],
      gender_type: ["male", "female", "other"],
    },
  },
} as const
