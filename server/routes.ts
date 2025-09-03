import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRegistrationSchema } from "@shared/schema";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Registration endpoint
  app.post("/api/registration", async (req, res) => {
    try {
      const validatedData = insertRegistrationSchema.parse(req.body);
      const registration = await storage.createRegistration(validatedData);

      // Send data to webhook
      try {
        const webhookResponse = await fetch('https://n8n.automabot.net.br/webhook-test/cadastro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'registration',
            data: validatedData,
            registrationId: registration.id,
          }),
        });

        if (!webhookResponse.ok) {
          console.error('Webhook error:', webhookResponse.statusText);
        }
      } catch (webhookError) {
        console.error('Failed to send to webhook:', webhookError);
        // Continue with the response even if webhook fails
      }

      res.json({ 
        success: true, 
        registration,
        message: "Cadastro realizado com sucesso" 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro no cadastro" 
      });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "Nenhum arquivo foi enviado" 
        });
      }

      const { registrationId } = req.body;
      
      const uploadRecord = await storage.createUpload({
        registrationId: registrationId || null,
        fileName: req.file.originalname,
        fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'uploading',
      });

      // Update status to uploaded
      await storage.updateUploadStatus(uploadRecord.id, 'uploaded');

      // Send file data to webhook
      try {
        const formData = new FormData();
        formData.append('type', 'file_upload');
        formData.append('registrationId', registrationId || '');
        formData.append('fileName', req.file.originalname);
        formData.append('fileSize', uploadRecord.fileSize);
        formData.append('uploadId', uploadRecord.id);

        const webhookResponse = await fetch('https://n8n.automabot.net.br/webhook-test/cadastro', {
          method: 'POST',
          body: formData,
        });

        if (webhookResponse.ok) {
          await storage.updateUploadStatus(uploadRecord.id, 'completed');
        } else {
          await storage.updateUploadStatus(uploadRecord.id, 'error');
          console.error('Webhook upload error:', webhookResponse.statusText);
        }
      } catch (webhookError) {
        await storage.updateUploadStatus(uploadRecord.id, 'error');
        console.error('Failed to send file to webhook:', webhookError);
      }

      const finalUpload = await storage.updateUploadStatus(uploadRecord.id, 'completed');
      
      res.json({ 
        success: true, 
        upload: finalUpload,
        message: "Arquivo enviado com sucesso" 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro no upload" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
