-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'pix', 'digital_wallet')),
  card_last_four TEXT,
  card_brand TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods"
  ON public.payment_methods FOR ALL
  USING (auth.uid() = user_id);

-- Create products table (simulating supermarket products)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  barcode TEXT UNIQUE,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

-- Create shopping_lists table
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shopping lists"
  ON public.shopping_lists FOR ALL
  USING (auth.uid() = user_id);

-- Create shopping_list_items table
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own list items"
  ON public.shopping_list_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE shopping_lists.id = shopping_list_items.list_id
      AND shopping_lists.user_id = auth.uid()
    )
  );

-- Create cart table
CREATE TABLE public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON public.cart FOR ALL
  USING (auth.uid() = user_id);

-- Create orders table (purchase history)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create trigger function for profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample products
INSERT INTO public.products (name, description, category, price, barcode, stock) VALUES
('Arroz Branco 5kg', 'Arroz branco tipo 1', 'Grãos', 25.90, '7891000100103', 100),
('Feijão Preto 1kg', 'Feijão preto tipo 1', 'Grãos', 8.50, '7891000100110', 150),
('Óleo de Soja 900ml', 'Óleo de soja refinado', 'Óleos', 6.90, '7891000100127', 200),
('Leite Integral 1L', 'Leite integral UHT', 'Laticínios', 4.50, '7891000100134', 300),
('Café Torrado 500g', 'Café torrado e moído', 'Bebidas', 15.90, '7891000100141', 80),
('Açúcar Cristal 1kg', 'Açúcar cristal', 'Açúcar', 4.20, '7891000100158', 120),
('Macarrão Espaguete 500g', 'Massa de sêmola', 'Massas', 3.90, '7891000100165', 180),
('Molho de Tomate 340g', 'Molho de tomate tradicional', 'Molhos', 2.80, '7891000100172', 250),
('Biscoito Recheado 140g', 'Biscoito recheado sabor chocolate', 'Biscoitos', 3.50, '7891000100189', 200),
('Refrigerante 2L', 'Refrigerante sabor cola', 'Bebidas', 6.50, '7891000100196', 150),
('Sabão em Pó 1kg', 'Sabão em pó para roupas', 'Limpeza', 12.90, '7891000100202', 100),
('Detergente Líquido 500ml', 'Detergente líquido neutro', 'Limpeza', 2.30, '7891000100219', 300),
('Papel Higiênico 12 rolos', 'Papel higiênico folha dupla', 'Higiene', 18.90, '7891000100226', 90),
('Shampoo 400ml', 'Shampoo hidratante', 'Higiene', 14.90, '7891000100233', 75),
('Sabonete 90g', 'Sabonete em barra', 'Higiene', 2.50, '7891000100240', 400);