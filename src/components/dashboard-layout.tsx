
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
  PanelLeft,
  Settings,
  Users
} from "lucide-react"

import { cn } from "@/lib/utils"
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
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isMobile: boolean;
}

const NavItem = ({ href, icon: Icon, label, isMobile }: NavItemProps) => {
  const pathname = usePathname()
  const isActive = pathname === href;

  const linkContent = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
        isActive && "text-foreground bg-accent/50 rounded-md",
        isMobile ? "py-2" : "py-2"
      )}
    >
      <Icon className="h-5 w-5" />
      {isMobile && <span>{label}</span>}
    </Link>
  );

  if (isMobile) {
    return linkContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {linkContent}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={5}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
};


const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
    const { user } = useAuth();
    
    return (
      <>
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" isMobile={isMobile} />
        {user?.role === 'admin' && (
            <NavItem href="/dashboard/projects" icon={GanttChartSquare} label="Projects" isMobile={isMobile} />
        )}
        {user?.role === 'assembler' && (
            <NavItem href="/dashboard/work-sessions" icon={Package} label="Work Sessions" isMobile={isMobile} />
        )}
        {user?.role === 'admin' && (
            <NavItem href="/dashboard/ai-optimizer" icon={Cpu} label="AI Optimizer" isMobile={isMobile} />
        )}
        <NavItem href="/dashboard/notifications" icon={Bell} label="Notifications" isMobile={isMobile} />
      </>
    )
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 py-4">
            <Link
              href="#"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Package className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">FundiFlow</span>
            </Link>
            <NavLinks />
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="#"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                  >
                    <Package className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">FundiFlow</span>
                  </Link>
                  <NavLinks isMobile={true} />
                </nav>
              </SheetContent>
            </Sheet>
            
            <div className="relative ml-auto flex-1 md:grow-0">
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.email}`} alt={user?.email || 'User'} />
                    <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
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
        </div>
      </div>
    </TooltipProvider>
  )
}
