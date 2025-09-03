import { type User, type InsertUser, type Registration, type InsertRegistration, type Upload, type InsertUpload } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  getRegistration(id: string): Promise<Registration | undefined>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  updateUploadStatus(id: string, status: string): Promise<Upload | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private registrations: Map<string, Registration>;
  private uploads: Map<string, Upload>;

  constructor() {
    this.users = new Map();
    this.registrations = new Map();
    this.uploads = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = randomUUID();
    const registration: Registration = { 
      ...insertRegistration, 
      id,
      createdAt: new Date()
    };
    this.registrations.set(id, registration);
    return registration;
  }

  async getRegistration(id: string): Promise<Registration | undefined> {
    return this.registrations.get(id);
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const id = randomUUID();
    const upload: Upload = { 
      ...insertUpload, 
      registrationId: insertUpload.registrationId || null,
      status: insertUpload.status || 'uploading',
      id,
      createdAt: new Date()
    };
    this.uploads.set(id, upload);
    return upload;
  }

  async updateUploadStatus(id: string, status: string): Promise<Upload | undefined> {
    const upload = this.uploads.get(id);
    if (upload) {
      upload.status = status;
      this.uploads.set(id, upload);
    }
    return upload;
  }
}

export const storage = new MemStorage();
