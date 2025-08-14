
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
      <SidebarMenu>
        <SidebarMenuItem>
          <Link href="/dashboard" passHref>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Dashboard">
              <a>
                <LayoutDashboard />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        {user?.role === 'admin' && (
           <SidebarMenuItem>
             <Link href="/dashboard/projects" passHref>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard/projects'} tooltip="Projects">
                <a>
                  <GanttChartSquare />
                  <span className="group-data-[collapsible=icon]:hidden">Projects</span>
                </a>
              </SidebarMenuButton>
            </Link>
           </SidebarMenuItem>
        )}
        {user?.role === 'assembler' && (
            <SidebarMenuItem>
              <Link href="/dashboard/work-sessions" passHref>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard/work-sessions'} tooltip="Work Sessions">
                  <a>
                    <Package />
                    <span className="group-data-[collapsible=icon]:hidden">Work Sessions</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
        )}
        {user?.role === 'admin' && (
           <SidebarMenuItem>
            <Link href="/dashboard/ai-optimizer" passHref>
             <SidebarMenuButton asChild isActive={pathname === '/dashboard/ai-optimizer'} tooltip="AI Optimizer">
              <a>
                <Cpu />
                <span className="group-data-[collapsible=icon]:hidden">AI Optimizer</span>
              </a>
            </SidebarMenuButton>
            </Link>
           </SidebarMenuItem>
        )}
        <SidebarMenuItem>
          <Link href="/dashboard/notifications" passHref>
           <SidebarMenuButton asChild isActive={pathname === '/dashboard/notifications'} tooltip="Notifications">
            <a>
              <Bell />
              <span className="group-data-[collapsible=icon]:hidden">Notifications</span>
            </a>
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
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex h-10 items-center justify-center gap-2 rounded-full bg-sidebar-primary text-lg font-semibold text-sidebar-primary-foreground">
            <SidebarTrigger>
                <Package className="h-5 w-5 transition-all group-data-[collapsible=icon]:group-hover/menu-item:scale-110" />
            </SidebarTrigger>
            <span className="group-data-[collapsible=icon]:hidden">
                FundiFlow
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavLinks />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
         <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
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
