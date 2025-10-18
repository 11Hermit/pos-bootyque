-- ============================================================================
-- THRIFT BY ESSY - COMPLETE MULTI-TENANT DATABASE SETUP
-- Fresh installation script - creates all tables, functions, triggers, and RLS policies
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TENANTS TABLE (NO DEPENDENCIES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- STEP 2: CREATE USERS TABLE (DEPENDS ON: tenants)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE PRODUCTS TABLE (DEPENDS ON: tenants)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    serial_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    buying_price DECIMAL(10,2) NOT NULL CHECK (buying_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_level INTEGER DEFAULT 5 CHECK (min_stock_level >= 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    barcode TEXT,
    barcode_image_url TEXT,
    image_urls JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, serial_number),
    UNIQUE(tenant_id, barcode)
);

-- ============================================================================
-- STEP 4: CREATE SALES TABLE (DEPENDS ON: tenants, users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    total_profit DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'card', 'bank_transfer')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: CREATE SALE_ITEMS TABLE (DEPENDS ON: tenants, sales, products)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    profit_per_item DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: CREATE UTILITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fixed infinite recursion by using direct table access without RLS
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    user_tenant UUID;
BEGIN
    -- Bypass RLS by using SECURITY DEFINER and direct query
    SELECT tenant_id INTO user_tenant 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN user_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.set_tenant_id_from_user()
RETURNS TRIGGER AS $$
DECLARE
    user_tenant UUID;
BEGIN
    IF NEW.tenant_id IS NULL THEN
        SELECT tenant_id INTO user_tenant FROM public.users WHERE id = auth.uid();
        IF user_tenant IS NULL THEN
            RAISE EXCEPTION 'Cannot determine tenant_id for user %', auth.uid();
        END IF;
        NEW.tenant_id := user_tenant;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: CREATE USER MANAGEMENT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
    user_role TEXT;
    tenant_name TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
    
    IF user_role = 'admin' THEN
        tenant_name := COALESCE(
            NEW.raw_user_meta_data->>'business_name',
            'Business - ' || SPLIT_PART(NEW.email, '@', 1)
        );
        
        INSERT INTO public.tenants (owner_id, name)
        VALUES (NEW.id, tenant_name)
        RETURNING id INTO new_tenant_id;
        
        INSERT INTO public.users (id, tenant_id, email, role)
        VALUES (NEW.id, new_tenant_id, NEW.email, user_role)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
    ELSE
        new_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
        
        IF new_tenant_id IS NULL THEN
            RAISE EXCEPTION 'tenant_id is required for employee users';
        END IF;
        
        INSERT INTO public.users (id, tenant_id, email, role)
        VALUES (NEW.id, new_tenant_id, NEW.email, user_role)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user record: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: CREATE BARCODE GENERATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_unique_barcode(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_barcode TEXT;
    barcode_exists BOOLEAN;
    counter INTEGER;
    check_digit INTEGER;
    barcode_base TEXT;
BEGIN
    LOOP
        counter := (EXTRACT(EPOCH FROM NOW())::BIGINT % 1000000000)::INTEGER;
        barcode_base := '200' || LPAD(counter::TEXT, 9, '0');
        
        check_digit := (10 - (
            (SUBSTRING(barcode_base, 1, 1)::INTEGER * 1) +
            (SUBSTRING(barcode_base, 2, 1)::INTEGER * 3) +
            (SUBSTRING(barcode_base, 3, 1)::INTEGER * 1) +
            (SUBSTRING(barcode_base, 4, 1)::INTEGER * 3) +
            (SUBSTRING(barcode_base, 5, 1)::INTEGER * 1) +
            (SUBSTRING(barcode_base, 6, 1)::INTEGER * 3) +
            (SUBSTRING(barcode_base, 7, 1)::INTEGER * 1) +
            (SUBSTRING(barcode_base, 8, 1)::INTEGER * 3) +
            (SUBSTRING(barcode_base, 9, 1)::INTEGER * 1) +
            (SUBSTRING(barcode_base, 10, 1)::INTEGER * 3) +
            (SUBSTRING(barcode_base, 11, 1)::INTEGER * 1) +
            (SUBSTRING(barcode_base, 12, 1)::INTEGER * 3)
        ) % 10) % 10;
        
        new_barcode := barcode_base || check_digit::TEXT;
        
        SELECT EXISTS(
            SELECT 1 FROM public.products 
            WHERE barcode = new_barcode AND tenant_id = p_tenant_id
        ) INTO barcode_exists;
        
        EXIT WHEN NOT barcode_exists;
        
        PERFORM pg_sleep(0.001);
    END LOOP;
    
    RETURN new_barcode;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: CREATE STOCK MANAGEMENT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
    min_stock INTEGER;
BEGIN
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id AND tenant_id = NEW.tenant_id
    RETURNING stock_quantity, min_stock_level INTO current_stock, min_stock;
    
    IF current_stock < min_stock THEN
        RAISE NOTICE 'Low stock alert for product ID: % (Current: %, Min: %)', 
            NEW.product_id, current_stock, min_stock;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 11: DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

-- Tenants
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can update their own tenant" ON public.tenants;

-- Users
DROP POLICY IF EXISTS "Users can view own tenant users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.users;
DROP POLICY IF EXISTS "Users can update own tenant users" ON public.users;
DROP POLICY IF EXISTS "Users can delete own tenant users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users in their tenant" ON public.users;
DROP POLICY IF EXISTS "Admins can update users in their tenant" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users in their tenant" ON public.users;

-- Products
DROP POLICY IF EXISTS "Users can view tenant products" ON public.products;
DROP POLICY IF EXISTS "Users can insert tenant products" ON public.products;
DROP POLICY IF EXISTS "Users can update tenant products" ON public.products;
DROP POLICY IF EXISTS "Users can delete tenant products" ON public.products;

-- Sales
DROP POLICY IF EXISTS "Users can view tenant sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert tenant sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update tenant sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete tenant sales" ON public.sales;

-- Sale items
DROP POLICY IF EXISTS "Users can view tenant sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can insert tenant sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update tenant sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can delete tenant sale_items" ON public.sale_items;

-- ============================================================================
-- STEP 12: CREATE RLS POLICIES FOR TENANTS
-- ============================================================================

CREATE POLICY "Users can view their own tenant" ON public.tenants
    FOR SELECT
    USING (
        owner_id = auth.uid() OR
        id = public.get_user_tenant_id()
    );

CREATE POLICY "Users can update their own tenant" ON public.tenants
    FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- STEP 13: CREATE RLS POLICIES FOR USERS
-- ============================================================================

-- Simplified policies to avoid recursion - users can only see their own tenant
CREATE POLICY "Users can view own tenant users" ON public.users
    FOR SELECT
    USING (id = auth.uid() OR tenant_id = public.get_user_tenant_id());

CREATE POLICY "Authenticated users can insert" ON public.users
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own tenant users" ON public.users
    FOR UPDATE
    USING (tenant_id = public.get_user_tenant_id())
    WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own tenant users" ON public.users
    FOR DELETE
    USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- STEP 14: CREATE RLS POLICIES FOR PRODUCTS
-- ============================================================================

CREATE POLICY "Users can view tenant products" ON public.products
    FOR SELECT
    USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert tenant products" ON public.products
    FOR INSERT
    WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant products" ON public.products
    FOR UPDATE
    USING (tenant_id = public.get_user_tenant_id())
    WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant products" ON public.products
    FOR DELETE
    USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- STEP 15: CREATE RLS POLICIES FOR SALES
-- ============================================================================

CREATE POLICY "Users can view tenant sales" ON public.sales
    FOR SELECT
    USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert tenant sales" ON public.sales
    FOR INSERT
    WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant sales" ON public.sales
    FOR UPDATE
    USING (tenant_id = public.get_user_tenant_id())
    WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant sales" ON public.sales
    FOR DELETE
    USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- STEP 16: CREATE RLS POLICIES FOR SALE_ITEMS
-- ============================================================================

CREATE POLICY "Users can view tenant sale_items" ON public.sale_items
    FOR SELECT
    USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert tenant sale_items" ON public.sale_items
    FOR INSERT
    WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update tenant sale_items" ON public.sale_items
    FOR UPDATE
    USING (tenant_id = public.get_user_tenant_id())
    WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete tenant sale_items" ON public.sale_items
    FOR DELETE
    USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- STEP 17: DROP EXISTING TRIGGERS (IF ANY)
-- ============================================================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_stock_on_sale ON public.sale_items;
DROP TRIGGER IF EXISTS set_tenant_id_products ON public.products;
DROP TRIGGER IF EXISTS set_tenant_id_sales ON public.sales;
DROP TRIGGER IF EXISTS set_tenant_id_sale_items ON public.sale_items;

-- ============================================================================
-- STEP 18: CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 19: CREATE TRIGGER FOR NEW USER CREATION
-- ============================================================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 20: CREATE TRIGGER FOR STOCK UPDATES
-- ============================================================================

CREATE TRIGGER update_stock_on_sale
    AFTER INSERT ON public.sale_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_stock();

-- ============================================================================
-- STEP 21: CREATE TRIGGERS FOR AUTO-TENANT ASSIGNMENT
-- ============================================================================

CREATE TRIGGER set_tenant_id_products 
    BEFORE INSERT ON public.products
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_tenant_id_from_user();

CREATE TRIGGER set_tenant_id_sales 
    BEFORE INSERT ON public.sales
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_tenant_id_from_user();

CREATE TRIGGER set_tenant_id_sale_items 
    BEFORE INSERT ON public.sale_items
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_tenant_id_from_user();

-- ============================================================================
-- STEP 22: CREATE PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_serial ON public.products(tenant_id, serial_number);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON public.sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_id ON public.sale_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);

-- ============================================================================
-- STEP 23: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
