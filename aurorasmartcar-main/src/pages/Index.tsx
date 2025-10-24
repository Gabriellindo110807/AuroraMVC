import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ListChecks, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useTranslation } from "react-i18next";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-navy opacity-30" />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-secondary/20 mb-8">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Revolucione sua experiência de compras</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {t('home.hero_title')}
              <br />
              <span className="text-gradient-gold">Aurora</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              {t('home.hero_subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/listas")}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold gold-glow"
              >
                {t('home.manage_lists')}
                <ListChecks className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/produtos")}
                className="border-secondary/30 hover:bg-secondary/10"
              >
                {t('home.view_products')}
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Produtos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">98%</div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">5min</div>
                <div className="text-sm text-muted-foreground">Média de Compra</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 text-center border-t border-secondary/20">
          <p className="text-sm text-muted-foreground">
            © 2025 Aurora Technology
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
