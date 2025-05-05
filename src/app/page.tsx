'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // If user is logged in, redirect to their dashboard
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (user.role === 'doctorant') {
          router.replace('/student/dashboard');
        } else {
          // Fallback if role is unknown (shouldn't happen ideally)
          router.replace('/login');
        }
      } else {
        // If user is not logged in, redirect to login
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show a loading state while checking auth status
  return (
     <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 p-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-32" />
        </div>
     </div>
  );
}
