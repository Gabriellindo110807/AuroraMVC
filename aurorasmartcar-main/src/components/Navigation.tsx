import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart } from "lucide-react";
import { CartController } from "@/controllers/CartController";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./LanguageSelector";

const Navigation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCartCount(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      loadCartCount(session.user.id);
    }
  };

  const loadCartCount = async (userId: string) => {
    try {
      const items = await CartController.getCartItems(userId);
      setItemCount(items.length);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-secondary/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <ShoppingCart className="w-8 h-8 text-secondary transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold text-gradient-gold">Aurora</span>
          </Link>

          <div className="flex items-center gap-8">
            <Link 
              to="/produtos" 
              className="text-foreground hover:text-secondary transition-all hover:scale-105 font-medium"
            >
              {t('nav.products')}
            </Link>
            <Link 
              to="/listas" 
              className="text-foreground hover:text-secondary transition-all hover:scale-105 font-medium"
            >
              {t('nav.lists')}
            </Link>
            <Link 
              to="/carrinho" 
              className="relative text-foreground hover:text-secondary transition-all hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-scale-in gold-glow">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link 
              to="/historico" 
              className="text-foreground hover:text-secondary transition-all hover:scale-105 font-medium"
            >
              {t('nav.history')}
            </Link>
            
            <div className="ml-4 pl-4 border-l border-secondary/30">
              <LanguageSelector />
            </div>

            {user ? (
              <button
                onClick={handleSignOut}
                className="text-foreground hover:text-secondary transition-all hover:scale-105 font-medium"
              >
                {t('auth.sign_out')}
              </button>
            ) : (
              <Link 
                to="/auth" 
                className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg font-medium transition-all gold-glow"
              >
                {t('auth.sign_in')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
