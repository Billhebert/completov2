// src/modules/chat/sockets.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { EventBus, Events } from '../../core/event-bus';
import { logger } from '../../core/logger';
import jwt from 'jsonwebtoken';
import { env } from '../../core/config/env';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    companyId: string;
    email: string;
    role: string;
  };
}

export function setupChatSockets(
  io: SocketIOServer,
  prisma: PrismaClient,
  eventBus: EventBus
) {
  const chatNamespace = io.of('/chat');

  // ============================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================
  chatNamespace.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      socket.user = {
        id: decoded.userId,
        companyId: decoded.companyId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // ============================================
  // CONNECTION
  // ============================================
  chatNamespace.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.user!.id;
    const companyId = socket.user!.companyId;

    logger.info({ userId, companyId, socketId: socket.id }, 'User connected to chat');

    // Join company room
    await socket.join(`company:${companyId}`);
    
    // Join user-specific room
    await socket.join(`user:${userId}`);

    // Join all user's channels
    const userChannels = await prisma.channelMember.findMany({
      where: { userId, companyId },
      include: { channel: true },
    });

    for (const membership of userChannels) {
      await socket.join(`channel:${membership.channelId}`);
    }

    // Notify presence
    await eventBus.publish(Events.USER_ONLINE, {
      type: Events.USER_ONLINE,
      version: 'v1',
      timestamp: new Date(),
      companyId,
      userId,
      data: { userId, status: 'online' },
    });

    chatNamespace.to(`company:${companyId}`).emit('user:online', {
      userId,
      timestamp: new Date(),
    });

    // ============================================
    // CHANNEL EVENTS
    // ============================================

    // Join channel
    socket.on('channel:join', async (data: { channelId: string }) => {
      try {
        const { channelId } = data;

        // Verify membership
        const membership = await prisma.channelMember.findUnique({
          where: {
            channelId_userId: {
              channelId,
              userId,
            },
          },
        });

        if (!membership) {
          socket.emit('error', { message: 'Not a member of this channel' });
          return;
        }

        await socket.join(`channel:${channelId}`);
        socket.emit('channel:joined', { channelId });

        logger.info({ userId, channelId }, 'User joined channel');
      } catch (error) {
        logger.error({ error }, 'Failed to join channel');
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Leave channel
    socket.on('channel:leave', async (data: { channelId: string }) => {
      const { channelId } = data;
      await socket.leave(`channel:${channelId}`);
      socket.emit('channel:left', { channelId });
    });

    // ============================================
    // MESSAGE EVENTS
    // ============================================

    // Send message
    socket.on('message:send', async (data: {
      channelId?: string;
      directConversationId?: string;
      content: string;
      parentMessageId?: string;
    }) => {
      try {
        const { channelId, directConversationId, content, parentMessageId } = data;

        // Create message
        const message = await prisma.message.create({
          data: {
            companyId,
            channelId: channelId || null,
            directConversationId: directConversationId || null,
            authorId: userId,
            content,
            parentMessageId: parentMessageId || null,
            status: 'sent',
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Add to thread if replying
        if (parentMessageId) {
          await prisma.messageThread.create({
            data: {
              parentMessageId,
              messageId: message.id,
            },
          });
        }

        // Emit to channel or conversation
        const room = channelId 
          ? `channel:${channelId}` 
          : `conversation:${directConversationId}`;

        chatNamespace.to(room).emit('message:new', {
          message,
          timestamp: new Date(),
        });

        // Publish event
        await eventBus.publish(Events.CHAT_MESSAGE_SENT, {
          type: Events.CHAT_MESSAGE_SENT,
          version: 'v1',
          timestamp: new Date(),
          companyId,
          userId,
          data: {
            messageId: message.id,
            channelId: message.channelId,
            directConversationId: message.directConversationId,
            preview: content.substring(0, 100),
          },
        });

        logger.info({ messageId: message.id, channelId, userId }, 'Message sent');
      } catch (error) {
        logger.error({ error }, 'Failed to send message');
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Edit message
    socket.on('message:edit', async (data: {
      messageId: string;
      content: string;
    }) => {
      try {
        const { messageId, content } = data;

        // Verify ownership
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            authorId: userId,
            companyId,
          },
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or not authorized' });
          return;
        }

        // Update message
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: {
            content,
            editedAt: new Date(),
          },
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Broadcast update
        const room = message.channelId 
          ? `channel:${message.channelId}` 
          : `conversation:${message.directConversationId}`;

        chatNamespace.to(room).emit('message:edited', {
          message: updated,
          timestamp: new Date(),
        });

        await eventBus.publish(Events.CHAT_MESSAGE_EDITED, {
          type: Events.CHAT_MESSAGE_EDITED,
          version: 'v1',
          timestamp: new Date(),
          companyId,
          userId,
          data: { messageId, content },
        });

        logger.info({ messageId, userId }, 'Message edited');
      } catch (error) {
        logger.error({ error }, 'Failed to edit message');
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Delete message
    socket.on('message:delete', async (data: { messageId: string }) => {
      try {
        const { messageId } = data;

        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            authorId: userId,
            companyId,
          },
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or not authorized' });
          return;
        }

        // Soft delete
        await prisma.message.update({
          where: { id: messageId },
          data: { deletedAt: new Date() },
        });

        // Broadcast deletion
        const room = message.channelId 
          ? `channel:${message.channelId}` 
          : `conversation:${message.directConversationId}`;

        chatNamespace.to(room).emit('message:deleted', {
          messageId,
          timestamp: new Date(),
        });

        await eventBus.publish(Events.CHAT_MESSAGE_DELETED, {
          type: Events.CHAT_MESSAGE_DELETED,
          version: 'v1',
          timestamp: new Date(),
          companyId,
          userId,
          data: { messageId },
        });

        logger.info({ messageId, userId }, 'Message deleted');
      } catch (error) {
        logger.error({ error }, 'Failed to delete message');
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // ============================================
    // REACTIONS
    // ============================================

    socket.on('message:react', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        const { messageId, emoji } = data;

        // Verify message exists
        const message = await prisma.message.findFirst({
          where: { id: messageId, companyId },
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Add or remove reaction
        const existing = await prisma.messageReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId,
              userId,
              emoji,
            },
          },
        });

        if (existing) {
          // Remove reaction
          await prisma.messageReaction.delete({
            where: { id: existing.id },
          });

          const room = message.channelId 
            ? `channel:${message.channelId}` 
            : `conversation:${message.directConversationId}`;

          chatNamespace.to(room).emit('message:reaction:removed', {
            messageId,
            userId,
            emoji,
            timestamp: new Date(),
          });
        } else {
          // Add reaction
          await prisma.messageReaction.create({
            data: {
              companyId,
              messageId,
              userId,
              emoji,
            },
          });

          const room = message.channelId 
            ? `channel:${message.channelId}` 
            : `conversation:${message.directConversationId}`;

          chatNamespace.to(room).emit('message:reaction:added', {
            messageId,
            userId,
            emoji,
            timestamp: new Date(),
          });
        }

        logger.info({ messageId, userId, emoji }, 'Reaction toggled');
      } catch (error) {
        logger.error({ error }, 'Failed to toggle reaction');
        socket.emit('error', { message: 'Failed to toggle reaction' });
      }
    });

    // ============================================
    // TYPING INDICATORS
    // ============================================

    socket.on('typing:start', (data: {
      channelId?: string;
      directConversationId?: string;
    }) => {
      const { channelId, directConversationId } = data;
      const room = channelId 
        ? `channel:${channelId}` 
        : `conversation:${directConversationId}`;

      socket.to(room).emit('user:typing', {
        userId,
        channelId,
        directConversationId,
        timestamp: new Date(),
      });
    });

    socket.on('typing:stop', (data: {
      channelId?: string;
      directConversationId?: string;
    }) => {
      const { channelId, directConversationId } = data;
      const room = channelId 
        ? `channel:${channelId}` 
        : `conversation:${directConversationId}`;

      socket.to(room).emit('user:stopped-typing', {
        userId,
        channelId,
        directConversationId,
        timestamp: new Date(),
      });
    });

    // ============================================
    // READ RECEIPTS
    // ============================================

    socket.on('message:mark-read', async (data: {
      channelId?: string;
      directConversationId?: string;
    }) => {
      try {
        const { channelId, directConversationId } = data;

        if (channelId) {
          await prisma.channelMember.updateMany({
            where: { channelId, userId },
            data: { lastReadAt: new Date() },
          });
        } else if (directConversationId) {
          await prisma.directConversationMember.updateMany({
            where: { conversationId: directConversationId, userId },
            data: { lastReadAt: new Date() },
          });
        }

        socket.emit('messages:marked-read', {
          channelId,
          directConversationId,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error({ error }, 'Failed to mark messages as read');
      }
    });

    // ============================================
    // DISCONNECTION
    // ============================================

    socket.on('disconnect', async () => {
      logger.info({ userId, companyId, socketId: socket.id }, 'User disconnected from chat');

      // Notify offline
      await eventBus.publish(Events.USER_OFFLINE, {
        type: Events.USER_OFFLINE,
        version: 'v1',
        timestamp: new Date(),
        companyId,
        userId,
        data: { userId, status: 'offline' },
      });

      chatNamespace.to(`company:${companyId}`).emit('user:offline', {
        userId,
        timestamp: new Date(),
      });
    });
  });

  logger.info('✅ Chat Socket.IO handlers initialized');
}
