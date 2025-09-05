import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRegistrationSchema } from "@shared/schema";
import multer from "multer";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Store webhook responses in memory (for production use a database)
  const webhookResponses = new Map<string, any>();

  // Webhook status endpoint
  app.get("/api/webhook-status/:registrationId", async (req, res) => {
    try {
      const { registrationId } = req.params;
      const response = webhookResponses.get(registrationId);

      if (response) {
        res.json({
          success: true,
          ...response
        });
      } else {
        res.json({
          success: false,
          message: "Aguardando resposta do webhook",
          ready: false
        });
      }
    } catch (error) {
      console.error('Webhook status error:', error);
      res.json({
        success: false,
        error: error instanceof Error ? error.message : "Erro ao verificar status",
        ready: false
      });
    }
  });

  // Registration endpoint
  app.post("/api/registration", async (req, res) => {
    try {
      const validatedData = insertRegistrationSchema.parse(req.body);
      const registration = await storage.createRegistration(validatedData);

      // Send data to webhook
      try {
        const webhookPayload = {
          type: 'registration',
          registrationId: registration.id,
          // Send user data directly in the payload root
          ...validatedData
        };

        console.log('Sending to webhook:', webhookPayload);

        const webhookResponse = await fetch('https://n8n.automabot.net.br/webhook/cadastro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log('Webhook response status:', webhookResponse.status);
        console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));

        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json();
          // Store webhook response for later retrieval
          webhookResponses.set(registration.id, webhookData);
          console.log('Webhook response received:', webhookData);
        } else {
          const errorText = await webhookResponse.text();
          console.error('Webhook error:', webhookResponse.status, errorText);
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

      console.log('File upload received:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        registrationId: registrationId
      });

      const uploadRecord = await storage.createUpload({
        registrationId: registrationId || null,
        fileName: req.file.originalname,
        fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'uploading',
      });

      // Send file data to webhook
      try {
        const formData = new FormData();
        
        // Read file from disk and create blob
        const fileBuffer = fs.readFileSync(req.file.path);
        const blob = new Blob([fileBuffer], { type: req.file.mimetype || 'application/octet-stream' });
        formData.append('file', blob, req.file.originalname);
        
        formData.append('type', 'file_upload');
        formData.append('registrationId', registrationId || '');
        formData.append('fileName', req.file.originalname);
        formData.append('fileSize', uploadRecord.fileSize);
        formData.append('uploadId', uploadRecord.id);

        console.log('Sending file to webhook...');

        const webhookResponse = await fetch('https://n8n.automabot.net.br/webhook/cadastro', {
          method: 'POST',
          body: formData,
        });

        console.log('Webhook response status:', webhookResponse.status);

        // Clean up temporary file
        fs.unlinkSync(req.file.path);

        if (webhookResponse.ok) {
          await storage.updateUploadStatus(uploadRecord.id, 'completed');
          console.log('File uploaded successfully to webhook');
        } else {
          await storage.updateUploadStatus(uploadRecord.id, 'error');
          const errorText = await webhookResponse.text();
          console.error('Webhook upload error:', webhookResponse.status, errorText);
        }
      } catch (webhookError) {
        // Clean up temporary file on error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        await storage.updateUploadStatus(uploadRecord.id, 'error');
        console.error('Failed to send file to webhook:', webhookError);
        
        return res.status(500).json({
          success: false,
          error: "Erro ao enviar arquivo para o webhook"
        });
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