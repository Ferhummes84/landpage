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

  const httpServer = createServer(app);
  return httpServer;
}