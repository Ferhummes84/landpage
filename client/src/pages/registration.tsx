import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertRegistrationSchema, type InsertRegistration } from "@shared/schema";
import { CleannetLogo } from "@/components/cleannet-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

// Placeholder for the new Cadastro page
function CadastroPage() {
  const [, setLocation] = useLocation();

  const handleStartClick = () => {
    // Redirect to webhook as per the requirement
    window.location.href = "YOUR_WEBHOOK_URL_HERE"; // Replace with actual webhook URL
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col items-center justify-center p-6">
      <CleannetLogo className="mb-8" />
      <h1 className="text-4xl font-bold mb-4 text-center">Cadastro</h1>
      <p className="text-xl text-muted-foreground mb-8 text-center">
        Inicie seu cadastro
      </p>
      <Button
        onClick={handleStartClick}
        className="w-full max-w-sm px-8 py-4 rounded-lg font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-200"
        data-testid="button-start-cadastro"
      >
        Começar
      </Button>
    </div>
  );
}

export default function Registration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<InsertRegistration>({
    resolver: zodResolver(insertRegistrationSchema),
    defaultValues: {
      cpf: "",
      nomeCompleto: "",
      endereco: "",
      email: "",
    },
    mode: "onChange",
  });

  // Mocking LED status for demonstration. In a real app, this would be driven by mutation state.
  const [ledStatus, setLedStatus] = useState({
    step1: 'inactive', // e.g., waiting for data input
    step2: 'inactive', // e.g., processing
    step3: 'inactive', // e.g., completed
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: InsertRegistration) => {
      // Simulate different process steps
      setLedStatus({ step1: 'active', step2: 'inactive', step3: 'inactive' });
      const response = await fetch("/api/registration", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (response.ok) {
        setLedStatus({ step1: 'completed', step2: 'active', step3: 'inactive' });
      } else {
        setLedStatus({ step1: 'error', step2: 'inactive', step3: 'inactive' });
        throw new Error(result.message || "Erro desconhecido");
      }
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: data.message,
      });
      // Store registration ID for file upload
      sessionStorage.setItem('registrationId', data.registration.id);
      setLedStatus({ step1: 'completed', step2: 'completed', step3: 'active' });
      setLocation("/upload");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setLedStatus(prev => ({ ...prev, step2: 'error' })); // Mark step 2 as error
    },
  });

  const onSubmit = (data: InsertRegistration) => {
    registrationMutation.mutate(data);
  };

  const { formState: { isValid } } = form;
  const isSubmitting = registrationMutation.isPending;

  // Added function to navigate to the new Cadastro page
  const goToCadastro = () => {
    setLocation("/cadastro");
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
            <h1 className="text-3xl font-bold text-foreground">Cadastro Contratação</h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Informações para contratação
            </p>
          </div>

          {/* Status LEDs (Example) */}
          <div className="flex justify-center space-x-4 mb-8">
            <div className={`w-4 h-4 rounded-full ${ledStatus.step1 === 'active' ? 'bg-destructive' : ledStatus.step1 === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} data-testid="led-step1"></div>
            <div className={`w-4 h-4 rounded-full ${ledStatus.step2 === 'active' ? 'bg-destructive' : ledStatus.step2 === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} data-testid="led-step2"></div>
            <div className={`w-4 h-4 rounded-full ${ledStatus.step3 === 'active' ? 'bg-destructive' : ledStatus.step3 === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} data-testid="led-step3"></div>
          </div>


          {/* Registration Form */}
          <Card className="bg-card rounded-lg shadow-sm border border-border">
            <CardContent className="p-8 space-y-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* CPF Field */}
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="block text-sm font-medium text-foreground">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="123.123.123-12"
                    {...form.register("cpf")}
                    className="form-field w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground"
                    data-testid="input-cpf"
                  />
                  {form.formState.errors.cpf && (
                    <p className="text-sm text-destructive">{form.formState.errors.cpf.message}</p>
                  )}
                </div>

                {/* Nome Completo Field */}
                <div className="space-y-2">
                  <Label htmlFor="nomeCompleto" className="block text-sm font-medium text-foreground">
                    Nome Completo
                  </Label>
                  <Input
                    id="nomeCompleto"
                    placeholder="Digite seu Nome Completo"
                    {...form.register("nomeCompleto")}
                    className="form-field w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground"
                    data-testid="input-nome-completo"
                  />
                  {form.formState.errors.nomeCompleto && (
                    <p className="text-sm text-destructive">{form.formState.errors.nomeCompleto.message}</p>
                  )}
                </div>

                {/* Endereço Field */}
                <div className="space-y-2">
                  <Label htmlFor="endereco" className="block text-sm font-medium text-foreground">
                    Endereço
                  </Label>
                  <Input
                    id="endereco"
                    placeholder="Rua Exemplo 123, Bairro, Cidade"
                    {...form.register("endereco")}
                    className="form-field w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground"
                    data-testid="input-endereco"
                  />
                  {form.formState.errors.endereco && (
                    <p className="text-sm text-destructive">{form.formState.errors.endereco.message}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu Email"
                    {...form.register("email")}
                    className="form-field w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground"
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className={`w-full mt-8 px-6 py-4 rounded-md font-medium transition-all duration-200 ${
                    isValid && !isSubmitting
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Enviando..." : "Enviar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Button to navigate to the new Cadastro page */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={goToCadastro}
              className="px-6 py-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              data-testid="button-go-to-cadastro"
            >
              Ir para Cadastro
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Note: The routing for CadastroPage needs to be set up in your main App component or router configuration.
// For example, in your main router file:
// import { Route } from "wouter";
//
// function App() {
//   return (
//     <>
//       <Route path="/cadastro" component={CadastroPage} />
//       <Route path="/registration" component={Registration} /> {/* Assuming this is your registration route */}
//       {/* other routes */}
//     </>
//   );
// }