/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      restaurant_settings: {
        Row: {
          restaurant_id: string
          module_smart_prep: boolean
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      prep_settings: {
        Row: {
          restaurant_id: string
          enabled: boolean
          service_periods: string[]
          default_safety_buffer: number
          default_lookback_weeks: number
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      reservation_providers: {
        Row: {
          id: string
          restaurant_id: string
          provider_name: string
          api_key: string | null
          provider_config: Json | null
          sync_errors_count: number
          polling_interval_minutes: number
          polling_enabled: boolean
          status: string
          last_poll_at: string | null
          last_sync_at: string | null
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      reservations: {
        Row: {
          id: string
          restaurant_id: string
          provider_id: string | null
          external_id: string
          guest_count: number
          reservation_time: string
          status: string
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          customer_notes: string | null
          updated_at: string
          created_at: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      reservation_sync_log: {
        Row: {
          id: string
          provider_id: string
          restaurant_id: string
          sync_type: string
          status: string
          reservations_created: number
          reservations_updated: number
          errors_count: number
          error_message: string | null
          error_details: Json | null
          duration_ms: number
          created_at: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      prep_lists: {
        Row: {
          id: string
          restaurant_id: string
          target_date: string
          service_period: string
          reserved_covers: number
          estimated_covers: number
          walk_in_ratio: number
          safety_buffer: number
          estimated_food_cost: number
          alerts: string[] | null
          generation_level: number
          status: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      prep_list_items: {
        Row: {
          id: string
          prep_list_id: string
          menu_item_id: string
          menu_item_name: string
          predicted_portions: number
          item_share: number
          confidence_score: number
          confidence_modifier: number
          priority: string
          priority_score: number
          bcg_category: string | null
          margin_percent: number
          estimated_cost: number
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      prep_list_ingredients: {
        Row: {
          id: string
          prep_list_id: string
          ingredient_id: string
          ingredient_name: string
          total_quantity: number
          unit: string
          estimated_cost: number
          used_by_items: Json | null
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      monthly_reports: {
        Row: {
          id: string
          restaurant_id: string
          month: string
          month_label: string
          feedback_count: number
          accuracy_improvement: number
          modifiers_updated: number
          learnings: string[]
          created_at: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      prep_confidence_modifiers: {
        Row: {
          id: string
          restaurant_id: string
          menu_item_id: string
          modifier_value: number
          reason: string
          updated_at: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      integration_configs: {
        Row: {
          id: string
          restaurant_id: string
          provider: string
          status: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      recipes: {
        Row: {
          id: string
          restaurant_id: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      chef_streaks: {
        Row: {
          id: string
          restaurant_id: string
          feedback_days: number
          current_streak: number
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      restaurant_intelligence_score: {
        Row: {
          id: string
          restaurant_id: string
          score: number
          level: string
          next_milestone: string
          next_milestone_score: number
          libro_connected: boolean
          pos_connected: boolean
          recipes_entered: number
          feedback_days: number
          feedback_streak: number
          updated_at: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      restaurant_members: {
        Row: {
          id: string
          restaurant_id: string
          user_id: string
          role: string
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      restaurant_health_scores: {
        Row: {
          id: string
          restaurant_id: string
          total_score: number
          google_place_id: string | null
          bayesian_mu: number | null
          bayesian_sigma: number | null
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      health_score_history: {
        Row: {
          id: string
          restaurant_id: string
          total_score: number
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          recipe_id: string | null
          price: number | null
          allergens: unknown
          image_url: string | null
          description: string | null
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          quantity: number | null
          ingredient: unknown
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      spoilage_reports: {
        Row: {
          id: string
          restaurant_id: string
          quantity: number | null
          ingredient: unknown
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
      ingredients: {
        Row: {
          id: string
          restaurant_id: string
          quantity_in_stock: number | null
          price_per_unit: number | null
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
        Relationships: any[]
      }
    }
  }
}