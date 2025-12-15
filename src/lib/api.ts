const AUTH_API = 'https://functions.poehali.dev/391d9d85-8922-4f92-8bb0-d87275577c16';
const MESSAGES_API = 'https://functions.poehali.dev/f536e054-a014-45e0-a28f-ad322dca5c51';

export interface User {
  id: number;
  username: string;
  name: string;
  avatar: string;
  banner?: string;
  bio?: string;
  online?: boolean;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  text: string;
  read: boolean;
  created_at: string;
  username?: string;
  name?: string;
  avatar?: string;
}

export interface Chat {
  id: number;
  name: string;
  avatar: string;
  is_group: boolean;
  last_message?: string;
  last_message_time?: string;
  pinned: boolean;
  unread_count: number;
  online?: boolean;
  other_user_id?: number;
  member_count?: number;
}

export const register = async (username: string, name: string, password: string) => {
  const response = await fetch(AUTH_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', username, name, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  return response.json();
};

export const login = async (username: string, password: string) => {
  const response = await fetch(AUTH_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return response.json();
};

export const searchUsers = async (search: string) => {
  const response = await fetch(`${AUTH_API}?search=${encodeURIComponent(search)}`);
  
  if (!response.ok) {
    throw new Error('Failed to search users');
  }
  
  const data = await response.json();
  return data.users as User[];
};

export const updateProfile = async (userId: number, token: string, updates: Partial<User>) => {
  const response = await fetch(AUTH_API, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Token': token,
    },
    body: JSON.stringify({ user_id: userId, ...updates }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Update failed');
  }
  
  return response.json();
};

export const getChats = async (userId: number) => {
  const response = await fetch(`${MESSAGES_API}?user_id=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get chats');
  }
  
  const data = await response.json();
  return data.chats as Chat[];
};

export const getMessages = async (chatId: number) => {
  const response = await fetch(`${MESSAGES_API}?chat_id=${chatId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get messages');
  }
  
  const data = await response.json();
  return data.messages as Message[];
};

export const sendMessage = async (chatId: number, senderId: number, text: string) => {
  const response = await fetch(MESSAGES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'send', chat_id: chatId, sender_id: senderId, text }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }
  
  const data = await response.json();
  return data.message as Message;
};

export const createChat = async (userIds: number[], name?: string, isGroup: boolean = false) => {
  const response = await fetch(MESSAGES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_chat', user_ids: userIds, name, is_group: isGroup }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create chat');
  }
  
  const data = await response.json();
  return data.chat_id as number;
};

export const markMessagesAsRead = async (chatId: number, userId: number) => {
  const response = await fetch(MESSAGES_API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark_read', chat_id: chatId, user_id: userId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to mark messages as read');
  }
  
  return response.json();
};

export const pinChat = async (chatId: number, userId: number, pinned: boolean) => {
  const response = await fetch(MESSAGES_API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pin_chat', chat_id: chatId, user_id: userId, pinned }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to pin chat');
  }
  
  return response.json();
};
