'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && (!user || user.role !== 'doctorant')) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'doctorant') {
    // Show loading state
    return (
      <div className="flex items-center justify-center min-h-screen">
         <Skeleton className="h-12 w-12 rounded-full" />
         <div className="space-y-2 ml-4">
           <Skeleton className="h-4 w-[250px]" />
           <Skeleton className="h-4 w-[200px]" />
         </div>
      </div>
    );
  }

 const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const menuItems = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/articles", label: "My Articles", icon: FileText },
    { href: "/student/reports", label: "My Reports", icon: MessageSquare },
  ];


  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        {/* Logo or App Name */}
         <Link href="/student/dashboard" className="flex items-center gap-2 font-semibold text-lg text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                 <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                 <path d="M2 17l10 5 10-5"/>
                 <path d="M2 12l10 5 10-5"/>
              </svg>
             <span>Academic Collab</span>
         </Link>

        {/* Navigation Links */}
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 ml-6">
           {menuItems.map(item => (
              <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors hover:text-foreground ${pathname.startsWith(item.href) ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
              >
                 {item.label}
             </Link>
           ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
           {/* Add Notification Bell if needed */}
           <div className="flex items-center gap-2">
               <Avatar className="h-8 w-8">
                 {/* <AvatarImage src={user.imageUrl} alt={user.name} /> */}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                     {getInitials(user.name)}
                 </AvatarFallback>
               </Avatar>
               <span className="hidden md:inline text-sm font-medium">{user.name}</span>
            </div>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}
