'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare, Send, FileText, ExternalLink, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input'; // Needed for potential future search/filter
import type { Report } from '@/types/report';
import type { Comment } from '@/types/comment';
import type { Article } from '@/types/article';
import type { User } from '@/types/user';
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

// Mock Data (replace with API calls)
const mockStudentsData: User[] = [
  { id: '2', name: 'Alice Smith', email: 'alice@example.com', role: 'doctorant', domaine: 'Computer Science' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'doctorant', domaine: 'Physics' },
];
const mockArticle1: Article = { id: 'art1', title: 'Introduction to Quantum Computing', content: '...', createdAt: '', updatedAt: ''};
const mockArticle3: Article = { id: 'art3', title: 'String Theory Basics', content: '...', createdAt: '', updatedAt: ''};

const mockReports: Report[] = [
  { id: 'rep1', article: mockArticle1, student: mockStudentsData[0], filePath: '/files/report_quantum.pdf', comments: [
      {id: 'c1', reportId: 'rep1', author: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin'}, text: 'Good start, but need more details on qubit implementation.', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString()}
    ], createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'rep2', article: mockArticle3, student: mockStudentsData[1], filePath: '/files/report_string.docx', comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


// Mock API functions
const fetchReports = async (): Promise<Report[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
   // Simulate resolving nested data if backend provides IDs only
   return mockReports.map(report => ({
     ...report,
     student: mockStudentsData.find(s => s.id === report.student.id)!,
     article: [mockArticle1, mockArticle3].find(a => a.id === report.article.id)!,
   }));
};

const addComment = async (reportId: string, authorId: string, text: string): Promise<Comment> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const reportIndex = mockReports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) throw new Error("Report not found");

    const newComment: Comment = {
        id: `c${Math.random().toString(36).substring(2, 5)}`,
        reportId: reportId,
        author: { id: authorId, name: 'Admin User', email: 'admin@example.com', role: 'admin'}, // Assuming admin is logged in
        text: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockReports[reportIndex].comments.push(newComment);
    console.log('Added comment (mock):', newComment);
    return newComment;
};


export default function ViewReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();
  const { emitEvent, socket } = useWebSocket();
  const { user: adminUser } = useAuth(); // Get logged-in admin user


    const loadReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchReports();
            setReports(data);
        } catch (error) {
            console.error("Failed to load reports:", error);
            toast({ title: "Error", description: "Could not load reports.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    // Listen for ReportUploaded events to refresh the list
    useEffect(() => {
        if (socket) {
            const handleReportUploaded = (data: { reportId: string /* add other needed fields */}) => {
                console.log("Report uploaded event received, refreshing list...");
                toast({
                    title: "New Report Uploaded",
                    description: "A student has submitted a new report.",
                });
                loadReports(); // Reload the report list
            };

            socket.on('ReportUploaded', handleReportUploaded);

            return () => {
                socket.off('ReportUploaded', handleReportUploaded);
            };
        }
    }, [socket, loadReports, toast]);



  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    setNewComment(''); // Reset comment input on close
    setIsSubmittingComment(false);
  };

   const handleAddComment = async () => {
        if (!selectedReport || !newComment.trim() || !adminUser) return;

        setIsSubmittingComment(true);
        try {
            const addedComment = await addComment(selectedReport.id, adminUser.id, newComment);

            // Update local state optimistically or after confirmation
             setReports(prevReports =>
               prevReports.map(r =>
                 r.id === selectedReport.id
                   ? { ...r, comments: [...r.comments, addedComment] }
                   : r
               )
             );
             // Update the selectedReport state as well
             setSelectedReport(prev => prev ? { ...prev, comments: [...prev.comments, addedComment] } : null);

            toast({ title: "Comment Added", description: "Your comment has been posted." });
            setNewComment(''); // Clear input field

            // Emit WebSocket event
            emitEvent('CommentAdded', {
                reportId: selectedReport.id,
                articleId: selectedReport.article.id, // Send article ID
                studentId: selectedReport.student.id, // Send student ID
                commentText: addedComment.text, // Send comment text
                // Add any other relevant data
            });

        } catch (error) {
            console.error("Failed to add comment:", error);
            toast({ title: "Error", description: "Could not add comment.", variant: "destructive" });
        } finally {
            setIsSubmittingComment(false);
        }
    };


  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">View Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Submitted Reports</CardTitle>
          <CardDescription>Review reports submitted by students and add comments.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article Title</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.article.title}</TableCell>
                    <TableCell>{report.student.name}</TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                     <TableCell>
                      {report.filePath ? (
                        <a href={report.filePath} target="_blank" rel="noreferrer" className="flex items-center text-primary hover:underline">
                          <FileText className="mr-1 h-4 w-4" /> {report.filePath.split('/').pop()} <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No File</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.comments.length > 0 ? "default" : "secondary"}>
                        {report.comments.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                        <Eye className="mr-1 h-4 w-4" /> View / Comment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {reports.length === 0 && !isLoading && (
             <p className="text-center text-muted-foreground py-4">No reports submitted yet.</p>
           )}
        </CardContent>
      </Card>

      {/* View Report and Comments Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col"> {/* Increased size */}
              <DialogHeader>
                  <DialogTitle>Report Details: {selectedReport?.article.title}</DialogTitle>
                  <DialogDescription>
                      Submitted by {selectedReport?.student.name} on {selectedReport ? new Date(selectedReport.createdAt).toLocaleDateString() : ''}.
                  </DialogDescription>
                   {selectedReport?.filePath && (
                        <a href={selectedReport.filePath} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center text-primary hover:underline mt-2">
                          <FileText className="mr-1 h-4 w-4" /> View Submitted File <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                    )}
              </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col pr-6"> {/* Added padding right */}
                    <h3 className="text-lg font-semibold mb-2 mt-4">Comments</h3>
                    <ScrollArea className="flex-1 mb-4 border rounded-md p-4 bg-muted/50">
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
                        <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                      )}
                    </ScrollArea>

                      <div className="mt-auto space-y-2"> {/* Comment input at the bottom */}
                        <Label htmlFor="new-comment">Add a Comment</Label>
                        <Textarea
                            id="new-comment"
                            placeholder="Type your comment here..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            disabled={isSubmittingComment}
                        />
                         <div className="flex justify-end">
                            <Button onClick={handleAddComment} disabled={!newComment.trim() || isSubmittingComment}>
                                {isSubmittingComment ? (
                                    <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                    </>
                                ) : (
                                    <>
                                    <Send className="mr-2 h-4 w-4" /> Send Comment
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
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
