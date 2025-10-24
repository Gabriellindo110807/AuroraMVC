import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, ListChecks, Clock, CheckCircle, FileText } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingListController, ShoppingList } from '@/controllers/ShoppingListController';
import { toast } from 'sonner';

const Lists = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      loadLists(session.user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        loadLists(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadLists = async (userId: string) => {
    try {
      setLoading(true);
      const data = await ShoppingListController.getLists(userId);
      setLists(data);
    } catch (error) {
      console.error('Error loading lists:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!newListName.trim() || !user) return;

    try {
      await ShoppingListController.createList(user.id, newListName);
      toast.success(t('common.success'));
      setNewListName('');
      setDialogOpen(false);
      loadLists(user.id);
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error(t('common.error'));
    }
  };

  const getListsByStatus = (status: string) => {
    return lists.filter(list => list.status === status);
  };

  const ListCard = ({ list }: { list: ShoppingList }) => (
    <Card 
      className="p-6 hover:border-secondary/30 transition-all cursor-pointer gold-glow"
      onClick={() => navigate(`/listas/${list.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">{list.name}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(list.created_at).toLocaleDateString()}
          </p>
        </div>
        {list.status === 'previous' && <FileText className="w-5 h-5 text-secondary" />}
        {list.status === 'ongoing' && <Clock className="w-5 h-5 text-accent animate-pulse" />}
        {list.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>
    </Card>
  );

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
      
      <main className="pt-24 px-4 pb-20 max-w-7xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ListChecks className="w-8 h-8 text-secondary animate-slide-in" />
            <h1 className="text-4xl font-bold text-gradient-gold">{t('lists.title')}</h1>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gold-glow">
                <Plus className="w-5 h-5 mr-2" />
                {t('lists.new_list')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('lists.create_list')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="listName">{t('lists.list_name')}</Label>
                  <Input
                    id="listName"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder={t('lists.list_name')}
                  />
                </div>
                <Button 
                  onClick={createList}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  {t('common.save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="previous" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="previous">{t('lists.previous')}</TabsTrigger>
            <TabsTrigger value="ongoing">{t('lists.ongoing')}</TabsTrigger>
            <TabsTrigger value="completed">{t('lists.completed')}</TabsTrigger>
          </TabsList>

          <TabsContent value="previous" className="space-y-4">
            {getListsByStatus('previous').length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t('lists.empty')}</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getListsByStatus('previous').map(list => (
                  <ListCard key={list.id} list={list} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ongoing" className="space-y-4">
            {getListsByStatus('ongoing').length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t('lists.empty')}</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getListsByStatus('ongoing').map(list => (
                  <ListCard key={list.id} list={list} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {getListsByStatus('completed').length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t('lists.empty')}</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getListsByStatus('completed').map(list => (
                  <ListCard key={list.id} list={list} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gold-glow shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default Lists;
