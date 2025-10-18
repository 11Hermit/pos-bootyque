export type UserRole = "admin" | "employee"

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
          settings: any
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
          settings?: any
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
          settings?: any
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          email: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          serial_number: string
          name: string
          description: string | null
          category: string
          buying_price: number
          selling_price: number
          stock_quantity: number
          min_stock_level: number
          status: string
          barcode: string | null
          barcode_image_url: string | null
          image_urls: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          serial_number: string
          name: string
          description?: string | null
          category: string
          buying_price: number
          selling_price: number
          stock_quantity?: number
          min_stock_level?: number
          status?: string
          barcode?: string | null
          barcode_image_url?: string | null
          image_urls?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          serial_number?: string
          name?: string
          description?: string | null
          category?: string
          buying_price?: number
          selling_price?: number
          stock_quantity?: number
          min_stock_level?: number
          status?: string
          barcode?: string | null
          barcode_image_url?: string | null
          image_urls?: any
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          total_amount: number
          total_profit: number
          payment_method: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          total_amount: number
          total_profit: number
          payment_method: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          total_amount?: number
          total_profit?: number
          payment_method?: string
          status?: string
          notes?: string | null
          created_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          tenant_id: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          profit_per_item: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          profit_per_item: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          sale_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          profit_per_item?: number
          created_at?: string
        }
      }
    }
  }
}
