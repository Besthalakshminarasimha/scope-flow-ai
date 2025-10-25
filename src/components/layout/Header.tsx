import { Search, Settings, User, Bell, Moon, Sun, LogOut, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Image Analysis Complete",
      description: "Your lane detection analysis has finished processing",
      time: "2 min ago",
      read: false,
    },
    {
      id: 2,
      title: "New Feature Available",
      description: "Speech emotion recognition is now available",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "System Update",
      description: "VisionX has been updated to version 2.0",
      time: "3 hours ago",
      read: true,
    },
  ]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "Successfully signed out of VisionX",
      });
      navigate('/welcome');
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="h-16 border-b border-border bg-background-secondary/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo and App Name */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-brand bg-clip-text text-transparent">
                VisionX
              </h1>
              <p className="text-xs text-foreground-muted">AI Computer Vision</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
            <Input
              placeholder="Search models, history, or help..."
              className="pl-10 bg-background-tertiary border-input-border focus:border-primary"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="btn-glass w-10 h-10"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="btn-glass w-10 h-10 relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-gradient-primary text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 glass p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs h-auto p-1 px-2"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-foreground-muted">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-background-tertiary/50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-background-tertiary/30' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-foreground-muted">
                              {notification.description}
                            </p>
                            <p className="text-xs text-foreground-muted/70">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="btn-glass w-10 h-10"
          >
            <Settings className="w-4 h-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="btn-glass p-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {getUserInitials(user?.user_metadata?.full_name || user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-foreground-muted text-xs">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/about')}>
                <User className="mr-2 h-4 w-4" />
                About
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}