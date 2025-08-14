
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import {
  Bell,
  Cpu,
  GanttChartSquare,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
  BarChartHorizontal,
  Monitor,
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

const NavLinks = () => {
    const { user } = useAuth();
    const pathname = usePathname()
    
    return (
      <SidebarMenu className="space-y-1">
        <SidebarMenuItem>
          <Link href="/dashboard">
            <SidebarMenuButton 
              asChild 
              isActive={pathname === '/dashboard'} 
              tooltip="Dashboard"
              size="lg"
              className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
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
                className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
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
                className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
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
                  className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
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
            <Link href="/dashboard/ai-optimizer">
             <SidebarMenuButton 
               asChild 
               isActive={pathname === '/dashboard/ai-optimizer'} 
               tooltip="AI Optimizer"
               size="lg"
               className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
             >
              <span>
                <Cpu className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden font-medium">AI Optimizer</span>
              </span>
            </SidebarMenuButton>
            </Link>
           </SidebarMenuItem>
        )}
        {user?.role === 'admin' && (
           <SidebarMenuItem>
            <Link href="/dashboard/monitoring">
             <SidebarMenuButton 
               asChild 
               isActive={pathname === '/dashboard/monitoring'} 
               tooltip="Real-time Monitoring"
               size="lg"
               className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
             >
              <span>
                <Monitor className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden font-medium">Monitoring</span>
              </span>
            </SidebarMenuButton>
            </Link>
           </SidebarMenuItem>
        )}
        {user?.role === 'admin' && (
           <SidebarMenuItem>
            <Link href="/dashboard/analytics">
             <SidebarMenuButton 
               asChild 
               isActive={pathname === '/dashboard/analytics'} 
               tooltip="Analytics"
               size="lg"
               className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
             >
              <span>
                <BarChartHorizontal className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden font-medium">Analytics</span>
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
               className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
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
             className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
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
             className="h-12 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/80"
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
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

  const getRoleDisplayName = () => {
    if (user?.role === 'admin') return 'Project Lead';
    if (user?.role === 'assembler') return 'Assembler';
    return user?.displayName || 'My Account';
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }

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
                className="h-10 w-auto object-contain transition-all duration-200 hover:scale-105"
              />
            </div>
            
            {/* Expanded state - show larger logo and toggle */}
            <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden">
              <img 
                src="/fundi_bots_logo.png" 
                alt="FundiBots Logo" 
                className="h-12 w-auto object-contain transition-all duration-200 hover:scale-105"
              />
              <SidebarTrigger className="h-8 w-8 rounded-md border border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors">
                <Package className="h-4 w-4" />
              </SidebarTrigger>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-2">
          <NavLinks />
        </SidebarContent>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-center group-data-[collapsible=icon]:px-2">
            <div className="text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
              Manufacturing Excellence
            </div>
          </div>
        </div>
      </Sidebar>
      <SidebarInset>
         <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-gradient-subtle-warm backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <div className="md:hidden">
            <SidebarTrigger>
              <Package className="h-5 w-5" />
            </SidebarTrigger>
           </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.email}`} alt={user?.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{getRoleDisplayName()}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
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
}
