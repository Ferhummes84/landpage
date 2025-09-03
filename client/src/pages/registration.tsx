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

  const registrationMutation = useMutation({
    mutationFn: async (data: InsertRegistration) => {
      const response = await apiRequest("POST", "/api/registration", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: data.message,
      });
      // Store registration ID for file upload
      sessionStorage.setItem('registrationId', data.registration.id);
      setLocation("/upload");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRegistration) => {
    registrationMutation.mutate(data);
  };

  const { formState: { isValid } } = form;
  const isSubmitting = registrationMutation.isPending;

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
        </div>
      </main>
    </div>
  );
}
