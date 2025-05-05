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

// Removed redundant mockLoginApi function. The login logic is handled within AuthContext.


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
      // Directly use the login function from the AuthContext
      // The AuthContext's login function handles the API call (or mock call)
      // and subsequent state updates and redirection.
      await login({ email: values.email, password: values.password } as any, ''); // Pass credentials to context login
                                                                                  // The second argument (token) is handled internally by the mock/real API call within context

       // Success toast and redirection are handled within AuthContext's login function
       // toast({
       //   title: "Login Successful",
       //   description: `Welcome back!`, // Name might not be immediately available here
       // });
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
