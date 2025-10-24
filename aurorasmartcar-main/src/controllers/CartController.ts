import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/models/Product";

export class CartController {
  static async getCartItems(userId: string): Promise<CartItem[]> {
    const { data, error } = await supabase
      .from('cart')
      .select(`
        id,
        quantity,
        added_at,
        products (*)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      ...(item.products as any),
      quantity: item.quantity,
      cart_id: item.id
    }));
  }

  static async addToCart(userId: string, productId: string, quantity: number = 1) {
    const { error } = await supabase
      .from('cart')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity
      }, {
        onConflict: 'user_id,product_id'
      });
    
    if (error) throw error;
  }

  static async updateQuantity(userId: string, productId: string, quantity: number) {
    const { error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId);
    
    if (error) throw error;
  }

  static async removeFromCart(userId: string, productId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    
    if (error) throw error;
  }

  static async clearCart(userId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  static calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}
