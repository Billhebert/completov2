/**
 * Chat Service
 *
 * This file provides a comprehensive front‑end interface for the chat
 * subsystem. The original scaffold contained only basic HTTP calls and
 * several TODO comments.  Those comments described a real‑time chat with
 * rooms, message search, file uploads, sentiment analysis, AI suggested
 * replies, scheduling and analytics.  The backend already exposes these
 * capabilities via a combination of REST endpoints (see
 * `backend/src/modules/chat/index.ts` and `backend/src/modules/chat/advanced.ts`) and
 * Socket.IO events (`backend/src/modules/chat/sockets.ts`).
 *
 * This service implements richer helpers that wrap the REST API.  It
 * supports optional sorting and filtering when listing rooms, message
 * history pagination and search, file uploads with client‑side
 * validation, message editing/deleting, read receipts, AI helpers
 * (sentiment analysis, smart replies and conversation summaries),
 * scheduled messages, slash commands and basic analytics.  Real‑time
 * events (typing indicators, reactions, etc.) should be handled by a
 * separate socket client; this service focuses on HTTP semantics.
 */

import api, { extractData } from '../../../core/utils/api';
import type {
  ChatRoom,
  ChatMessage,
  CreateRoomRequest,
  SendMessageRequest,
  ScheduledMessage,
  SlashCommand,
  MessageAnalytics
} from '../types';

/** Options for listing chat rooms. */
export interface ListRoomsParams {
  /**
   * Field to sort by.  Supported values: `lastMessage` (default) or
   * `unreadCount`.  Sorting is always descending.
   */
  sortBy?: 'lastMessage' | 'unreadCount';
  /**
   * Filter rooms by type.  Supported values: `direct`, `group` or
   * `channel`.  When omitted, all types are returned.
   */
  type?: 'direct' | 'group' | 'channel';
  /**
   * When true, include unread message counts in the response.  This may
   * introduce a slight performance overhead on the server.
   */
  includeUnread?: boolean;
}
export async function getAll(): Promise<ChatRoom[]> {
  return getChatRooms();
}
/**
 * List chat rooms.
 *
 * The server will return an array of rooms.  Each room object
 * includes the latest message, participants and optionally an
 * `unreadCount` property when `includeUnread` is true.  Sorting and
 * filtering are implemented by passing query parameters.
 */
export async function getChatRooms(params: ListRoomsParams = {}): Promise<ChatRoom[]> {
  const response = await api.get('/chat/rooms', { params });
  return extractData(response);
}

/**
 * Create a new chat room.  The request must include a list of
 * participants.  For direct conversations (two participants) the
 * backend will either return an existing conversation or create a new
 * one.  When creating a group or channel, the caller may specify
 * additional metadata such as a name or description.
 */
export async function createRoom(data: CreateRoomRequest): Promise<ChatRoom> {
  if (!data.participants || data.participants.length === 0) {
    throw new Error('You must specify at least one participant');
  }
  const response = await api.post('/chat/rooms', data);
  return extractData(response);
}

/**
 * Retrieve messages for a room.  Supports pagination and basic
 * keyword search.  When called, it automatically marks the room as
 * read to reset the unread counter.
 *
 * @param roomId The ID of the chat room
 * @param params Optional parameters: `before` for cursor‑based
 *        pagination (messages before a timestamp or message ID),
 *        `limit` to cap results and `search` to filter by content.
 */
export async function getRoomMessages(
  roomId: string,
  params: { before?: string; limit?: number; search?: string } = {}
): Promise<ChatMessage[]> {
  const response = await api.get(`/chat/rooms/${roomId}/messages`, { params });
  const messages = extractData<ChatMessage[]>(response);
  // Immediately mark as read to clear unread indicator
  await markAsRead(roomId).catch(() => {
    /* non‑critical */
  });
  return messages;
}

/**
 * Send a message to a channel or direct conversation.  Supports
 * optional file uploads.  If a `file` property is provided on the
 * payload, the file will be uploaded first and its URL attached to
 * the message content.  The caller must include at least one of
 * `content`, `file` or `imageUrl`.
 */
export async function sendMessage(data: SendMessageRequest & { file?: File }): Promise<ChatMessage> {
  const payload: any = { ...data };
  // If a file is provided, upload it before sending the message
  if (data.file) {
    const { url, fileName } = await uploadFile(data.file);
    payload.content = payload.content || fileName;
    payload.fileUrl = url;
    delete payload.file;
  }
  if (!payload.content && !payload.fileUrl && !payload.imageUrl) {
    throw new Error('Message must contain text, image or file');
  }
  const response = await api.post('/chat/messages', payload);
  return extractData(response);
}

/**
 * Edit an existing message.  Only the author of the message may edit
 * it.  The backend imposes a time window for edits (e.g., 15
 * minutes); attempts outside that window will be rejected.  Returns
 * the updated message with an `edited` flag set to true.
 */
export async function editMessage(id: string, content: string): Promise<ChatMessage> {
  if (!content.trim()) throw new Error('Content must not be empty');
  const response = await api.patch(`/chat/messages/${id}`, { content });
  return extractData(response);
}

/**
 * Soft delete a message.  The message content will be replaced by a
 * placeholder (e.g., "[Message deleted]") and will no longer
 * contribute to unread counts.  Only the author may delete their own
 * messages.
 */
export async function deleteMessage(id: string): Promise<void> {
  await api.delete(`/chat/messages/${id}`);
}

/**
 * Mark all messages in a room as read.  This resets the unread
 * counter and emits a read receipt event to other participants via
 * WebSocket on the backend.
 */
export async function markAsRead(roomId: string): Promise<void> {
  await api.post(`/chat/rooms/${roomId}/mark-read`);
}

