
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, FileText, MessageSquare, Activity, Eye } from 'lucide-react';
import { useWebSocket } from '@/context/WebSocketContext';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface ConnectedUser {
  userId: string;
  userName: string;
}

interface ArticleView {
   userId: string;
   userName: string;
   articleTitle: string;
   timestamp: number;
}

interface RealTimeEvent {
    type: 'connect' | 'disconnect' | 'view' | 'upload' | 'comment';
    message: string;
    timestamp: number;
}

// Type for formatted activity with relative time string
interface FormattedActivity extends RealTimeEvent {
    timeAgo: string;
}

// Type for formatted view with relative time string
interface FormattedView extends ArticleView {
    timeAgo: string;
}


// Mock data fetching functions - replace with actual API calls using React Query
const fetchDashboardStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
  return {
    totalStudents: 15,
    totalArticles: 42,
    reportsPending: 5,
  };
};


export default function AdminDashboardPage() {
  const { socket } = useWebSocket();
  const [stats, setStats] = useState<{ totalStudents: number; totalArticles: number; reportsPending: number } | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [articleViews, setArticleViews] = useState<ArticleView[]>([]);
  const [recentActivity, setRecentActivity] = useState<RealTimeEvent[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null); // Use state for current time
  const [formattedActivities, setFormattedActivities] = useState<FormattedActivity[]>([]);
  const [formattedViews, setFormattedViews] = useState<FormattedView[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true); // Loading state for stats

  // Set initial current time on client-side mount to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(Date.now());
    // Fetch initial stats
    fetchDashboardStats().then(data => {
        setStats(data);
        setIsLoadingStats(false);
    }).catch(error => {
        console.error("Failed to load stats:", error);
        // Optionally show a toast error for stats loading
        setIsLoadingStats(false);
    });
  }, []);


  useEffect(() => {
    // WebSocket listeners for real-time updates
    if (socket) {
       const handleConnect = (data: { userId: string; userName: string }) => {
          setConnectedUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
          setRecentActivity(prev => [{ type: 'connect', message: `${data.userName} connected.`, timestamp: Date.now() }, ...prev].slice(0, 10));
       };
       const handleDisconnect = (data: { userId: string; userName: string }) => {
          setConnectedUsers(prev => prev.filter(u => u.userId !== data.userId));
          setArticleViews(prev => prev.filter(v => v.userId !== data.userId)); // Remove views from disconnected user
          setRecentActivity(prev => [{ type: 'disconnect', message: `${data.userName} disconnected.`, timestamp: Date.now() }, ...prev].slice(0, 10));
       };
       const handleView = (data: { userId: string; userName: string, articleTitle: string }) => {
           const newView = { ...data, timestamp: Date.now() };
           // Update existing view or add new one
           setArticleViews(prev => [...prev.filter(v => v.userId !== data.userId), newView]);
           setRecentActivity(prev => [{ type: 'view', message: `${data.userName} viewing: ${data.articleTitle}`, timestamp: Date.now() }, ...prev].slice(0, 10));
       };
        const handleUpload = (data: { studentName: string, reportTitle: string }) => {
          setRecentActivity(prev => [{ type: 'upload', message: `${data.studentName} uploaded: ${data.reportTitle}`, timestamp: Date.now() }, ...prev].slice(0, 10));
           // Potentially update stats.reportsPending count here after refetching or direct update
           // Example: setStats(prev => prev ? { ...prev, reportsPending: prev.reportsPending + 1 } : null);
        };
        const handleComment = (data: { reportId: string }) => { // Assuming comment event has reportId
           setRecentActivity(prev => [{ type: 'comment', message: `Comment added to report ${data.reportId}`, timestamp: Date.now() }, ...prev].slice(0, 10));
        }


       socket.on('UserConnected', handleConnect);
       socket.on('UserDisconnected', handleDisconnect);
       socket.on('ArticleConsulted', handleView);
       socket.on('ReportUploaded', handleUpload);
       socket.on('CommentAdded', handleComment);


      // Request initial list of connected users upon connection
      socket.emit('getConnectedUsers'); // Assuming backend handles this request
      socket.on('InitialConnectedUsers', (users: ConnectedUser[]) => {
        setConnectedUsers(users);
      });


       return () => {
         socket.off('UserConnected', handleConnect);
         socket.off('UserDisconnected', handleDisconnect);
         socket.off('ArticleConsulted', handleView);
         socket.off('ReportUploaded', handleUpload);
         socket.off('CommentAdded', handleComment);
         socket.off('InitialConnectedUsers');
       };
    }
  }, [socket]);


  const formatTimeAgo = (timestamp: number, now: number | null) => {
     if (now === null) return '...'; // Return placeholder if current time isn't set yet
     const seconds = Math.floor((now - timestamp) / 1000);
     if (seconds < 60) return `${seconds}s ago`;
     const minutes = Math.floor(seconds / 60);
     if (minutes < 60) return `${minutes}m ago`;
     const hours = Math.floor(minutes / 60);
     return `${hours}h ago`;
  }

  // Update formatted activities and views when dependencies change
  useEffect(() => {
    if (currentTime !== null) {
        const formattedActs = recentActivity.map(event => ({
            ...event,
            timeAgo: formatTimeAgo(event.timestamp, currentTime)
        }));
        setFormattedActivities(formattedActs);

        const formattedVs = articleViews
            .sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent view
            .map(view => ({
                ...view,
                timeAgo: formatTimeAgo(view.timestamp, currentTime)
            }));
        setFormattedViews(formattedVs);
    }
    // Set up an interval to update the 'time ago' strings periodically
     const intervalId = setInterval(() => {
       setCurrentTime(Date.now());
     }, 30000); // Update every 30 seconds

     return () => clearInterval(intervalId); // Cleanup interval on unmount

  }, [recentActivity, articleViews, currentTime]);



  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats?.totalStudents}</div>}
             {/* <p className="text-xs text-muted-foreground">+2 since last month</p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingStats ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats?.totalArticles}</div>}
            {/* <p className="text-xs text-muted-foreground">+5 this week</p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Pending Review</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats?.reportsPending}</div>}
            {/* <p className="text-xs text-muted-foreground">Needs attention</p> */}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Panels */}
       <div className="grid gap-6 md:grid-cols-2">
          {/* Connected Users & Views */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5"/> Real-time Activity</CardTitle>
             <CardDescription>See who is connected and what they are viewing.</CardDescription>
           </CardHeader>
           <CardContent>
              <div className="space-y-4">
                <div>
                   <h3 className="text-md font-semibold mb-2">Currently Viewing ({formattedViews.length})</h3>
                   <ScrollArea className="h-40">
                       {formattedViews.length > 0 ? (
                           formattedViews.map(view => (
                               <div key={view.userId} className="flex items-center justify-between p-2 rounded hover:bg-muted text-sm">
                                   <span className="flex items-center gap-2">
                                       <Eye className="h-4 w-4 text-blue-500" />
                                       {view.userName}
                                   </span>
                                   <span className="truncate text-muted-foreground" title={view.articleTitle}>
                                       "{view.articleTitle}"
                                   </span>
                                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                       {view.timeAgo}
                                   </span>
                               </div>
                           ))
                       ) : (
                           <p className="text-sm text-muted-foreground p-2">No users currently viewing articles.</p>
                       )}
                   </ScrollArea>
                 </div>
                 <div>
                     <h3 className="text-md font-semibold mb-2">Connected Users ({connectedUsers.length})</h3>
                     <ScrollArea className="h-40">
                         {connectedUsers.length > 0 ? (
                             connectedUsers.map(user => (
                               <div key={user.userId} className="flex items-center gap-2 p-2 rounded hover:bg-muted text-sm">
                                   <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                                   <span>{user.userName}</span>
                               </div>
                             ))
                         ) : (
                            <p className="text-sm text-muted-foreground p-2">No users currently connected.</p>
                         )}
                    </ScrollArea>
                 </div>
              </div>
           </CardContent>
         </Card>

         {/* Recent Activity Log */}
         <Card>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5"/> Recent Activity Log</CardTitle>
                 <CardDescription>Latest events from the platform.</CardDescription>
             </CardHeader>
            <CardContent>
                <ScrollArea className="h-[calc(8rem_+_8rem_+_2rem)]"> {/* Match height of the other card */}
                    {formattedActivities.length > 0 ? (
                        formattedActivities.map((event, index) => (
                           <div key={index} className="flex items-start gap-2 p-2 border-b last:border-b-0 text-sm">
                               <span className={`mt-1 w-2 h-2 rounded-full ${
                                    event.type === 'connect' ? 'bg-green-500' :
                                    event.type === 'disconnect' ? 'bg-gray-400' :
                                    event.type === 'view' ? 'bg-blue-500' :
                                    event.type === 'upload' ? 'bg-purple-500' :
                                    event.type === 'comment' ? 'bg-yellow-500' : 'bg-gray-300'
                                }`}></span>
                               <div className="flex-1">
                                  <p>{event.message}</p>
                                  <p className="text-xs text-muted-foreground">{event.timeAgo}</p>
                               </div>
                           </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground p-2">No recent activity.</p>
                    )}
                 </ScrollArea>
             </CardContent>
         </Card>

       </div>
    </div>
  );
}
