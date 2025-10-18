import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we have valid Supabase credentials
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://placeholder.supabase.co" &&
  supabaseAnonKey !== "placeholder-anon-key"

let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null

// Mock client for when Supabase is not configured
const createMockClient = () => {
  return {
    auth: {
      signInWithPassword: async (credentials: any) => {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        return {
          data: {
            user: {
              id: "mock-user-id",
              email: credentials.email,
              created_at: new Date().toISOString(),
            },
            session: {
              access_token: "mock-access-token",
              user: {
                id: "mock-user-id",
                email: credentials.email,
              },
            },
          },
          error: null,
        }
      },

      signUp: async (credentials: any) => {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const businessName = credentials.options?.data?.business_name || "Mock Business"

        return {
          data: {
            user: {
              id: "mock-user-id",
              email: credentials.email,
              created_at: new Date().toISOString(),
              user_metadata: {
                business_name: businessName,
                role: credentials.options?.data?.role || "admin",
              },
            },
            session: null,
          },
          error: null,
        }
      },

      signOut: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return { error: null }
      },

      getUser: async () => {
        return {
          data: {
            user: {
              id: "mock-user-id",
              email: "admin@alfirespares.com",
              created_at: new Date().toISOString(),
            },
          },
          error: null,
        }
      },

      getSession: async () => {
        return {
          data: {
            session: {
              user: {
                id: "mock-user-id",
                email: "admin@alfirespares.com",
              },
              access_token: "mock-access-token",
            },
          },
          error: null,
        }
      },

      onAuthStateChange: (callback: any) => {
        // Simulate initial session
        setTimeout(() => {
          callback("SIGNED_IN", {
            user: {
              id: "mock-user-id",
              email: "admin@alfirespares.com",
            },
            access_token: "mock-access-token",
          })
        }, 100)

        return {
          data: {
            subscription: {
              unsubscribe: () => console.log("Mock auth listener unsubscribed"),
            },
          },
        }
      },
    },

    from: (table: string) => {
      // Mock database operations
      const mockData = getMockData(table)

      return {
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              const item = mockData.find((item: any) => item[column] === value)
              return { data: item || null, error: item ? null : { message: "No rows found" } }
            },
            maybeSingle: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100))
              const item = mockData.find((item: any) => item[column] === value)
              return { data: item || null, error: null }
            },
            order: (column: string, options?: any) => ({
              data: mockData.filter((item: any) => item[column] === value),
              error: null,
            }),
            limit: (count: number) => ({
              data: mockData.filter((item: any) => item[column] === value).slice(0, count),
              error: null,
            }),
            gte: () => ({ data: mockData, error: null }),
            lte: () => ({ data: mockData, error: null }),
            gt: () => ({ data: mockData, error: null }),
          }),
          order: (column: string, options?: any) => ({
            data: mockData,
            error: null,
          }),
          limit: (count: number) => ({
            data: mockData.slice(0, count),
            error: null,
          }),
          gte: () => ({ data: mockData, error: null }),
          lte: () => ({ data: mockData, error: null }),
        }),

        insert: (data: any) => ({
          select: () => ({
            single: async () => {
              await new Promise((resolve) => setTimeout(resolve, 200))
              return {
                data: {
                  id: "mock-id-" + Date.now(),
                  ...data[0],
                },
                error: null,
              }
            },
          }),
        }),

        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            data: { ...data, id: value },
            error: null,
          }),
        }),

        delete: () => ({
          eq: (column: string, value: any) => ({
            data: null,
            error: null,
          }),
        }),

        upsert: (data: any) => ({
          data: { id: "mock-id-" + Date.now(), ...data },
          error: null,
        }),
      }
    },
  }
}

// Mock data for different tables
const getMockData = (table: string) => {
  switch (table) {
    case "products":
      return [
        {
          id: "1",
          barcode: "2001234567890",
          serial_number: "BP001",
          name: "Brake Pad Set - Honda",
          description: "High-quality brake pads for Honda motorcycles",
          category: "Brakes",
          buying_price: 500,
          selling_price: 750,
          stock_quantity: 25,
          min_stock_level: 5,
          status: "active",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          barcode: "2009876543210",
          serial_number: "CL002",
          name: "Chain Lubricant 500ml",
          description: "Premium chain lubricant for smooth operation",
          category: "Maintenance",
          buying_price: 200,
          selling_price: 300,
          stock_quantity: 50,
          min_stock_level: 10,
          status: "active",
          created_at: new Date().toISOString(),
        },
      ]

    case "sales":
      return [
        {
          id: "sale-1",
          user_id: "mock-user-id",
          total_amount: 1050,
          total_profit: 350,
          payment_method: "cash",
          status: "completed",
          created_at: new Date().toISOString(),
          sale_items: [
            {
              id: "item-1",
              sale_id: "sale-1",
              product_id: "1",
              quantity: 1,
              unit_price: 750,
              total_price: 750,
              profit_per_item: 250,
              products: {
                name: "Brake Pad Set - Honda",
                serial_number: "BP001",
                category: "Brakes",
              },
            },
          ],
        },
      ]

    case "users":
      return [
        {
          id: "mock-user-id",
          email: "admin@alfirespares.com",
          role: "admin",
          created_at: new Date().toISOString(),
        },
      ]

    default:
      return []
  }
}

export function createClient() {
  if (!isSupabaseConfigured) {
    console.log("🔧 Using mock Supabase client - no configuration detected")
    return createMockClient()
  }

  if (!supabaseClientInstance) {
    console.log("✅ Creating Supabase client (singleton)")
    supabaseClientInstance = createBrowserClient(supabaseUrl!, supabaseAnonKey!)
  }

  return supabaseClientInstance
}

// Export a flag to check if we're in mock mode
export const isMockMode = !isSupabaseConfigured
