import { useState, useCallback } from "react";
import { Upload, X, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: File | null;
  isUploading?: boolean;
  uploadError?: string | null;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  isUploading = false,
  uploadError,
  className
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!selectedFile ? (
        <div
          className={cn(
            "upload-area rounded-lg p-12 text-center space-y-4 cursor-pointer",
            isDragOver && "dragover"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
          data-testid="upload-area"
        >
          <div className="mx-auto w-16 h-16 text-muted-foreground">
            <Upload className="w-full h-full" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">Enviar</h3>
            <p className="text-sm text-muted-foreground">
              Clique aqui ou arraste um arquivo
            </p>
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
        <div className="bg-muted rounded-md p-4 space-y-2" data-testid="file-info">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground" data-testid="file-name">
                {selectedFile.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
              data-testid="remove-file-button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground" data-testid="file-size">
            {formatFileSize(selectedFile.size)}
          </div>
          {uploadError && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
