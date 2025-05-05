'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, CheckCircle, Eye, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { Report } from '@/types/report';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';


// Mock data (Replace with actual API calls)
const mockSubmittedReports: Report[] = [
    { id: 'rep1', article: { id: 'art1', title: 'Introduction to Quantum Computing', content: '...', createdAt: '', updatedAt: ''}, student: {id: '2', name: '', email:'', role: 'doctorant'}, filePath: '/files/report_quantum.pdf', comments: [{id: 'c1', reportId: 'rep1', author: {id: '1', name:'Admin', email:'', role:'admin'}, text: 'Good start, but need more details on qubit implementation.', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: ''}], createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
     { id: 'rep3', article: { id: 'art5', title: 'Machine Learning Ethics', content: '...', createdAt: '', updatedAt: ''}, student: {id: '2', name: '', email:'', role: 'doctorant'}, filePath: '/files/report_ethics.docx', comments: [{id:'c2', reportId:'rep3', author:{id:'1', name:'Admin', email:'', role:'admin'}, text:'Needs more real-world examples.', createdAt: new Date().toISOString(), updatedAt:''}], createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
      { id: 'rep4', article: { id: 'artX', title: 'Another Topic', content: '...', createdAt: '', updatedAt: ''}, student: {id: '2', name: '', email:'', role: 'doctorant'}, filePath: '/files/report_another.pdf', comments: [], createdAt: new Date(Date.now() - 86400000*3).toISOString(), updatedAt: new Date(Date.now() - 86400000*3).toISOString() },

];


const fetchStudentReports = async (studentId: string): Promise<Report[]> => {
    await new Promise(resolve => setTimeout(resolve, 700));
    // Filter mock data - in real API, fetch reports where report.student.id === studentId
    return mockSubmittedReports;
};


export default function MyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

   const loadReports = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const reportData = await fetchStudentReports(user.id);
            setReports(reportData);
        } catch (error) {
            console.error("Failed to load reports:", error);
            toast({ title: "Error", description: "Could not load your submitted reports.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

   const handleViewFeedback = (report: Report) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedReport(null);
    };


  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">My Submitted Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
          <CardDescription>View your submitted reports and any feedback provided.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-4">
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                         <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                         </div>
                         <div className="flex gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-32" />
                        </div>
                    </div>
                 ))}
             </div>
          ) : (
             <div className="space-y-4">
              {reports.length > 0 ? reports.map((report) => (
                <div key={report.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md shadow-sm gap-4">
                     <div className="flex-1">
                        <h3 className="text-lg font-semibold">{report.article.title}</h3>
                         <p className="text-sm text-muted-foreground">
                             Submitted on: {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                             <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="mr-1 h-3 w-3" /> Submitted
                            </Badge>
                            {report.comments.length > 0 && (
                                 <Badge variant="outline" className="text-blue-700 border-blue-300">
                                    <MessageSquare className="mr-1 h-3 w-3" /> {report.comments.length} Comment(s)
                                </Badge>
                            )}
                        </div>
                    </div>
                     <div className="flex flex-shrink-0 gap-2 mt-2 sm:mt-0">
                        {report.filePath && (
                            <a href={report.filePath} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm">
                                    <FileText className="mr-1 h-4 w-4" /> View Submission <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                            </a>
                        )}
                         {report.comments.length > 0 && (
                             <Button size="sm" onClick={() => handleViewFeedback(report)}>
                                <Eye className="mr-1 h-4 w-4" /> View Feedback
                            </Button>
                         )}
                    </div>
                </div>
              )) : (
                   <p className="text-center text-muted-foreground py-6">You haven't submitted any reports yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>


        {/* View Feedback Modal */}
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
              <DialogHeader>
                  <DialogTitle>Feedback for: {selectedReport?.article.title}</DialogTitle>
                  <DialogDescription>
                     Comments from your supervisor regarding your submission.
                  </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-hidden pr-6">
                 <ScrollArea className="h-full border rounded-md p-4 bg-muted/50">
                      {selectedReport?.comments && selectedReport.comments.length > 0 ? (
                        selectedReport.comments.map((comment) => (
                          <div key={comment.id} className="mb-4 p-3 bg-background rounded shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-primary">{comment.author.name}</span>
                              <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No feedback available for this report yet.</p>
                      )}
                    </ScrollArea>
                </div>
               <DialogFooter className="mt-4">
                  <DialogClose asChild>
                      <Button type="button" variant="outline">Close</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
}
