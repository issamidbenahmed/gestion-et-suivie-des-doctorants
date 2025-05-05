'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import Link from 'next/link'; // Import Link

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Mock API function - replace with actual API call from AuthContext or service
async function mockLoginApi(credentials: LoginFormValues): Promise<{ user: any; token: string }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In a real app, you'd send credentials to your backend (e.g., Laravel)
  // The backend would verify credentials and return user data and a token
  // Check against mock data from AuthContext or a shared mock store if available
  if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
    return {
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      token: 'fake-admin-token',
    };
  } else if (credentials.email === 'student@example.com' && credentials.password === 'password') {
     return {
      user: { id: '2', name: 'Student User', email: 'student@example.com', role: 'doctorant', domaine: 'Computer Science' }, // Added domaine
      token: 'fake-student-token',
    };
  } else if (credentials.email === 'alice@example.com' && credentials.password === 'password') { // Added Alice from mock data
     return {
         user: { id: '2', name: 'Alice Smith', email: 'alice@example.com', role: 'doctorant', domaine: 'Computer Science' },
         token: 'fake-alice-token',
     };
  } else if (credentials.email === 'bob@example.com' && credentials.password === 'password') { // Added Bob
      return {
          user: { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'doctorant', domaine: 'Physics' },
          token: 'fake-bob-token',
      };
  } else if (credentials.email === 'charlie@example.com' && credentials.password === 'password') { // Added Charlie
      return {
          user: { id: '4', name: 'Charlie Brown', email: 'charlie@example.com', role: 'doctorant', domaine: 'Mathematics' },
          token: 'fake-charlie-token',
      };
  }
  // Add check for dynamically added users if mockSignupApi updates a shared store
  // For now, only hardcoded users work for login

  else {
    throw new Error('Invalid credentials');
  }
}


export default function LoginPage() {
  const { login, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

   // Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (user.role === 'doctorant') {
        router.replace('/student/dashboard');
      }
    }
  }, [user, authLoading, router]);


  const onSubmit = async (values: LoginFormValues) => {
     setIsSubmitting(true);
    try {
      // Replace mockLoginApi with your actual API call mechanism
      // Potentially call a function provided by useAuth context
      const { user: userData, token } = await mockLoginApi(values);
      await login(userData, token);
      // Redirect is handled within AuthContext's login function
       toast({
         title: "Login Successful",
         description: `Welcome back, ${userData.name}!`,
       });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
       setIsSubmitting(false);
    }
  };

   // Show loading or blank page if auth is loading or user is logged in (and redirecting)
  if (authLoading || (!authLoading && user)) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Academic Collab</CardTitle>
          <CardDescription>Please enter your credentials to log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
                 {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
              </Button>
            </form>
          </Form>
           {/* Link to Sign Up page */}
           <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
             <Link href="/signup" className="underline text-primary hover:text-primary/80">
                Sign Up
            </Link>
           </div>
           {/* Optionally add a link for password recovery if needed later */}
          {/* <div className="mt-4 text-center text-sm">
            <a href="#" className="underline text-primary hover:text-primary/80">
              Forgot password?
            </a>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
