import { useState } from 'react';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import ProfilePanel from '@/components/ProfilePanel';
import CallModal from '@/components/CallModal';
import { Chat, Message, User } from '@/types';

const Index = () => {
  const [currentUser] = useState<User>({
    id: '1',
    name: 'Вы',
    username: '@you',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
    bio: 'Люблю общаться!',
  });

  const [users] = useState<User[]>([
    {
      id: '2',
      name: 'Анна Иванова',
      username: '@anna',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna',
      bio: 'Дизайнер',
      online: true,
    },
    {
      id: '3',
      name: 'Максим Петров',
      username: '@maxim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maxim',
      bio: 'Разработчик',
      online: false,
    },
    {
      id: '4',
      name: 'Елена Смирнова',
      username: '@elena',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
      bio: 'Маркетолог',
      online: true,
    },
  ]);

  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      userId: '2',
      name: 'Анна Иванова',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna',
      lastMessage: 'Привет! Как дела?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      unread: 2,
      pinned: true,
      online: true,
    },
    {
      id: '2',
      userId: '3',
      name: 'Максим Петров',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maxim',
      lastMessage: 'Отлично, спасибо!',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      unread: 0,
      pinned: false,
      online: false,
    },
    {
      id: '3',
      userId: '4',
      name: 'Елена Смирнова',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
      lastMessage: 'До встречи!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      unread: 0,
      pinned: false,
      online: true,
    },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      {
        id: '1',
        text: 'Привет! Как дела?',
        senderId: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        read: true,
      },
      {
        id: '2',
        text: 'Отлично! А у тебя?',
        senderId: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
        read: true,
      },
      {
        id: '3',
        text: 'Тоже хорошо, работаю над новым проектом',
        senderId: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        read: false,
      },
    ],
    '2': [
      {
        id: '4',
        text: 'Привет! Что нового?',
        senderId: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        read: true,
      },
      {
        id: '5',
        text: 'Отлично, спасибо!',
        senderId: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: true,
      },
    ],
    '3': [
      {
        id: '6',
        text: 'Увидимся завтра!',
        senderId: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        read: true,
      },
      {
        id: '7',
        text: 'До встречи!',
        senderId: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        read: true,
      },
    ],
  });

  const [selectedChatId, setSelectedChatId] = useState<string | null>('1');
  const [showProfile, setShowProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callUser, setCallUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);
  const chatMessages = selectedChatId ? messages[selectedChatId] || [] : [];

  const handleSendMessage = (text: string) => {
    if (!selectedChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      senderId: currentUser.id,
      timestamp: new Date(),
      read: false,
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
  };

  const handlePinChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
      )
    );
  };

  const handleClearChat = (chatId: string) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: [],
    }));
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
  };

  const handleStartCall = () => {
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

  const handleShowProfile = (userId: string) => {
    setProfileUserId(userId);
    setShowProfile(true);
  };

  const handleUpdateProfile = (updates: Partial<User>) => {
    console.log('Profile updated:', updates);
  };

  const handleCreateGroup = (name: string, memberIds: string[]) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      userId: 'group',
      name: name,
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=' + name,
      lastMessage: 'Группа создана',
      timestamp: new Date(),
      unread: 0,
      pinned: false,
      online: false,
      isGroup: true,
      memberIds: memberIds,
    };

    setChats((prev) => [newChat, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [newChat.id]: [],
    }));
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const profileUser =
    profileUserId === currentUser.id
      ? currentUser
      : users.find((u) => u.id === profileUserId);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatList
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onPinChat={handlePinChat}
        onClearChat={handleClearChat}
        onDeleteChat={handleDeleteChat}
        onShowProfile={() => handleShowProfile(currentUser.id)}
        onCreateGroup={handleCreateGroup}
        users={filteredUsers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
      />

      {selectedChat ? (
        <ChatWindow
          chat={selectedChat}
          messages={chatMessages}
          currentUserId={currentUser.id}
          onSendMessage={handleSendMessage}
          onStartCall={handleStartCall}
          onShowProfile={() => handleShowProfile(selectedChat.userId)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-xl">Выберите чат для начала общения</p>
          </div>
        </div>
      )}

      {showProfile && profileUser && (
        <ProfilePanel
          user={profileUser}
          isCurrentUser={profileUser.id === currentUser.id}
          onClose={() => setShowProfile(false)}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {isCallActive && callUser && (
        <CallModal user={callUser} onEndCall={handleEndCall} />
      )}
    </div>
  );
};

export default Index;
