import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { SidebarProvider } from "@/components/ui/sidebar";

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/welcome'].includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background">
        <CustomCursor />
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cursor-custom">
      <CustomCursor />
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;