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

        const webhookResponse = await fetch('https://n8n.automabot.net.br/webhook-test/cadastro', {
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

  // Resume workflow endpoint (for file uploads)
  app.post("/api/resume-workflow", upload.single('file'), async (req, res) => {
    try {
      const resumeUrl = req.query.resumeUrl as string;

      if (!resumeUrl) {
        return res.status(400).json({
          success: false,
          error: "resumeUrl is required"
        });
      }

      console.log('Forwarding request to:', resumeUrl);
      console.log('Request has file:', !!req.file);
      console.log('Request body:', req.body);

      if (req.file) {
        // Handle file upload - create FormData
        const formData = new FormData();
        
        // Read file from disk
        const fileBuffer = fs.readFileSync(req.file.path);
        const blob = new Blob([fileBuffer], { type: req.file.mimetype || 'application/octet-stream' });
        formData.append('file', blob, req.file.originalname);
        
        // Add other form fields
        Object.keys(req.body).forEach(key => {
          formData.append(key, req.body[key]);
        });
        
        formData.append('fileName', req.file.originalname);
        formData.append('fileSize', `${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
        formData.append('type', 'file_upload');

        const response = await fetch(resumeUrl, {
          method: 'POST',
          body: formData,
        });

        // Clean up temporary file
        fs.unlinkSync(req.file.path);

        const result = await response.json();
        console.log('n8n file upload response:', result);
        res.json(result);
      } else {
        // Handle regular JSON data
        const response = await fetch(resumeUrl, {
          method: 'POST',
          body: JSON.stringify(req.body),
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const result = await response.json();
        console.log('n8n JSON response:', result);
        res.json(result);
      }
    } catch (error) {
      console.error('Resume workflow error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Erro ao processar"
      });
    }
  });

  // File upload endpoint (deprecated - use resume workflow instead)
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

        const webhookResponse = await fetch('https://n8n.automabot.net.br/webhook/cadastro', {
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