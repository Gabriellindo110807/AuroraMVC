import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductController } from "@/controllers/ProductController";
import { CartController } from "@/controllers/CartController";
import type { Product } from "@/models/Product";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, ShoppingCart, Filter, Package } from "lucide-react";

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadCartCount(session.user.id);
      }
    });
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        ProductController.getAllProducts(),
        ProductController.getCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error: any) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async (userId: string) => {
    try {
      const items = await CartController.getCartItems(userId);
      setCartCount(items.length);
    } catch (error) {
      console.error("Error loading cart count:", error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      await CartController.addToCart(user.id, productId, 1);
      toast.success("Produto adicionado ao carrinho!");
      loadCartCount(user.id);
    } catch (error: any) {
      toast.error("Erro ao adicionar produto");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-secondary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Produtos <span className="text-gradient-gold">Disponíveis</span>
          </h1>
          <p className="text-muted-foreground">Encontre tudo que você precisa</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos, categorias ou código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-card border-border"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-secondary text-secondary-foreground" : ""}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-secondary text-secondary-foreground" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-4 bg-card/50 backdrop-blur-sm border-border hover:border-secondary/30 transition-all duration-300 hover:gold-glow">
              <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
              
              <Badge className="mb-2 bg-secondary/20 text-secondary border-secondary/30">
                {product.category}
              </Badge>
              
              <h3 className="font-semibold mb-1 text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-secondary">
                  R$ {product.price.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Estoque: {product.stock}
                </span>
              </div>

              <Button
                onClick={() => handleAddToCart(product.id)}
                disabled={product.stock === 0}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;
