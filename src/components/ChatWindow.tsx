import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Chat, Message } from '@/types';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onStartCall: () => void;
  onShowProfile: () => void;
}

const ChatWindow = ({
  chat,
  messages,
  currentUserId,
  onSendMessage,
  onStartCall,
  onShowProfile,
}: ChatWindowProps) => {
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-white">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onShowProfile}
        >
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={chat.avatar} />
              <AvatarFallback>{chat.name[0]}</AvatarFallback>
            </Avatar>
            {chat.online && !chat.isGroup && (
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary border-2 border-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{chat.name}</h3>
            {chat.isGroup ? (
              <p className="text-xs text-muted-foreground">
                {chat.memberIds?.length || 0} участников
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {chat.online ? 'в сети' : 'не в сети'}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onStartCall}
            className="hover:bg-accent"
          >
            <Icon name="Phone" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-accent">
            <Icon name="Video" size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-accent">
            <Icon name="MoreVertical" size={20} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUserId;
            const showAvatar =
              !isCurrentUser &&
              (index === messages.length - 1 ||
                messages[index + 1]?.senderId !== message.senderId);

            return (
              <div
                key={message.id}
                className={`flex gap-2 animate-fade-in ${
                  isCurrentUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isCurrentUser && (
                  <Avatar className="w-8 h-8 mt-1">
                    {showAvatar ? (
                      <>
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback>{chat.name[0]}</AvatarFallback>
                      </>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </Avatar>
                )}

                <div
                  className={`max-w-md px-4 py-2 rounded-2xl ${
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <p className="text-sm break-words">{message.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span
                      className={`text-xs ${
                        isCurrentUser
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {isCurrentUser && (
                      <Icon
                        name={message.read ? 'CheckCheck' : 'Check'}
                        size={14}
                        className={
                          message.read
                            ? 'text-primary-foreground'
                            : 'text-primary-foreground/70'
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-white">
        <div className="flex gap-2 items-end">
          <Button variant="ghost" size="icon" className="hover:bg-accent">
            <Icon name="Paperclip" size={20} />
          </Button>
          <div className="flex-1 relative">
            <Input
              placeholder="Введите сообщение..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-10 resize-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-accent"
            >
              <Icon name="Smile" size={20} />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="bg-primary hover:bg-primary/90"
            size="icon"
          >
            <Icon name="Send" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
