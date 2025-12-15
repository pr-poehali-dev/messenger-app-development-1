import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface ProfilePanelProps {
  user: User;
  isCurrentUser: boolean;
  onClose: () => void;
  onUpdateProfile: (updates: Partial<User>) => void;
}

const ProfilePanel = ({
  user,
  isCurrentUser,
  onClose,
  onUpdateProfile,
}: ProfilePanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [banner, setBanner] = useState(user.banner || '');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateProfile({
      name,
      username,
      bio,
      avatar,
      banner,
    });
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-96 border-l border-border bg-white flex flex-col animate-slide-in-right">
      <div className="h-16 border-b border-border px-6 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Профиль</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-accent"
        >
          <Icon name="X" size={20} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="relative">
          <div
            className="h-32 bg-gradient-to-br from-primary to-primary/60 relative cursor-pointer group"
            style={
              banner
                ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover' }
                : {}
            }
          >
            {isCurrentUser && isEditing && (
              <>
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Icon name="Camera" size={16} className="mr-2" />
                  Сменить баннер
                </Button>
              </>
            )}
          </div>

          <div className="px-6 -mt-12 relative">
            <div className="relative inline-block group">
              <Avatar className="w-24 h-24 border-4 border-white">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-2xl">{name[0]}</AvatarFallback>
              </Avatar>
              {user.online && (
                <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-primary border-4 border-white" />
              )}
              {isCurrentUser && isEditing && (
                <>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Icon name="Camera" size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isCurrentUser && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Icon name="Edit" size={16} className="mr-2" />
              Редактировать профиль
            </Button>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите имя"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Юзернейм</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">О себе</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1 bg-primary">
                  Сохранить
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{name}</h2>
                <p className="text-sm text-muted-foreground">{username}</p>
              </div>

              {bio && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    О себе
                  </h3>
                  <p className="text-sm text-muted-foreground">{bio}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Icon name="Mail" size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Электронная почта</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Icon name="Phone" size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Номер телефона</span>
                </div>
                {!isCurrentUser && (
                  <div className="flex items-center gap-3 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.online ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                    />
                    <span className="text-muted-foreground">
                      {user.online ? 'В сети' : 'Не в сети'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProfilePanel;
