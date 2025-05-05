'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Users, FileText, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    // Show loading state or redirect
    return (
        <div className="flex items-center justify-center min-h-screen">
          {/* Consistent loading spinner */}
          <LogOut className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/students", label: "Manage Students", icon: Users },
    { href: "/admin/articles", label: "Manage Articles", icon: FileText },
    { href: "/admin/reports", label: "View Reports", icon: MessageSquare },
    // Add more admin links here if needed
    // { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
         <Sidebar collapsible="icon" >
           <SidebarHeader className="items-center justify-center p-4 border-b">
              {/* Placeholder logo - replace with actual logo */}
               <div className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                 </svg>
                 <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Academic Collab</span>
               </div>
           </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                 <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))}
                      tooltip={item.label}
                      aria-label={item.label}
                    >
                      <a>
                       <item.icon />
                       <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t">
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent">
               <Avatar className="h-8 w-8">
                  {/* Add user image if available */}
                  {/* <AvatarImage src={user.imageUrl} alt={user.name} /> */}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                  </AvatarFallback>
               </Avatar>
               <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                   <span className="text-sm font-medium truncate">{user.name}</span>
                   <span className="text-xs text-muted-foreground truncate">{user.email}</span>
               </div>
             </div>
             <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={logout}>
                <LogOut className="h-4 w-4"/>
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
             </Button>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col">
           <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
             <SidebarTrigger className="md:hidden"/>
             {/* Add Breadcrumbs or page title here if needed */}
              <h1 className="text-xl font-semibold flex-1">{menuItems.find(item => pathname.startsWith(item.href))?.label || 'Admin'}</h1>
               {/* Add any header actions like notifications bell here */}
           </header>
           <div className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0">
             {children}
            </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
