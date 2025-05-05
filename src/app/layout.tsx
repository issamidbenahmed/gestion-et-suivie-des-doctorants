import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed to Inter for a more standard web font
import './globals.css';
import { AuthProvider } from '@/context/AuthContext'; // Assuming AuthProvider exists
import { WebSocketProvider } from '@/context/WebSocketContext'; // Assuming WebSocketProvider exists
import { Toaster } from '@/components/ui/toaster';
import ReactQueryProvider from '@/context/ReactQueryProvider'; // Assuming ReactQueryProvider exists

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Academic Collab',
  description: 'Real-time academic collaboration platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ReactQueryProvider>
          <AuthProvider>
            <WebSocketProvider>
                {children}
                <Toaster />
            </WebSocketProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
