import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ShoppingCart, Mail, Lock, User, Phone, CreditCard } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    cpf: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/produtos");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate("/produtos");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name
            },
            emailRedirectTo: `${window.location.origin}/produtos`
          }
        });

        if (error) throw error;

        // Update profile with additional data
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({
              phone: formData.phone,
              cpf: formData.cpf
            })
            .eq('id', user.id);
        }

        toast.success("Cadastro realizado com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-sm border-border animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-gold flex items-center justify-center">
            <ShoppingCart className="w-7 h-7 text-navy" />
          </div>
          <span className="text-2xl font-bold text-gradient-gold">SmartCart</span>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Bem-vindo de volta" : "Criar conta"}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome completo
                </label>
                <Input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Seu nome"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  CPF
                </label>
                <Input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="bg-background border-border"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha
            </label>
            <Input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="bg-background border-border"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold gold-glow"
          >
            {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-secondary transition-colors"
          >
            {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