/**
 * Upload an arbitrary file to the chat storage.  Performs basic
 * client‑side validation on size (max 50 MiB) and type (disallows
 * executables) before uploading.  Returns a URL that can be
 * embedded in a message as an attachment.  The caller is responsible
 * for deciding how to present the file in the UI.
 */
export async function uploadFile(file: File): Promise<{ url: string; fileName: string }> {
  const MAX_SIZE = 50 * 1024 * 1024; // 50 MiB
  if (file.size > MAX_SIZE) {
    throw new Error('File is too large');
  }
  const disallowed = ['application/x-msdownload', 'application/x-msdos-program'];
  if (disallowed.includes(file.type)) {
    throw new Error('File type not allowed');
  }
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return extractData(response);
}

/**
 * Retrieve the sentiment analysis for a specific message.  The
 * response includes the overall sentiment (`positive`, `neutral` or
 * `negative`), a numeric score and the original content.
 */
export async function getMessageSentiment(id: string): Promise<{ sentiment: string; score: number; message: string; author: string }> {
  const response = await api.get(`/chat/messages/${id}/sentiment`);
  return extractData(response);
}

/**
 * Retrieve aggregate sentiment analysis for an entire channel.  This
 * endpoint analyzes recent messages and returns an overall sentiment
 * classification along with basic statistics such as the average
 * sentiment score and distribution counts.
 */
export async function getConversationSentiment(channelId: string): Promise<{
  overallSentiment: string;
  averageScore: number;
  messageCount: number;
  distribution: { positive: number; neutral: number; negative: number };
}> {
  const response = await api.get(`/chat/channels/${channelId}/sentiment`);
  return extractData(response);
}

/**
 * Generate AI‑powered reply suggestions for a given message.  The
 * backend returns up to three professional, contextually appropriate
 * suggestions in Portuguese.  The returned array may have fewer
 * entries if the AI fails to generate all of them.
 */
export async function suggestReplies(messageId: string): Promise<string[]> {
  const response = await api.post(`/chat/messages/${messageId}/suggest-reply`);
  const data = extractData<{ suggestions: string[] }>(response);
  return data.suggestions;
}

/**
 * Generate a concise summary of a channel conversation.  The caller
 * may optionally limit the number of recent messages considered via
 * the `limit` query parameter.  The response includes the summary,
 * total message count and participants.
 */
export async function getConversationSummary(channelId: string, limit = 100): Promise<{
  summary: string;
  messageCount: number;
  participants: string[];
}> {
  const response = await api.get(`/chat/channels/${channelId}/summary`, { params: { limit } });
  return extractData(response);
}

/**
 * Search messages across channels.  Supports filtering by channel,
 * sender and timestamp range.  Use this function to build advanced
 * search interfaces.
 */
export async function searchMessages(params: {
  query?: string;
  channelId?: string;
  senderId?: string;
  before?: string;
  after?: string;
  limit?: number;
} = {}): Promise<ChatMessage[]> {
  const response = await api.get('/chat/messages/search', { params });
  return extractData(response);
}

/**
 * Schedule a message to be sent at a future time.  The payload
 * mirrors the backend schema defined in `scheduledMessageSchema`.
 * Recurring schedules may be specified via the `recurring` field.
 */
export async function scheduleMessage(data: {
  channelId: string;
  content: string;
  scheduledFor: string;
  recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; interval: number; endDate?: string };
}): Promise<ScheduledMessage> {
  const response = await api.post('/chat/messages/scheduled', data);
  return extractData(response);
}

/**
 * List scheduled messages.  You may filter by status (`pending`,
 * `sent`, `cancelled`) or channel.  The returned array contains
 * scheduled messages sorted by the scheduled date.
 */
export async function listScheduledMessages(params: { status?: string; channelId?: string } = {}): Promise<ScheduledMessage[]> {
  const response = await api.get('/chat/messages/scheduled', { params });
  return extractData(response);
}

/**
 * Cancel a scheduled message.  The backend marks the message as
 * `cancelled` and it will no longer be sent.
 */
export async function cancelScheduledMessage(id: string): Promise<void> {
  await api.delete(`/chat/messages/scheduled/${id}`);
}

/**
 * Register a new slash command.  Slash commands are small bots that
 * respond to custom triggers (e.g., `/giphy cats`).  Only users with
 * appropriate permissions may register commands.  The handler may be
 * the name of a predefined command or an arbitrary webhook URL.
 */
export async function registerSlashCommand(data: {
  command: string;
  description: string;
  handler: string;
  permissions?: string[];
}): Promise<SlashCommand> {
  const response = await api.post('/chat/slash-commands', data);
  return extractData(response);
}

/**
 * List all registered slash commands.
 */
export async function listSlashCommands(): Promise<SlashCommand[]> {
  const response = await api.get('/chat/slash-commands');
  return extractData(response);
}

/**
 * Execute a slash command.  The backend will run the associated
 * handler and return the resulting bot message.  Arguments should be
 * passed as an array of strings.  Only commands that have been
 * registered are executable.
 */
export async function executeSlashCommand(command: string, channelId: string, args: string[]): Promise<ChatMessage> {
  const response = await api.post(`/chat/slash-commands/${command}/execute`, { channelId, args });
  return extractData(response);
}

/**
 * Retrieve message analytics for a channel.  The backend returns
 * high‑level statistics such as total message count, counts grouped
 * by sender and by type.  A date range may be specified to limit
 * aggregation.
 */
export async function getChannelAnalytics(channelId: string, params: { startDate?: string; endDate?: string } = {}): Promise<MessageAnalytics> {
  const response = await api.get(`/chat/channels/${channelId}/analytics`, { params });
  return extractData(response);
}