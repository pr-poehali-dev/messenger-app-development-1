import { useState, useEffect } from 'react';
import AuthScreen from '@/components/AuthScreen';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import ProfilePanel from '@/components/ProfilePanel';
import CallModal from '@/components/CallModal';
import { toast } from 'sonner';
import * as api from '@/lib/api';

interface LocalUser {
  id: number;
  name: string;
  username: string;
  avatar: string;
  banner?: string;
  bio?: string;
  online?: boolean;
}

interface LocalMessage {
  id: string;
  text: string;
  senderId: number;
  timestamp: Date;
  read: boolean;
}

interface LocalChat {
  id: number;
  userId: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  pinned: boolean;
  online: boolean;
  isGroup?: boolean;
  memberIds?: number[];
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [users, setUsers] = useState<LocalUser[]>([]);
  const [chats, setChats] = useState<LocalChat[]>([]);
  const [messages, setMessages] = useState<Record<number, LocalMessage[]>>({});
  
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callUser, setCallUser] = useState<LocalUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('sim_token');
    const savedUser = localStorage.getItem('sim_user');

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setToken(savedToken);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('sim_token');
        localStorage.removeItem('sim_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadChats();
      const interval = setInterval(loadChats, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser]);

  const loadChats = async () => {
    if (!currentUser) return;
    
    try {
      const chatsData = await api.getChats(currentUser.id);
      const formattedChats: LocalChat[] = chatsData.map((chat) => ({
        id: chat.id,
        userId: chat.other_user_id || 0,
        name: chat.name,
        avatar: chat.avatar,
        lastMessage: chat.last_message || '',
        timestamp: chat.last_message_time ? new Date(chat.last_message_time) : new Date(),
        unread: chat.unread_count,
        pinned: chat.pinned,
        online: chat.online || false,
        isGroup: chat.is_group,
        memberIds: [],
      }));
      setChats(formattedChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const messagesData = await api.getMessages(chatId);
      const formattedMessages: LocalMessage[] = messagesData.map((msg) => ({
        id: msg.id.toString(),
        text: msg.text,
        senderId: msg.sender_id,
        timestamp: new Date(msg.created_at),
        read: msg.read,
      }));
      setMessages((prev) => ({ ...prev, [chatId]: formattedMessages }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleLogin = (user: api.User, authToken: string) => {
    const localUser: LocalUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      online: user.online,
    };

    setCurrentUser(localUser);
    setToken(authToken);
    setIsAuthenticated(true);

    localStorage.setItem('sim_token', authToken);
    localStorage.setItem('sim_user', JSON.stringify(localUser));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToken(null);
    setChats([]);
    setMessages({});
    localStorage.removeItem('sim_token');
    localStorage.removeItem('sim_user');
    toast.success('Вы вышли из аккаунта');
  };

  const handleSelectChat = async (chatId: number) => {
    setSelectedChatId(chatId);
    if (!messages[chatId]) {
      await loadMessages(chatId);
    }
    if (currentUser) {
      await api.markMessagesAsRead(chatId, currentUser.id);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChatId || !currentUser) return;

    try {
      const message = await api.sendMessage(selectedChatId, currentUser.id, text);
      
      const newMessage: LocalMessage = {
        id: message.id.toString(),
        text: message.text,
        senderId: message.sender_id,
        timestamp: new Date(message.created_at),
        read: message.read,
      };

      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: [...(prev[selectedChatId] || []), newMessage],
      }));

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? { ...chat, lastMessage: text, timestamp: new Date() }
            : chat
        )
      );
    } catch (error) {
      toast.error('Не удалось отправить сообщение');
    }
  };

  const handlePinChat = async (chatId: number) => {
    if (!currentUser) return;

    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const newPinned = !chat.pinned;

    try {
      await api.pinChat(chatId, currentUser.id, newPinned);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, pinned: newPinned } : c))
      );
    } catch (error) {
      toast.error('Не удалось закрепить чат');
    }
  };

  const handleClearChat = (chatId: number) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: [],
    }));
    toast.success('Чат очищен');
  };

  const handleDeleteChat = (chatId: number) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
    toast.success('Чат удалён');
  };

  const handleStartCall = () => {
    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (selectedChat) {
      const user = users.find((u) => u.id === selectedChat.userId);
      if (user) {
        setCallUser(user);
        setIsCallActive(true);
      }
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallUser(null);
  };

  const handleShowProfile = (userId: number) => {
    setProfileUserId(userId);
    setShowProfile(true);
  };

  const handleUpdateProfile = async (updates: Partial<LocalUser>) => {
    if (!currentUser || !token) return;

    try {
      const response = await api.updateProfile(currentUser.id, token, updates);
      const updatedUser = { ...currentUser, ...response.user };
      setCurrentUser(updatedUser);
      localStorage.setItem('sim_user', JSON.stringify(updatedUser));
      toast.success('Профиль обновлён');
    } catch (error) {
      toast.error('Не удалось обновить профиль');
    }
  };

  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    if (!currentUser) return;

    try {
      const userIdsWithCurrent = [currentUser.id, ...memberIds];
      const chatId = await api.createChat(userIdsWithCurrent, name, true);
      
      await loadChats();
      toast.success('Группа создана');
    } catch (error) {
      toast.error('Не удалось создать группу');
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const foundUsers = await api.searchUsers(query);
        setUsers(foundUsers.map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          online: u.online,
        })));
      } catch (error) {
        console.error('Failed to search users:', error);
      }
    } else {
      setUsers([]);
    }
  };

  const handleUserClick = async (userId: number) => {
    if (!currentUser) return;

    try {
      const chatId = await api.createChat([currentUser.id, userId]);
      await loadChats();
      setSearchQuery('');
      setUsers([]);
      
      setTimeout(() => {
        handleSelectChat(chatId);
      }, 500);
    } catch (error) {
      toast.error('Не удалось создать чат');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-xl text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);
  const chatMessages = selectedChatId ? messages[selectedChatId] || [] : [];

  const profileUser =
    profileUserId === currentUser?.id
      ? currentUser
      : users.find((u) => u.id === profileUserId);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatList
        chats={chats.map(c => ({
          id: c.id.toString(),
          userId: c.userId.toString(),
          name: c.name,
          avatar: c.avatar,
          lastMessage: c.lastMessage,
          timestamp: c.timestamp,
          unread: c.unread,
          pinned: c.pinned,
          online: c.online,
          isGroup: c.isGroup,
        }))}
        selectedChatId={selectedChatId?.toString() || null}
        onSelectChat={(id) => handleSelectChat(parseInt(id))}
        onPinChat={(id) => handlePinChat(parseInt(id))}
        onClearChat={(id) => handleClearChat(parseInt(id))}
        onDeleteChat={(id) => handleDeleteChat(parseInt(id))}
        onShowProfile={() => currentUser && handleShowProfile(currentUser.id)}
        onCreateGroup={(name, memberIds) => handleCreateGroup(name, memberIds.map(id => parseInt(id)))}
        users={users.map(u => ({
          id: u.id.toString(),
          name: u.name,
          username: u.username,
          avatar: u.avatar,
          bio: u.bio,
          online: u.online,
        }))}
        searchQuery={searchQuery}
        onSearchChange={handleSearchUsers}
        onUserClick={(userId) => handleUserClick(parseInt(userId))}
        currentUser={currentUser ? {
          id: currentUser.id.toString(),
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
          bio: currentUser.bio,
        } : { id: '0', name: '', username: '', avatar: '' }}
      />

      {selectedChat ? (
        <ChatWindow
          chat={{
            id: selectedChat.id.toString(),
            userId: selectedChat.userId.toString(),
            name: selectedChat.name,
            avatar: selectedChat.avatar,
            lastMessage: selectedChat.lastMessage,
            timestamp: selectedChat.timestamp,
            unread: selectedChat.unread,
            pinned: selectedChat.pinned,
            online: selectedChat.online,
            isGroup: selectedChat.isGroup,
          }}
          messages={chatMessages.map(m => ({
            id: m.id,
            text: m.text,
            senderId: m.senderId.toString(),
            timestamp: m.timestamp,
            read: m.read,
          }))}
          currentUserId={currentUser?.id.toString() || '0'}
          onSendMessage={handleSendMessage}
          onStartCall={handleStartCall}
          onShowProfile={() => handleShowProfile(selectedChat.userId)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-xl">Выберите чат для начала общения</p>
            <button
              onClick={handleLogout}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>
      )}

      {showProfile && profileUser && (
        <ProfilePanel
          user={{
            id: profileUser.id.toString(),
            name: profileUser.name,
            username: profileUser.username,
            avatar: profileUser.avatar,
            banner: profileUser.banner,
            bio: profileUser.bio,
            online: profileUser.online,
          }}
          isCurrentUser={profileUser.id === currentUser?.id}
          onClose={() => setShowProfile(false)}
          onUpdateProfile={(updates) => handleUpdateProfile(updates)}
        />
      )}

      {isCallActive && callUser && (
        <CallModal
          user={{
            id: callUser.id.toString(),
            name: callUser.name,
            username: callUser.username,
            avatar: callUser.avatar,
            online: callUser.online,
          }}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
};

export default Index;