import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface CallModalProps {
  user: User;
  onEndCall: () => void;
}

const CallModal = ({ user, onEndCall }: CallModalProps) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected'>(
    'connecting'
  );

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md p-8 space-y-8">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <Avatar className="w-32 h-32 border-4 border-primary/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-4xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                {callStatus === 'connecting' ? 'Соединение...' : formatDuration(callDuration)}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {user.name}
            </h2>
            <p className="text-muted-foreground">
              {callStatus === 'connecting'
                ? 'Устанавливаем соединение...'
                : 'Идёт аудиозвонок'}
            </p>
          </div>

          {callStatus === 'connected' && (
            <div className="flex justify-center gap-4 py-4 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-75" />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150" />
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Button
            variant={isMuted ? 'default' : 'outline'}
            size="lg"
            className="w-16 h-16 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            <Icon name={isMuted ? 'MicOff' : 'Mic'} size={24} />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full"
          >
            <Icon name="Volume2" size={24} />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90"
            onClick={onEndCall}
          >
            <Icon name="PhoneOff" size={24} />
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {isMuted
            ? 'Микрофон выключен. Собеседник вас не слышит.'
            : 'Микрофон включен'}
        </p>
      </div>
    </div>
  );
};

export default CallModal;
