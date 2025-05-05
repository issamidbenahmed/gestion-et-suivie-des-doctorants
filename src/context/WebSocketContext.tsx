'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io, { type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Import useAuth
import { useToast } from "@/hooks/use-toast"; // Import useToast for notifications

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitEvent: (eventName: string, data?: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Replace with your actual backend WebSocket server URL
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:6001'; // Default to common Laravel Echo Server port

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuth(); // Get token and user from AuthContext
  const { toast } = useToast();

  useEffect(() => {
    if (token && user) { // Only connect if user is authenticated
      // Connect to the WebSocket server
      // Pass the auth token for authentication on the backend
      const newSocket = io(SOCKET_SERVER_URL, {
        // transports: ['websocket'], // Force WebSocket transport if needed
        auth: {
          token: token, // Send token for backend authentication
          userId: user.id // Send user ID if useful for backend
        },
        // Add other necessary options here, e.g., path if not default
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        // Optionally attempt to reconnect or notify the user
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
        // Handle connection errors (e.g., show error message)
        toast({
          title: "Connection Error",
          description: "Could not connect to real-time server.",
          variant: "destructive",
        });
      });

      // --- Real-time Event Listeners ---
      // These should match the events broadcasted by your Laravel backend

      newSocket.on('ArticleAssigned', (data: { studentId: string, articleTitle: string }) => {
        console.log('Event received: ArticleAssigned', data);
        // Only show notification if it's for the current user
        if (user.role === 'doctorant' && data.studentId === user.id) {
           toast({
             title: "New Article Assigned",
             description: `Professor assigned you the article: "${data.articleTitle}"`,
           });
           // TODO: Optionally trigger a data refetch for the student's article list
        } else if (user.role === 'admin') {
            // Admin might get a different notification or update their UI
             toast({
               title: "Article Assigned",
               description: `Article "${data.articleTitle}" assigned to student ID ${data.studentId}.`,
             });
        }
      });

      newSocket.on('CommentAdded', (data: { articleId: string, reportId: string, studentId: string }) => {
        console.log('Event received: CommentAdded', data);
         if (user.role === 'doctorant' && data.studentId === user.id) {
           toast({
             title: "New Comment",
             description: `Professor added a comment on your report for article ID ${data.articleId}.`,
           });
            // TODO: Optionally trigger a data refetch for comments
         } else if (user.role === 'admin') {
             // Maybe update the admin UI to show the new comment indicator
         }
      });

      newSocket.on('ReportUploaded', (data: { studentName: string, reportTitle: string, articleId: string }) => {
        console.log('Event received: ReportUploaded', data);
        if (user.role === 'admin') {
          toast({
            title: "Report Uploaded",
            description: `${data.studentName} uploaded a report: "${data.reportTitle}" for article ID ${data.articleId}.`,
          });
          // TODO: Optionally trigger a data refetch for the admin's report list
        }
      });

       newSocket.on('UserConnected', (data: { userId: string; userName: string }) => {
         console.log('Event received: UserConnected', data);
         if (user.role === 'admin' && data.userId !== user.id) {
           toast({
             description: `${data.userName} connected.`,
           });
           // TODO: Update admin UI list of connected users
         }
       });

       newSocket.on('UserDisconnected', (data: { userId: string; userName: string }) => {
         console.log('Event received: UserDisconnected', data);
         if (user.role === 'admin' && data.userId !== user.id) {
           toast({
             description: `${data.userName} disconnected.`,
           });
           // TODO: Update admin UI list of connected users
         }
       });

        newSocket.on('ArticleConsulted', (data: { userId: string; userName: string, articleTitle: string }) => {
          console.log('Event received: ArticleConsulted', data);
          if (user.role === 'admin' && data.userId !== user.id) {
             toast({
               description: `${data.userName} is viewing article: "${data.articleTitle}".`,
             });
             // TODO: Update admin UI to show who is viewing what
          }
        });


      // --- End Event Listeners ---

      setSocket(newSocket);

      // Cleanup on component unmount or when token/user changes
      return () => {
        console.log('Disconnecting WebSocket...');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // If not authenticated, ensure socket is disconnected
      if (socket) {
        console.log('Disconnecting WebSocket due to logout...');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, toast]); // Reconnect if token or user changes

  const emitEvent = useCallback((eventName: string, data?: any) => {
    if (socket && isConnected) {
      console.log(`Emitting event: ${eventName}`, data);
      socket.emit(eventName, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', eventName);
      // Optionally queue the event or show an error
       toast({
         title: "Real-time Action Failed",
         description: "Could not send update. Please check your connection.",
         variant: "destructive",
       });
    }
  }, [socket, isConnected, toast]);

  const value = { socket, isConnected, emitEvent };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
