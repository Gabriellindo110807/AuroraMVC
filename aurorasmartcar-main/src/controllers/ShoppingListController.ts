import { supabase } from "@/integrations/supabase/client";

export interface ShoppingList {
  id: string;
  name: string;
  user_id: string;
  status: 'previous' | 'ongoing' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

export class ShoppingListController {
  static async getLists(userId: string, status?: string): Promise<ShoppingList[]> {
    let query = supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as ShoppingList[]) || [];
  }

  static async createList(userId: string, name: string): Promise<ShoppingList> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        name,
        status: 'previous'
      })
      .select()
      .single();

    if (error) throw error;
    return data as ShoppingList;
  }

  static async updateListStatus(listId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_lists')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', listId);

    if (error) throw error;
  }

  static async deleteList(listId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (error) throw error;
  }

  static async getListItems(listId: string): Promise<ShoppingListItem[]> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select(`
        id,
        list_id,
        product_id,
        quantity,
        created_at,
        products (
          id,
          name,
          price,
          image_url
        )
      `)
      .eq('list_id', listId);

    if (error) throw error;
    return data || [];
  }

  static async addItemToList(listId: string, productId: string, quantity: number = 1): Promise<void> {
    const { error } = await supabase
      .from('shopping_list_items')
      .insert({
        list_id: listId,
        product_id: productId,
        quantity
      });

    if (error) throw error;

    // Update list timestamp
    await supabase
      .from('shopping_lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listId);
  }

  static async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('shopping_list_items')
      .update({ quantity })
      .eq('id', itemId);

    if (error) throw error;
  }

  static async removeItemFromList(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  static calculateTotal(items: ShoppingListItem[]): number {
    return items.reduce((total, item) => {
      const price = item.products?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  }
}
