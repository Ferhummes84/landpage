import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, FileText, X, Plus } from "lucide-react";
import { CleannetLogo } from "@/components/cleannet-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface StatusIndicatorProps {
  status: "processo-iniciado" | "arquivo-subido" | "problema-upload" | "finalizado";
  currentStatus: string;
  children: React.ReactNode;
}

function StatusIndicator({ status, currentStatus, children }: StatusIndicatorProps) {
  const isActive = currentStatus === status;
  
  const dotColors = {
    "processo-iniciado": isActive ? "bg-green-500" : "bg-gray-300",
    "arquivo-subido": isActive ? "bg-yellow-500" : "bg-gray-300", 
    "problema-upload": isActive ? "bg-red-500" : "bg-gray-300",
    "finalizado": isActive ? "bg-blue-500" : "bg-gray-300",
  };

  return (
    <div className="flex items-center gap-3 py-2" data-testid={`status-${status}`}>
      <div className={`w-3 h-3 rounded-full ${dotColors[status]}`}></div>
      <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>
        {children}
      </span>
    </div>
  );
}

export default function FileUploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"processo-iniciado" | "arquivo-subido" | "problema-upload" | "finalizado">("processo-iniciado");
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadStatus("arquivo-subido");
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'file_upload');
      
      const registrationId = sessionStorage.getItem('registrationId');
      if (registrationId) {
        formData.append('registrationId', registrationId);
      }
      
      formData.append('fileName', file.name);
      formData.append('fileSize', `${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // Send directly to the webhook
      const response = await fetch('https://n8n.automabot.net.br/webhook/cadastro', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadStatus("finalizado");
      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });
    },
    onError: (error) => {
      setUploadStatus("problema-upload");
      toast({
        title: "Erro no Upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadStatus("processo-iniciado");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Carregar Arquivo</h1>
            <p className="text-lg text-muted-foreground">
              Escolha um arquivo para enviar
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Status Panel */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">Status</h2>
              
              <div className="space-y-4">
                <StatusIndicator status="processo-iniciado" currentStatus={uploadStatus}>
                  Processo iniciado
                </StatusIndicator>
                
                <StatusIndicator status="arquivo-subido" currentStatus={uploadStatus}>
                  Arquivo subido
                </StatusIndicator>
                
                <StatusIndicator status="problema-upload" currentStatus={uploadStatus}>
                  Problema de Upload
                </StatusIndicator>
                
                <StatusIndicator status="finalizado" currentStatus={uploadStatus}>
                  Finalizado
                </StatusIndicator>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-6">
              <Card className="bg-card rounded-2xl shadow-sm border border-border">
                <CardContent className="p-12">
                  {!selectedFile ? (
                    <div
                      className={`border-2 border-dashed border-border rounded-2xl p-16 text-center space-y-6 cursor-pointer transition-all duration-200 ${
                        isDragOver ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => document.getElementById('file-input')?.click()}
                      data-testid="upload-area"
                    >
                      <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                          <FileText className="w-20 h-20 text-muted-foreground" />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-muted-foreground rounded-full flex items-center justify-center">
                            <Plus className="w-5 h-5 text-background" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Clique aqui ou arraste um arquivo
                          </p>
                        </div>
                      </div>
                      
                      <input
                        type="file"
                        id="file-input"
                        className="hidden"
                        onChange={handleFileInput}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        data-testid="file-input"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6" data-testid="file-info">
                      <div className="bg-muted rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground" data-testid="file-name">
                                {selectedFile.name}
                              </p>
                              <p className="text-sm text-muted-foreground" data-testid="file-size">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleFileRemove}
                            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                            data-testid="remove-file-button"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Upload Button */}
              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || uploadStatus === "finalizado"}
                  className={`w-full py-6 rounded-2xl font-medium text-lg transition-all duration-200 ${
                    uploadStatus === "finalizado"
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : uploadStatus === "problema-upload"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : uploadMutation.isPending
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  data-testid="button-upload"
                >
                  {uploadMutation.isPending
                    ? "Enviando..."
                    : uploadStatus === "finalizado"
                    ? "Arquivo Enviado"
                    : uploadStatus === "problema-upload"
                    ? "Tentar Novamente"
                    : "Enviar"
                  }
                </Button>
              )}
            </div>
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