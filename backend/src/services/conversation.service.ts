import prisma from '../db/prisma.js';
import { Prisma } from '@prisma/client';
import { ChatMessage } from '../types/index.js';

export class ConversationService {
  async getOrCreateUser(userId?: string): Promise<string> {
    if (userId) {
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (existing) return existing.id;
    }

    // Create a default user for single-user mode
    const user = await prisma.user.upsert({
      where: { id: 'default-user' },
      update: {},
      create: {
        id: 'default-user',
        name: 'Default User',
      },
    });

    return user.id;
  }

  async createConversation(userId: string, title?: string) {
    return prisma.conversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
      },
    });
  }

  async getConversation(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async listConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async addMessage(conversationId: string, role: string, content: string, metadata?: Record<string, unknown>) {
    return prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        metadata: (metadata || {}) as Prisma.InputJsonValue,
      },
    });
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
  }

  async deleteConversation(conversationId: string) {
    return prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  async updateConversationTitle(conversationId: string, title: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }
}

export const conversationService = new ConversationService();
