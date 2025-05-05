'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Article } from '@/types/article';
import type { Report } from '@/types/report'; // Assuming Report type exists
import { useAuth } from '@/context/AuthContext'; // To get current user
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from '@/context/WebSocketContext';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';


// Mock data and functions (Replace with actual API calls using React Query)
const mockAssignedArticles: Article[] = [
    { id: 'art1', title: 'Introduction to Quantum Computing', content: '...', createdAt: '', updatedAt: '', filePath: '/files/quantum_intro.pdf' },
    // Assume another article is assigned but no report submitted yet
    { id: 'art4', title: 'Advanced Statistical Methods', content: '...', createdAt: '', updatedAt: '', filePath: '/files/stats.pdf'},
];

const mockSubmittedReports: Report[] = [
    { id: 'rep1', article: { id: 'art1', title: 'Introduction to Quantum Computing', content: '...', createdAt: '', updatedAt: ''}, student: {id: '2', name: '', email:'', role: 'doctorant'}, filePath: '/files/report_quantum.pdf', comments: [{id: 'c1', reportId: 'rep1', author: {id: '1', name:'', email:'', role: 'admin'}, text: 'Good start...', createdAt: '', updatedAt: ''}], createdAt: '', updatedAt: '' },
];


const fetchStudentDashboardData = async (studentId: string) => {
    await new Promise(resolve => setTimeout(resolve, 750));
    // In real app, fetch articles assigned to studentId and reports submitted by studentId
    const assigned = mockAssignedArticles; // Filter by studentId in real API
    const submitted = mockSubmittedReports; // Filter by studentId in real API
    const pendingArticles = assigned.filter(article => !submitted.some(report => report.article.id === article.id));
    const reportsWithComments = submitted.filter(report => report.comments.length > 0);
    return {
        assignedArticlesCount: assigned.length,
        submittedReportsCount: submitted.length,
        pendingArticlesCount: pendingArticles.length,
        reportsWithFeedbackCount: reportsWithComments.length,
        recentArticles: assigned.slice(0, 3), // Example: show 3 most recent
        recentFeedback: reportsWithComments.slice(0, 3), // Example: show feedback on 3 most recent
    };
};

interface DashboardData {
    assignedArticlesCount: number;
    submittedReportsCount: number;
    pendingArticlesCount: number;
    reportsWithFeedbackCount: number;
    recentArticles: Article[];
    recentFeedback: Report[];
}


export default function StudentDashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { socket } = useWebSocket();

    const loadData = React.useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const dashboardData = await fetchStudentDashboardData(user.id);
            setData(dashboardData);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
            toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);


    useEffect(() => {
        loadData();
    }, [loadData]);

     // Listen for relevant WebSocket events to potentially refresh data or show notifications
    useEffect(() => {
        if (socket && user) {
            const handleArticleAssigned = (eventData: { studentId: string, articleTitle: string }) => {
                if (eventData.studentId === user.id) {
                    // Notification is handled in WebSocketContext, just refresh data
                    loadData();
                }
            };
            const handleCommentAdded = (eventData: { studentId: string }) => {
                 if (eventData.studentId === user.id) {
                    // Notification is handled in WebSocketContext, just refresh data
                     loadData();
                 }
            };

            socket.on('ArticleAssigned', handleArticleAssigned);
            socket.on('CommentAdded', handleCommentAdded);

            return () => {
                socket.off('ArticleAssigned', handleArticleAssigned);
                socket.off('CommentAdded', handleCommentAdded);
            };
        }
    }, [socket, user, loadData]);


  if (isLoading || !data) {
    // Optional: Add Skeleton Loader
    return <div className="container mx-auto py-6"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name}!</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.assignedArticlesCount}</div>
             <Link href="/student/articles" className="text-xs text-muted-foreground hover:text-primary">View All</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.submittedReportsCount}</div>
             <Link href="/student/reports" className="text-xs text-muted-foreground hover:text-primary">View Reports</Link>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingArticlesCount}</div>
             <p className="text-xs text-muted-foreground">Articles needing submission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Received</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.reportsWithFeedbackCount}</div>
            <p className="text-xs text-muted-foreground">Reports with comments</p>
          </CardContent>
        </Card>
      </div>

       {/* Recent Activity Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recently Assigned Articles</CardTitle>
            <CardDescription>Quick access to your latest assignments.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
                {data.recentArticles.length > 0 ? (
                    data.recentArticles.map(article => (
                        <div key={article.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                            <span className="font-medium truncate pr-4">{article.title}</span>
                             <Link href={`/student/articles/${article.id}`}>
                                <Button variant="outline" size="sm">View</Button>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent articles assigned.</p>
                )}
            </ScrollArea>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Check the latest comments on your reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
               {data.recentFeedback.length > 0 ? (
                    data.recentFeedback.map(report => (
                        <div key={report.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                             <div>
                                <p className="font-medium truncate pr-4">{report.article.title}</p>
                                 <Badge variant="default">{report.comments.length} new comment(s)</Badge>
                            </div>
                             <Link href={`/student/reports/${report.id}`}>
                                <Button variant="outline" size="sm">View Feedback</Button>
                            </Link>
                        </div>
                    ))
                ) : (
                     <p className="text-sm text-muted-foreground text-center py-4">No recent feedback received.</p>
                )}
             </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
