
"use client"

import * as React from "react"
import { memo, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import {
  Bell,
  GanttChartSquare,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
  FileText,
  Megaphone,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { useAuth } from "@/hooks/use-auth"
import { NotificationBell } from "@/components/notifications/notification-bell"

const NavLinks = memo(() => {
    const { user } = useAuth();
    const pathname = usePathname()
    
    const getMenuItemClasses = useCallback((path: string, color: string) => {
      const isActive = pathname === path;
      return `h-12 px-4 rounded-lg transition-all duration-200 ${
        isActive 
          ? `bg-gradient-to-r from-${color} to-fundibots-secondary text-white shadow-lg shadow-${color}/20 border border-${color}/20` 
          : `hover:bg-${color}/10 hover:text-${color} hover:border-${color}/20 border border-transparent`
      }`;
    }, [pathname]);
    
    return (
      <SidebarMenu className="space-y-1">
        <SidebarMenuItem>
          <Link href="/dashboard">
            <SidebarMenuButton 
              asChild 
              isActive={pathname === '/dashboard'} 
              tooltip="Dashboard"
              size="lg"
              className={`h-12 px-4 rounded-lg transition-all duration-200 border ${
                pathname === '/dashboard' 
                  ? 'bg-fundibots-primary text-white shadow-lg shadow-fundibots-primary/20 border-fundibots-primary' 
                  : 'hover:bg-fundibots-primary/10 hover:text-fundibots-primary hover:border-fundibots-primary/30 border-transparent'
              }`}
            >
              <span>
                <LayoutDashboard className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden font-medium">Dashboard</span>
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        {user?.role === 'admin' && (
           <SidebarMenuItem>
             <Link href="/dashboard/projects">
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/dashboard/projects'} 
                tooltip="Projects"
                size="lg"
                className={`h-12 px-4 rounded-lg transition-all duration-200 border ${
                  pathname === '/dashboard/projects' 
                    ? 'bg-fundibots-secondary text-white shadow-lg shadow-fundibots-secondary/20 border-fundibots-secondary' 
                    : 'hover:bg-fundibots-secondary/10 hover:text-fundibots-secondary hover:border-fundibots-secondary/30 border-transparent'
                }`}
              >
                <span>
                  <GanttChartSquare className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden font-medium">Projects</span>
                </span>
              </SidebarMenuButton>
            </Link>
           </SidebarMenuItem>
        )}
         {user?.role === 'admin' && (
           <SidebarMenuItem>
             <Link href="/dashboard/assemblers">
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/dashboard/assemblers'} 
                tooltip="Assemblers"
                size="lg"
                className={`h-12 px-4 rounded-lg transition-all duration-200 border ${
                  pathname === '/dashboard/assemblers' 
                    ? 'bg-fundibots-green text-white shadow-lg shadow-fundibots-green/20 border-fundibots-green' 
                    : 'hover:bg-fundibots-green/10 hover:text-fundibots-green hover:border-fundibots-green/30 border-transparent'
                }`}
              >
                <span>
                  <Users className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden font-medium">Assemblers</span>
                </span>
              </SidebarMenuButton>
            </Link>
           </SidebarMenuItem>
        )}
        {user?.role === 'assembler' && (
            <SidebarMenuItem>
              <Link href="/dashboard/work-sessions">
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === '/dashboard/work-sessions'} 
                  tooltip="Work Sessions"
                  size="lg"
                  className={`h-12 px-4 rounded-lg transition-all duration-200 border ${
                    pathname === '/dashboard/work-sessions' 
                      ? 'bg-fundibots-cyan text-white shadow-lg shadow-fundibots-cyan/20 border-fundibots-cyan' 
                      : 'hover:bg-fundibots-cyan/10 hover:text-fundibots-cyan hover:border-fundibots-cyan/30 border-transparent'
                  }`}
                >
                  <span>
                    <Package className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden font-medium">Work Sessions</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
        )}

        {user?.role === 'admin' && (
           <SidebarMenuItem>
            <Link href="/dashboard/reports">
             <SidebarMenuButton 
               asChild 
               isActive={pathname === '/dashboard/reports'} 
               tooltip="Reports"
               size="lg"
               className={`h-12 px-4 rounded-lg transition-all duration-200 border ${
                 pathname === '/dashboard/reports' 
                   ? 'bg-fundibots-secondary text-white shadow-lg shadow-fundibots-secondary/20 border-fundibots-secondary' 
                   : 'hover:bg-fundibots-secondary/10 hover:text-fundibots-secondary hover:border-fundibots-secondary/30 border-transparent'
               }`}
             >
              <span>
                <FileText className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden font-medium">Reports</span>
              </span>
            </SidebarMenuButton>
            </Link>
           </SidebarMenuItem>
        )}
        <SidebarMenuItem>
          <Link href="/dashboard/announcements">
           <SidebarMenuButton 
             asChild 
             isActive={pathname === '/dashboard/announcements'} 
             tooltip="Announcements"
             size="lg"
             className={`h-12 px-4 rounded-lg transition-all duration-200 border ${
               pathname === '/dashboard/announcements' 
                 ? 'bg-fundibots-yellow text-gray-800 shadow-lg shadow-fundibots-yellow/20 border-fundibots-yellow' 
                 : 'hover:bg-fundibots-yellow/10 hover:text-fundibots-yellow hover:border-fundibots-yellow/30 border-transparent'
             }`}
           >
            <span>
              <Megaphone className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden font-medium">Announcements</span>
            </span>
          </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/dashboard/notifications">
           <SidebarMenuButton 
             asChild 
             isActive={pathname === '/dashboard/notifications'} 
             tooltip="Notifications"
             size="lg"
             className={`h-12 px-4 rounded-lg transition-all duration-200 border ${
               pathname === '/dashboard/notifications' 
                 ? 'bg-fundibots-primary text-white shadow-lg shadow-fundibots-primary/20 border-fundibots-primary' 
                 : 'hover:bg-fundibots-primary/10 hover:text-fundibots-primary hover:border-fundibots-primary/30 border-transparent'
             }`}
           >
            <span>
              <Bell className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden font-medium">Notifications</span>
            </span>
          </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    )
});

NavLinks.displayName = 'NavLinks';

export const DashboardLayout = memo(({ children }: { children: React.ReactNode }) => {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = useCallback(async () => {
        await logout();
        router.push('/login');
    }, [logout, router]);

    const getRoleDisplayName = useMemo(() => {
      if (user?.role === 'admin') return 'Project Lead';
      if (user?.role === 'assembler') return 'Assembler';
      return user?.displayName || 'My Account';
    }, [user?.role, user?.displayName]);
  
    const getInitials = useCallback((name?: string | null) => {
      if (!name || name.trim() === "") return "U";
      
      const cleanName = name.trim();
      const names = cleanName.split(' ').filter(n => n.length > 0);
      
      if (names.length === 0) return "U";
      if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
      
      // Take first letter of first name and first letter of last name
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }, []);

    const userInitials = useMemo(() => getInitials(user?.displayName), [getInitials, user?.displayName]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="bg-gradient-subtle-orange border-r border-fundibots-primary/10">
        <SidebarHeader className="bg-gradient-fundibots-primary">
          <div className="flex h-20 items-center justify-between px-6 py-4">
            {/* Collapsed state - show compact logo */}
            <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
              <img 
                src="/fundi_bots_logo.png" 
                alt="FundiBots Logo" 
                className="h-10 w-auto object-contain transition-all duration-200 hover:scale-105 drop-shadow-sm"
              />
            </div>
            
            {/* Expanded state - show larger logo and toggle */}
            <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden">
              <img 
                src="/fundi_bots_logo.png" 
                alt="FundiBots Logo" 
                className="h-12 w-auto object-contain transition-all duration-200 hover:scale-105 drop-shadow-sm"
              />
              <SidebarTrigger className="h-8 w-8 rounded-md border border-white/20 bg-white/10 hover:bg-white/20 transition-colors text-white">
                <Package className="h-4 w-4" />
              </SidebarTrigger>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-2">
          <NavLinks />
        </SidebarContent>
        <div className="mt-auto p-4 border-t border-fundibots-primary/20 bg-gradient-subtle-orange">
          <div className="flex items-center justify-center group-data-[collapsible=icon]:px-2">
            <div className="text-xs text-fundibots-primary font-medium group-data-[collapsible=icon]:hidden">
              Manufacturing Excellence
            </div>
          </div>
        </div>
      </Sidebar>
      <SidebarInset>
         <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b bg-gradient-subtle-warm backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <div className="md:hidden">
            <SidebarTrigger>
              <Package className="h-5 w-5" />
            </SidebarTrigger>
           </div>
            
            {/* Notification Bell */}
            <div className="flex items-center">
              <NotificationBell />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-fundibots-primary/10 rounded-lg transition-colors"
                >
                  <Avatar className="h-8 w-8 border-2 border-fundibots-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-fundibots-primary to-fundibots-secondary text-white font-semibold text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.displayName || 'User'}
                    </span>
                    <span className="text-xs text-fundibots-primary font-medium">
                      {getRoleDisplayName}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10 border-2 border-fundibots-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-fundibots-primary to-fundibots-secondary text-white font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {user?.displayName || 'User'}
                    </span>
                    <span className="text-xs text-fundibots-primary font-medium">
                      {getRoleDisplayName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-fundibots-primary/10">
                    <Settings className="mr-2 h-4 w-4 text-fundibots-primary" />
                    Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-fundibots-cyan/10">
                    <Package className="mr-2 h-4 w-4 text-fundibots-cyan" />
                    Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-50 text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </SidebarInset>
    </SidebarProvider>
  )
});

DashboardLayout.displayName = 'DashboardLayout';
