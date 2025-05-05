'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, FileText, ExternalLink, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Report } from '@/types/report';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock API function (Replace with actual API call)
const fetchReportDetails = async (reportId: string, studentId: string): Promise<Report | null> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    // In real API, fetch report by ID and verify it belongs to the studentId
    const mockSubmittedReports: Report[] = [
        { id: 'rep1', article: { id: 'art1', title: 'Introduction to Quantum Computing', content: '...', createdAt: '', updatedAt: ''}, student: {id: '2', name: '', email:'', role: 'doctorant'}, filePath: '/files/report_quantum.pdf', comments: [{id: 'c1', reportId: 'rep1', author: {id: '1', name:'Admin', email:'', role:'admin'}, text: 'Good start, but need more details on qubit implementation.', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: ''}], createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 'rep3', article: { id: 'art5', title: 'Machine Learning Ethics', content: '...', createdAt: '', updatedAt: ''}, student: {id: '2', name: '', email:'', role: 'doctorant'}, filePath: '/files/report_ethics.docx', comments: [{id:'c2', reportId:'rep3', author:{id:'1', name:'Admin', email:'', role:'admin'}, text:'Needs more real-world examples.', createdAt: new Date().toISOString(), updatedAt:''}], createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
         { id: 'rep4', article: { id: 'artX', title: 'Another Topic', content: '...', createdAt: '', updatedAt: ''}, student: {id: '2', name: '', email:'', role: 'doctorant'}, filePath: '/files/report_another.pdf', comments: [], createdAt: new Date(Date.now() - 86400000*3).toISOString(), updatedAt: new Date(Date.now() - 86400000*3).toISOString() },
    ];
    const report = mockSubmittedReports.find(r => r.id === reportId /* && r.student.id === studentId */); // Add student check in real API
    return report || null;
};


export default function ReportFeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.reportId as string; // Type assertion
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();


   const loadReport = useCallback(async () => {
        if (!user || !reportId) return;
        setIsLoading(true);
        try {
            const reportData = await fetchReportDetails(reportId, user.id);
            if (reportData) {
                 // Verify the report belongs to the current user (client-side check for mock data)
                 if (reportData.student.id !== user.id && reportData.student.id !== '2') { // HACK: Allow student '2' for mock data
                    toast({ title: "Access Denied", description: "You do not have permission to view this report.", variant: "destructive" });
                    router.push('/student/reports');
                    return;
                 }
                setReport(reportData);
            } else {
                toast({ title: "Not Found", description: "The requested report could not be found.", variant: "destructive" });
                router.push('/student/reports');
            }
        } catch (error) {
            console.error("Failed to load report details:", error);
            toast({ title: "Error", description: "Could not load report details.", variant: "destructive" });
            router.push('/student/reports');
        } finally {
            setIsLoading(false);
        }
    }, [user, reportId, router, toast]);


  useEffect(() => {
    loadReport();
  }, [loadReport]);


  if (isLoading) {
      return (
         <div className="container mx-auto py-6">
              <Skeleton className="h-8 w-24 mb-4" />
             <Card>
                 <CardHeader>
                     <Skeleton className="h-6 w-3/4 mb-2" />
                     <Skeleton className="h-4 w-1/2" />
                     <Skeleton className="h-5 w-40 mt-2" />
                 </CardHeader>
                 <CardContent>
                     <Skeleton className="h-8 w-32 mb-4" />
                     <Skeleton className="h-40 w-full" />
                 </CardContent>
             </Card>
         </div>
      );
  }

   if (!report) {
        // Error handled by toast and redirect in useEffect
        return null;
   }

  return (
    <div className="container mx-auto py-6">
      <Button variant="outline" size="sm" onClick={() => router.push('/student/reports')} className="mb-4 inline-flex items-center">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to My Reports
      </Button>

       <Card>
         <CardHeader>
             <CardTitle>Feedback for: {report.article.title}</CardTitle>
             <CardDescription>
                 Submitted on {new Date(report.createdAt).toLocaleDateString()}. Review the comments below.
             </CardDescription>
             {report.filePath && (
                 <a href={report.filePath} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center text-primary hover:underline mt-2">
                   <FileText className="mr-1 h-4 w-4" /> View Your Submission <ExternalLink className="ml-1 h-3 w-3" />
                 </a>
             )}
         </CardHeader>
          <CardContent>
             <h3 className="text-lg font-semibold mb-3 flex items-center">
                 <MessageSquare className="mr-2 h-5 w-5 text-primary"/> Supervisor Comments
             </h3>
             <ScrollArea className="h-96 border rounded-md p-4 bg-muted/50">
                 {report.comments.length > 0 ? (
                     report.comments.map((comment) => (
                         <div key={comment.id} className="mb-4 p-3 bg-background rounded shadow-sm">
                             <div className="flex justify-between items-center mb-1">
                                 <span className="text-sm font-medium text-primary">{comment.author.name}</span>
                                 <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                             </div>
                             <p className="text-sm whitespace-pre-wrap">{comment.text}</p> {/* Use whitespace-pre-wrap to preserve formatting */}
                         </div>
                     ))
                 ) : (
                     <p className="text-sm text-muted-foreground text-center py-10">No feedback has been provided for this report yet.</p>
                 )}
             </ScrollArea>
         </CardContent>
       </Card>
    </div>
  );
}
