import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CartController } from "@/controllers/CartController";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, DollarSign, Smartphone, CheckCircle } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, total, discount } = location.state || {};
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    if (!cartItems || cartItems.length === 0) {
      navigate("/carrinho");
    }
  }, [navigate, cartItems]);

  const paymentMethods = [
    { id: "credit_card", name: "Cartão de Crédito", icon: CreditCard },
    { id: "debit_card", name: "Cartão de Débito", icon: CreditCard },
    { id: "pix", name: "PIX", icon: DollarSign },
    { id: "digital_wallet", name: "Carteira Digital", icon: Smartphone }
  ];

  const handlePayment = async () => {
    if (!user) return;
    
    setProcessing(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total + (discount || 0),
          discount_amount: discount || 0,
          final_amount: total,
          payment_method: paymentMethod,
          status: 'completed'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await CartController.clearCart(user.id);

      toast.success("Pagamento realizado com sucesso!");
      navigate("/historico");
    } catch (error: any) {
      toast.error("Erro ao processar pagamento");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  if (!cartItems) return null;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          <span className="text-gradient-gold">Finalizar</span> Compra
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <h2 className="text-xl font-bold mb-4">Forma de Pagamento</h2>
            
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-secondary/30 transition-colors">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex items-center gap-3 flex-1 cursor-pointer">
                    <method.icon className="w-5 h-5 text-secondary" />
                    <span>{method.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
            <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>
            
            <div className="space-y-3 mb-6">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-semibold">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              
              {discount > 0 && (
                <div className="flex justify-between text-sm text-secondary pt-3 border-t border-border">
                  <span>Desconto</span>
                  <span className="font-semibold">- R$ {discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-border flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-secondary">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold gold-glow"
            >
              {processing ? (
                "Processando..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
