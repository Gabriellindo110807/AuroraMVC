import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/models/Product";

export class ProductController {
  static async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,barcode.ilike.%${query}%`)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .order('category');
    
    if (error) throw error;
    const unique = [...new Set(data?.map(p => p.category) || [])];
    return unique;
  }
}
