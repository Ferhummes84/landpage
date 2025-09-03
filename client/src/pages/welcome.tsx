
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CleannetLogo } from "@/components/cleannet-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const startProcessMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('https://n8n.automabot.net.br/webhook-test/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'start_process',
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar processo');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('Webhook response:', data);
      // Store resumeUrl if provided
      if (data.resumeUrl) {
        sessionStorage.setItem('resumeUrl', data.resumeUrl);
      }
      toast({
        title: "Processo Iniciado",
        description: "Redirecionando para o cadastro...",
      });
      setLocation("/registration");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStart = () => {
    startProcessMutation.mutate();
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <div className="flex items-center">
          <CleannetLogo />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Cadastro</h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Bem-vindo! Clique no botão abaixo para iniciar o processo de cadastro.
            </p>
          </div>

          {/* Start Card */}
          <Card className="bg-card rounded-lg shadow-sm border border-border">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Pronto para começar?
                  </h2>
                  <p className="text-muted-foreground">
                    Inicie seu processo de cadastro conosco. É rápido e simples.
                  </p>
                </div>

                {/* Start Button */}
                <Button
                  onClick={handleStart}
                  disabled={startProcessMutation.isPending}
                  className={`w-full mt-8 px-6 py-4 rounded-md font-medium transition-all duration-200 ${
                    startProcessMutation.isPending
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                  }`}
                  data-testid="button-start"
                >
                  {startProcessMutation.isPending ? "Iniciando..." : "Começar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
