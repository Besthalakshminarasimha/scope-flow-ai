import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Sliders,
  Download,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Settings = () => {
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "",
  });

  const [preferences, setPreferences] = useState({
    defaultModel: "object-detection",
    confidenceThreshold: [0.7],
    language: "en",
    theme: "dark",
    autoProcess: true,
    saveHistory: true,
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    analysis: true,
    updates: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: 60,
    dataEncryption: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-foreground-muted mt-2">
            Manage your account, preferences, and security settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" className="btn-glass" size="sm">
                  Change Photo
                </Button>
                <p className="text-xs text-foreground-muted">
                  JPG, PNG up to 2MB
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="bg-background-tertiary border-input-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="bg-background-tertiary border-input-border"
                />
              </div>

              <Button className="w-full btn-primary">
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Model */}
            <div className="space-y-2">
              <Label>Default AI Model</Label>
              <Select value={preferences.defaultModel} onValueChange={(value) => 
                setPreferences({ ...preferences, defaultModel: value })
              }>
                <SelectTrigger className="bg-background-tertiary border-input-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="object-detection">Object Detection</SelectItem>
                  <SelectItem value="classification">Image Classification</SelectItem>
                  <SelectItem value="face-recognition">Face Recognition</SelectItem>
                  <SelectItem value="ocr">OCR (Text)</SelectItem>
                  <SelectItem value="segmentation">Image Segmentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-3">
              <Label>Default Confidence Threshold</Label>
              <div className="px-2">
                <Slider
                  value={preferences.confidenceThreshold}
                  onValueChange={(value) => 
                    setPreferences({ ...preferences, confidenceThreshold: value })
                  }
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-foreground-muted mt-1">
                  <span>0.1</span>
                  <span className="font-medium">{preferences.confidenceThreshold[0]}</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={preferences.language} onValueChange={(value) => 
                setPreferences({ ...preferences, language: value })
              }>
                <SelectTrigger className="bg-background-tertiary border-input-border">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-process">Auto-process uploads</Label>
                  <p className="text-xs text-foreground-muted">
                    Automatically start analysis when image is uploaded
                  </p>
                </div>
                <Switch
                  id="auto-process"
                  checked={preferences.autoProcess}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, autoProcess: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="save-history">Save analysis history</Label>
                  <p className="text-xs text-foreground-muted">
                    Keep record of all analyses for future reference
                  </p>
                </div>
                <Switch
                  id="save-history"
                  checked={preferences.saveHistory}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, saveHistory: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notif">Email notifications</Label>
                  <p className="text-xs text-foreground-muted">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  id="email-notif"
                  checked={notifications.email}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notif">Push notifications</Label>
                  <p className="text-xs text-foreground-muted">
                    Browser push notifications
                  </p>
                </div>
                <Switch
                  id="push-notif"
                  checked={notifications.push}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analysis-notif">Analysis complete</Label>
                  <p className="text-xs text-foreground-muted">
                    Notify when analysis finishes
                  </p>
                </div>
                <Switch
                  id="analysis-notif"
                  checked={notifications.analysis}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, analysis: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-factor authentication</Label>
                  <p className="text-xs text-foreground-muted">
                    Add extra security to your account
                  </p>
                </div>
                <Switch
                  id="two-factor"
                  checked={security.twoFactor}
                  onCheckedChange={(checked) => 
                    setSecurity({ ...security, twoFactor: checked })
                  }
                />
              </div>

              <Button variant="outline" className="w-full btn-glass">
                Change Password
              </Button>

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full btn-glass">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={preferences.theme} onValueChange={(value) => 
                  setPreferences({ ...preferences, theme: value })
                }>
                  <SelectTrigger className="bg-background-tertiary border-input-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reduced-motion">Reduce animations</Label>
                  <p className="text-xs text-foreground-muted">
                    Disable motion effects
                  </p>
                </div>
                <Switch id="reduced-motion" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;