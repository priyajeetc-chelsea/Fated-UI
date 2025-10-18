export interface ChatMessage {
  id: number;
  content: string;
  isSent: boolean;
  status: 'sending' | 'delivered' | 'read' | 'failed';
  isRead: boolean;
  readAt: string;
  timestamp: Date;
  senderId: number;
  receiverId: number;
}

export interface ChatHistoryResponse {
  code: number;
  msg: string;
  model: {
    messageContents: {
      id: number;
      content: string;
      isSent: boolean;
      status: string;
      isRead: boolean;
      readAt: string;
    }[] | null; // messageContents can be null when no chat history exists
  };
}

export interface ReadMessageRequest {
  senderId: number; // The ID of the person whose messages are being read (the chat partner)
  lastReadMessageId: number; // The ID of the last message read in the conversation
}

export interface MatchesResponse {
  code: number;
  msg: string;
  model: {
    matches: {
      userId: number;
      firstName: string;
      lastMessage?: {
        content: string;
        timestamp: string;
      };
      unreadCount: number;
      isUnread: boolean;
    }[];
  };
}

class ChatApiService {
  private readonly API_BASE_URL = 'https://vzr1rz8idc.execute-api.ap-south-1.amazonaws.com/staging';

  /**
   * Fetch chat history with pagination support
   * API: GET {{baseURL}}/staging/messages/history
   * @param otherUserId - The ID of the person with whom the user is chatting
   * @param limit - The number of messages to fetch (e.g., 10)
   * @param lastMessageId - Used for pagination. Use empty string for initial request, then oldest message ID
   */
  async getChatHistory(
    otherUserId: number, 
    limit: number = 10, 
    lastMessageId: string = ""
  ): Promise<ChatHistoryResponse> {
    try {
      const params = new URLSearchParams({
        otherUserId: otherUserId.toString(),
        limit: limit.toString(),
        lastMessageId: lastMessageId,
      });

      const response = await fetch(`${this.API_BASE_URL}/messages/history?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📜 Chat history fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch chat history:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * API: POST {{baseURL}}/staging/messages/read
   * Called when the user opens chat and sees delivered messages from the other party
   * @param senderId - The ID of the person whose messages are being read (the chat partner)
   * @param lastReadMessageId - The ID of the last message read in the conversation
   */
  async markMessagesAsRead(senderId: number, lastReadMessageId: number): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/messages/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId,
          lastReadMessageId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Messages marked as read for senderId:', senderId, 'lastReadMessageId:', lastReadMessageId);
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
      throw error;
    }
  }

  /**
   * Get all matches with unread message counts
   * API: GET {{baseURL}}/staging/matches/all
   * Used in Matches/Potential Matches tab to display last message and unread count
   */
  async getAllMatches(): Promise<MatchesResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/matches/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 All matches with unread counts fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch matches:', error);
      throw error;
    }
  }
}

export const chatApiService = new ChatApiService();