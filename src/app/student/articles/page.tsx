'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, CheckCircle, Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { Article } from '@/types/article';
import type { Report } from '@/types/report'; // Assume Report type exists
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from '@/context/WebSocketContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';


// Mock data and functions (Replace with actual API calls)
const mockAssignedArticles: Article[] = [
    { id: 'art1', title: 'Introduction to Quantum Computing', content: 'A comprehensive overview...', filePath: '/files/quantum_intro.pdf', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'art4', title: 'Advanced Statistical Methods', content: 'Exploring advanced techniques...', filePath: '/files/stats.pdf', createdAt: new Date(Date.now() - 86400000*2).toISOString(), updatedAt: new Date(Date.now() - 86400000*2).toISOString() },
     { id: 'art5', title: 'Machine Learning Ethics', content: 'Ethical considerations in AI.', filePath: '/files/ml_ethics.pdf', createdAt: new Date(Date.now() - 86400000*3).toISOString(), updatedAt: new Date(Date.now() - 86400000*3).toISOString() },
];

const mockSubmittedReportsLookup: { [articleId: string]: Report } = {
    'art1': { id: 'rep1', article: {id:'art1', title:'', content:'',createdAt:'', updatedAt:''}, student: {id:'2', name:'', email:'', role:'doctorant'}, filePath: '/files/report_quantum.pdf', comments: [], createdAt: '', updatedAt: ''},
    // 'art4' has no report yet
     'art5': { id: 'rep3', article: {id:'art5', title:'', content:'',createdAt:'', updatedAt:''}, student: {id:'2', name:'', email:'', role:'doctorant'}, filePath: '/files/report_ethics.docx', comments: [{id:'c2', reportId:'rep3', author:{id:'1', name:'', email:'', role:'admin'}, text:'Needs more real-world examples.', createdAt:'', updatedAt:''}], createdAt: '', updatedAt: ''},
};

const fetchStudentArticles = async (studentId: string): Promise<Article[]> => {
    await new Promise(resolve => setTimeout(resolve, 650));
    // Filter mock data by studentId if backend doesn't handle it
    return mockAssignedArticles;
};

const fetchSubmittedReportsStatus = async (studentId: string, articleIds: string[]): Promise<{ [articleId: string]: boolean }> => {
     await new Promise(resolve => setTimeout(resolve, 300));
     // Return a map indicating if a report exists for each articleId
     const status: { [articleId: string]: boolean } = {};
     articleIds.forEach(id => {
         status[id] = !!mockSubmittedReportsLookup[id]; // Check if report exists in mock lookup
     });
     return status;
}


export default function MyArticlesPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [reportStatus, setReportStatus] = useState<{ [articleId: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { socket, emitEvent } = useWebSocket(); // Import emitEvent

    const loadArticles = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const articleData = await fetchStudentArticles(user.id);
            setArticles(articleData);
            if (articleData.length > 0) {
                const articleIds = articleData.map(a => a.id);
                const statusData = await fetchSubmittedReportsStatus(user.id, articleIds);
                setReportStatus(statusData);
            }
        } catch (error) {
            console.error("Failed to load articles:", error);
            toast({ title: "Error", description: "Could not load your assigned articles.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);


  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

   // Listen for ArticleAssigned events to refresh the list
    useEffect(() => {
        if (socket && user) {
            const handleArticleAssigned = (eventData: { studentId: string, articleTitle: string }) => {
                if (eventData.studentId === user.id) {
                    // Notification handled in context, just reload data
                    loadArticles();
                }
            };

            socket.on('ArticleAssigned', handleArticleAssigned);

            return () => {
                socket.off('ArticleAssigned', handleArticleAssigned);
            };
        }
    }, [socket, user, loadArticles]);

     const handleViewArticle = (article: Article) => {
         // Emit WebSocket event when student starts viewing
         if (user) {
             emitEvent('ArticleConsulted', {
                 userId: user.id,
                 userName: user.name,
                 articleId: article.id,
                 articleTitle: article.title,
             });
         }
         // Open the article file in a new tab (or navigate to a detailed view page)
         if (article.filePath) {
             window.open(article.filePath, '_blank');
         } else {
              // Maybe navigate to a page showing article content if no file
              // router.push(`/student/articles/${article.id}`);
              toast({ description: "Article content view not implemented yet.", variant: "default"});
         }
     };


  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">My Assigned Articles</h1>

      <Card>
        <CardHeader>
          <CardTitle>Articles List</CardTitle>
          <CardDescription>View your assigned articles and submit your reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                        <div className="space-y-2">
                             <Skeleton className="h-5 w-48" />
                             <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex gap-2">
                             <Skeleton className="h-9 w-20" />
                             <Skeleton className="h-9 w-24" />
                        </div>
                    </div>
                ))}
             </div>
          ) : (
            <div className="space-y-4">
              {articles.length > 0 ? articles.map((article) => {
                  const hasSubmitted = reportStatus[article.id] || false;
                  return (
                    <div key={article.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md shadow-sm gap-4">
                        <div className="flex-1">
                             <h3 className="text-lg font-semibold">{article.title}</h3>
                             <p className="text-sm text-muted-foreground line-clamp-2">{article.content}</p>
                             <div className="mt-2">
                                {hasSubmitted ? (
                                     <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                                        <CheckCircle className="mr-1 h-3 w-3" /> Report Submitted
                                    </Badge>
                                ) : (
                                     <Badge variant="secondary">Report Pending</Badge>
                                )}
                             </div>
                        </div>
                        <div className="flex flex-shrink-0 gap-2 mt-2 sm:mt-0">
                             <Button variant="outline" size="sm" onClick={() => handleViewArticle(article)}>
                                <Eye className="mr-1 h-4 w-4" /> View Article
                            </Button>
                             {/* Link to upload page, passing article ID */}
                            <Link href={`/student/reports/upload?articleId=${article.id}`}>
                                 <Button size="sm" disabled={hasSubmitted}>
                                    <Upload className="mr-1 h-4 w-4" />
                                    {hasSubmitted ? 'Submitted' : 'Upload Report'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                  );
              }) : (
                  <p className="text-center text-muted-foreground py-6">You have no articles assigned yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
