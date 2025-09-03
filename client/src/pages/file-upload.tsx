import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Upload } from "lucide-react";
import { CleannetLogo } from "@/components/cleannet-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";

interface StatusIndicatorProps {
  status: "waiting" | "uploading" | "error" | "completed";
  currentStatus: string;
  children: React.ReactNode;
}

function StatusIndicator({ status, currentStatus, children }: StatusIndicatorProps) {
  const isActive = currentStatus === status;
  const dotColors = {
    waiting: "bg-green-500",
    uploading: "bg-orange-500", 
    error: "bg-red-500",
    completed: "bg-blue-500",
  };

  return (
    <div className="status-indicator" data-testid={`status-${status}`}>
      <div className={`w-3 h-3 rounded-full ${dotColors[status]}`}></div>
      <span className={isActive ? "text-foreground" : "text-muted-foreground"}>
        {children}
      </span>
    </div>
  );
}

export default function FileUploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"waiting" | "uploading" | "error" | "completed">("waiting");

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadStatus("uploading");
      
      const formData = new FormData();
      formData.append('file', file);
      
      const registrationId = sessionStorage.getItem('registrationId');
      if (registrationId) {
        formData.append('registrationId', registrationId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadStatus("completed");
      toast({
        title: "Sucesso",
        description: data.message,
      });
    },
    onError: (error) => {
      setUploadStatus("error");
      toast({
        title: "Erro no Upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadStatus("waiting");
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadStatus("waiting");
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const goBackToRegistration = () => {
    setLocation("/");
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
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Carregar Arquivo</h1>
            <p className="text-lg text-muted-foreground">
              Escolha um arquivo para enviar
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Panel */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Status</h2>
              
              <div className="space-y-3">
                <StatusIndicator status="waiting" currentStatus={uploadStatus}>
                  Processo iniciado
                </StatusIndicator>
                
                <StatusIndicator status="uploading" currentStatus={uploadStatus}>
                  Arquivo subido
                </StatusIndicator>
                
                <StatusIndicator status="error" currentStatus={uploadStatus}>
                  Problema de Upload
                </StatusIndicator>
                
                <StatusIndicator status="completed" currentStatus={uploadStatus}>
                  Finalizado
                </StatusIndicator>
              </div>
            </div>

            {/* File Upload Area */}
            <Card className="bg-card rounded-lg shadow-sm border border-border">
              <CardContent className="p-8">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  selectedFile={selectedFile}
                  isUploading={uploadMutation.isPending}
                  uploadError={uploadMutation.error?.message}
                />
                
                {/* Upload button */}
                {selectedFile && (
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending || uploadStatus === "completed"}
                    className={`w-full mt-6 px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                      uploadStatus === "completed"
                        ? "bg-green-500 text-white"
                        : uploadStatus === "error"
                        ? "bg-red-500 text-white"
                        : uploadMutation.isPending
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    }`}
                    data-testid="button-upload"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadMutation.isPending
                      ? "Enviando..."
                      : uploadStatus === "completed"
                      ? "Upload Concluído"
                      : uploadStatus === "error"
                      ? "Erro no Upload"
                      : "Fazer Upload"
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Back button */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={goBackToRegistration}
              className="px-6 py-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Cadastro
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
