import { ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Calendar, 
  CheckSquare, 
  FolderKanban, 
  Settings, 
  User,
  LogOut,
  Clock,
  Menu,
  ChevronLeft
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    label: 'カレンダー',
    path: '/',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'タスク管理',
    path: '/tasks',
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    label: '勤怠管理',
    path: '/attendance',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    label: 'プロジェクト',
    path: '/projects',
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    label: '管理者ダッシュボード',
    path: '/admin',
    icon: <Settings className="h-5 w-5" />,
    adminOnly: true,
  },
];

type LayoutProps = {
  children: ReactNode;
  isAdmin?: boolean;
};

export function Layout({ children, isAdmin = false }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked');
  };

  const filteredNavItems = navItems.filter(item => !item.adminOnly || (item.adminOnly && isAdmin));

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
      {/* Sidebar */}
      <div className={`fixed md:relative z-20 h-full transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:w-64' : 'md:w-20'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} border-r border-blue-100 bg-white/80 backdrop-blur-sm`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 py-4 px-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                W
              </div>
              {sidebarOpen && <span className="text-xl font-bold">Wado Scheduler</span>}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex" 
              onClick={toggleSidebar}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          <nav className="flex-1 space-y-1">
            {filteredNavItems.map((item) => (
              <Button
                key={item.path}
                variant={location === item.path ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  location === item.path ? "bg-blue-50/80" : ""
                } ${!sidebarOpen ? 'px-2 justify-center' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                {sidebarOpen && item.label}
              </Button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-blue-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`w-full ${sidebarOpen ? 'justify-start gap-3' : 'justify-center'}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
                    <AvatarFallback>WT</AvatarFallback>
                  </Avatar>
                  {sidebarOpen && (
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">ユーザー名</span>
                      <span className="text-xs text-muted-foreground">user@example.com</span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>アカウント</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log('Profile')}>
                  <User className="h-4 w-4 mr-2" />
                  <span>プロフィール</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${!sidebarOpen ? 'md:ml-0' : ''}`}>
        {/* Header with toggle button */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              W
            </div>
            <span className="md:hidden text-xl font-bold">Wado</span>
          </div>
          
          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {filteredNavItems.map((item) => (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ${!sidebarOpen ? 'md:px-12' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
} 