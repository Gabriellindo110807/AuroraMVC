import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CartController } from "@/controllers/CartController";
import type { CartItem } from "@/models/Product";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard } from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadCart(session.user.id);
      }
    });
  }, [navigate]);

  const loadCart = async (userId: string) => {
    try {
      const items = await CartController.getCartItems(userId);
      setCartItems(items);
    } catch (error: any) {
      toast.error("Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!user || newQuantity < 1) return;

    try {
      await CartController.updateQuantity(user.id, productId, newQuantity);
      setCartItems(items =>
        items.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error: any) {
      toast.error("Erro ao atualizar quantidade");
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;

    try {
      await CartController.removeFromCart(user.id, productId);
      setCartItems(items => items.filter(item => item.id !== productId));
      toast.success("Produto removido do carrinho");
    } catch (error: any) {
      toast.error("Erro ao remover produto");
    }
  };

  const calculateSubtotal = () => CartController.calculateTotal(cartItems);
  const calculateTotal = () => calculateSubtotal() - discount;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }
    navigate("/checkout", { state: { cartItems, total: calculateTotal(), discount } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-secondary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Meu <span className="text-gradient-gold">Carrinho</span>
        </h1>

        {cartItems.length === 0 ? (
          <Card className="p-12 text-center bg-card/50 backdrop-blur-sm">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-6">Adicione produtos para começar suas compras</p>
            <Button 
              onClick={() => navigate("/produtos")}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              Ver Produtos
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4 bg-card/50 backdrop-blur-sm border-border">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0" />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                      <p className="text-lg font-bold text-secondary">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-border sticky top-24">
                <h2 className="text-xl font-bold mb-4">Resumo</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">R$ {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-secondary">
                      <span>Desconto</span>
                      <span className="font-semibold">- R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-border flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-secondary">R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold gold-glow"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Finalizar Compra
                </Button>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
