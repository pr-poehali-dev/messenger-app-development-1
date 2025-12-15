import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { Chat, User } from '@/types';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onPinChat: (chatId: string) => void;
  onClearChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onShowProfile: () => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
  users: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: User;
}

const ChatList = ({
  chats,
  selectedChatId,
  onSelectChat,
  onPinChat,
  onClearChat,
  onDeleteChat,
  onShowProfile,
  onCreateGroup,
  users,
  searchQuery,
  onSearchChange,
  currentUser,
}: ChatListProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

  const sortedChats = [...chats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ч`;
    }

    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      onCreateGroup(groupName, selectedMembers);
      setGroupName('');
      setSelectedMembers([]);
      setIsGroupDialogOpen(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="w-80 border-r border-border flex flex-col bg-white">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Чаты</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="hover:bg-accent"
            >
              <Icon name="Search" size={20} />
            </Button>
            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent">
                  <Icon name="Users" size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать группу</DialogTitle>
                  <DialogDescription>
                    Выберите участников для новой группы
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Название группы"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                          onClick={() => toggleMember(user.id)}
                        >
                          <Checkbox
                            checked={selectedMembers.includes(user.id)}
                            onCheckedChange={() => toggleMember(user.id)}
                          />
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.username}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button
                    onClick={handleCreateGroup}
                    className="w-full"
                    disabled={!groupName.trim() || selectedMembers.length === 0}
                  >
                    Создать группу
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowProfile}
              className="hover:bg-accent"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="animate-fade-in">
            <Input
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="mb-2"
            />
            {searchQuery && (
              <ScrollArea className="max-h-48 mt-2">
                <div className="space-y-1">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                      onClick={() => {
                        const existingChat = chats.find(
                          (c) => c.userId === user.id
                        );
                        if (existingChat) {
                          onSelectChat(existingChat.id);
                        }
                        onSearchChange('');
                      }}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.username}
                        </p>
                      </div>
                      {user.online && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedChats.map((chat) => (
            <div key={chat.id} className="relative group">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-accent ${
                  selectedChatId === chat.id ? 'bg-accent' : ''
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  {chat.online && !chat.isGroup && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {chat.name}
                      </p>
                      {chat.pinned && (
                        <Icon name="Pin" size={14} className="text-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(chat.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </p>
                    {chat.unread > 0 && (
                      <Badge
                        variant="default"
                        className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0 text-xs"
                      >
                        {chat.unread}
                      </Badge>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icon name="MoreVertical" size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPinChat(chat.id)}>
                      <Icon
                        name={chat.pinned ? 'PinOff' : 'Pin'}
                        size={16}
                        className="mr-2"
                      />
                      {chat.pinned ? 'Открепить' : 'Закрепить'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onClearChat(chat.id)}>
                      <Icon name="Trash2" size={16} className="mr-2" />
                      Очистить чат
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteChat(chat.id)}
                      className="text-destructive"
                    >
                      <Icon name="X" size={16} className="mr-2" />
                      Удалить чат
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatList;
