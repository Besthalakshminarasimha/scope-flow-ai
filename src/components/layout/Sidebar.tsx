import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  Upload,
  History,
  Settings,
  FileImage,
  Eye,
  Scan,
  Type,
  Layers,
  Activity,
  ChevronRight,
  Home,
  Info
} from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Upload", url: "/upload", icon: Upload },
  { title: "History", url: "/history", icon: History },
];

const modelItems = [
  { title: "Object Detection", icon: Eye, count: 12 },
  { title: "Image Classification", icon: FileImage, count: 8 },
  { title: "Face Recognition", icon: Scan, count: 5 },
  { title: "OCR (Text)", icon: Type, count: 15 },
  { title: "Image Segmentation", icon: Layers, count: 7 },
];

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "About", url: "/about", icon: Info },
];

export function Sidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState("Object Detection");

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarRoot
      className={`${collapsed ? "w-20" : "w-64"} bg-background-secondary border-r border-border transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground-muted text-xs uppercase tracking-wider mb-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className={`w-full justify-start p-3 rounded-lg transition-all duration-200 ${
                      isActive(item.url)
                        ? "bg-gradient-primary text-primary-foreground shadow-primary"
                        : "hover:bg-background-tertiary"
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Models Section */}
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-foreground-muted text-xs uppercase tracking-wider mb-4 flex items-center">
            <Brain className="w-4 h-4 mr-2" />
            {!collapsed && "AI Models"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-64">
              <SidebarMenu className="space-y-1">
                {modelItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => setSelectedModel(item.title)}
                      className={`w-full justify-between p-3 rounded-lg transition-all duration-200 ${
                        selectedModel === item.title
                          ? "bg-gradient-secondary text-secondary-foreground shadow-secondary"
                          : "hover:bg-background-tertiary"
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-4 h-4 mr-3" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </div>
                      {!collapsed && (
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.count}
                          </Badge>
                          <ChevronRight className="w-3 h-3 opacity-50" />
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Activity */}
        {!collapsed && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-foreground-muted text-xs uppercase tracking-wider mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Recent Activity
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-background-tertiary cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-upload rounded-md flex items-center justify-center">
                      <FileImage className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">image_{i}.jpg</p>
                      <p className="text-xs text-foreground-muted">2 min ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className={`w-full justify-start p-3 rounded-lg transition-all duration-200 ${
                      isActive(item.url)
                        ? "bg-gradient-primary text-primary-foreground"
                        : "hover:bg-background-tertiary"
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Toggle */}
      <div className="absolute top-4 -right-3">
        <SidebarTrigger className="w-6 h-6 bg-background-secondary border border-border rounded-full shadow-md hover:bg-background-tertiary transition-colors" />
      </div>
    </SidebarRoot>
  );
}