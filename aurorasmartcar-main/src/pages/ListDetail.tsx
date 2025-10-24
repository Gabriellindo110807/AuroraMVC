import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, QrCode, Plus, Trash2, Check } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QRScanner } from '@/components/QRScanner';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingListController, ShoppingListItem, ShoppingList } from '@/controllers/ShoppingListController';
import { ProductController } from '@/controllers/ProductController';
import { toast } from 'sonner';

const ListDetail = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      loadListData();
    };

    checkUser();
  }, [listId, navigate]);

  const loadListData = async () => {
    if (!listId) return;

    try {
      setLoading(true);
      const { data: listData } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (listData) {
        setList(listData as ShoppingList);
        const itemsData = await ShoppingListController.getListItems(listId);
        setItems(itemsData);
      }
    } catch (error) {
      console.error('Error loading list:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (code: string) => {
    try {
      const products = await ProductController.getAllProducts();
      const product = products.find(p => p.barcode === code);

      if (product && listId) {
        await ShoppingListController.addItemToList(listId, product.id);
        toast.success(t('scanner.product_added'));
        loadListData();
      } else {
        toast.error(t('scanner.error'));
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(t('common.error'));
    } finally {
      setShowScanner(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await ShoppingListController.removeItemFromList(itemId);
      toast.success(t('common.success'));
      loadListData();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error(t('common.error'));
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await ShoppingListController.updateItemQuantity(itemId, newQuantity);
      loadListData();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(t('common.error'));
    }
  };

  const startShopping = async () => {
    if (!listId) return;
    try {
      await ShoppingListController.updateListStatus(listId, 'ongoing');
      toast.success(t('common.success'));
      loadListData();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    }
  };

  const completeList = async () => {
    if (!listId) return;
    try {
      await ShoppingListController.updateListStatus(listId, 'completed');
      toast.success(t('common.success'));
      navigate('/listas');
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    }
  };

  const total = ShoppingListController.calculateTotal(items);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-20 flex items-center justify-center">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-24 px-4 pb-20 max-w-4xl mx-auto animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate('/listas')}
          className="mb-6 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('nav.lists')}
        </Button>

        <div className="flex items-center justify-between mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold text-gradient-gold">{list?.name}</h1>
          {list?.status === 'previous' && (
            <Button
              onClick={startShopping}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Iniciar Compra
            </Button>
          )}
          {list?.status === 'ongoing' && (
            <Button
              onClick={completeList}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              {t('lists.complete_list')}
            </Button>
          )}
        </div>

        {list?.status !== 'completed' && (
          <div className="flex gap-4 mb-8">
            <Button
              onClick={() => setShowScanner(true)}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground gold-glow"
            >
              <QrCode className="w-5 h-5 mr-2" />
              {t('lists.scan_product')}
            </Button>
            <Button
              onClick={() => navigate('/produtos')}
              variant="outline"
              className="flex-1 border-secondary/30"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('lists.add_manually')}
            </Button>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {items.length === 0 ? (
            <Card className="p-12 text-center animate-scale-in">
              <p className="text-muted-foreground">{t('lists.empty')}</p>
            </Card>
          ) : (
            items.map((item, index) => (
              <Card 
                key={item.id} 
                className="p-4 hover:border-secondary/30 transition-all animate-fade-in gold-glow"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  {item.products?.image_url && (
                    <img
                      src={item.products.image_url}
                      alt={item.products.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.products?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      R$ {item.products?.price.toFixed(2)}
                    </p>
                  </div>
                  {list?.status !== 'completed' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}
                  {list?.status === 'completed' && (
                    <span className="text-muted-foreground">x{item.quantity}</span>
                  )}
                  <div className="text-right min-w-24">
                    <p className="font-semibold">
                      R$ {((item.products?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  {list?.status !== 'completed' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-secondary/30 gold-glow animate-scale-in">
          <div className="flex items-center justify-between text-2xl font-bold">
            <span>{t('lists.total')}</span>
            <span className="text-gradient-gold text-3xl">R$ {total.toFixed(2)}</span>
          </div>
        </Card>
      </main>

      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default ListDetail;
