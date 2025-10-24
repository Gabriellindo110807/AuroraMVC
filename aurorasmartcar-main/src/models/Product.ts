export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  barcode: string | null;
  image_url: string | null;
  stock: number;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
  cart_id?: string;
}
