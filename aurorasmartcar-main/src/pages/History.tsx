import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { History as HistoryIcon, Package, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order {
  id: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      name: string;
      category: string;
    };
  }>;
}

const History = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadOrders(session.user.id);
      }
    });
  }, [navigate]);

  const loadOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, category)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      pix: "PIX",
      digital_wallet: "Carteira Digital"
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HistoryIcon className="w-12 h-12 text-secondary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Histórico de <span className="text-gradient-gold">Compras</span>
        </h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center bg-card/50 backdrop-blur-sm">
            <HistoryIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Nenhuma compra realizada</h2>
            <p className="text-muted-foreground">Seu histórico aparecerá aqui após a primeira compra</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-secondary/30 transition-all">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {getPaymentMethodLabel(order.payment_method)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-secondary mb-1">
                      R$ {order.final_amount.toFixed(2)}
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Desconto: R$ {order.discount_amount.toFixed(2)}
                      </div>
                    )}
                    <Badge className="mt-2 bg-secondary/20 text-secondary border-secondary/30">
                      {order.status === 'completed' ? 'Concluído' : order.status}
                    </Badge>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Itens da Compra
                  </h3>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.products.name} x{item.quantity}
                        </span>
                        <span className="font-semibold">
                          R$ {item.total_price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
