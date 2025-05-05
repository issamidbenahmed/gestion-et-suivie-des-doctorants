'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Optional: if text submission is allowed
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Upload, ArrowLeft, FileText } from 'lucide-react';
import type { Article } from '@/types/article'; // Assuming Article type exists
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext'; // Import WebSocket


// Mock API functions (Replace with actual API calls)
const fetchArticleDetails = async (articleId: string): Promise<Article | null> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    // Find article in mock data
    const article = [
        { id: 'art1', title: 'Introduction to Quantum Computing', content: '...', createdAt: '', updatedAt: ''},
        { id: 'art4', title: 'Advanced Statistical Methods', content: '...', createdAt: '', updatedAt: ''},
        { id: 'art5', title: 'Machine Learning Ethics', content: '...', createdAt: '', updatedAt: ''},
    ].find(a => a.id === articleId);
    return article || null;
};

// Interface for the data sent to the backend
interface ReportUploadData {
    articleId: string;
    studentId: string;
    file?: File;
    // content?: string; // If text submission is allowed
}


const uploadReport = async (data: ReportUploadData): Promise<{ success: boolean; reportId?: string; reportTitle?: string /* Other relevant data */ }> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload delay
    console.log('Uploading report (mock):', data);
     // Add to mock submitted list (for demo purposes)
     const article = await fetchArticleDetails(data.articleId);
     if (article) {
         // Simulate adding to the mockSubmittedReportsLookup in the other file
         // This won't persist across page loads in this mock setup
         console.log(`Simulating addition of report for article ${data.articleId} to lookup.`);
     }

     // Simulate success
     return { success: true, reportId: `rep${Math.random().toString(36).substring(2,5)}`, reportTitle: data.file?.name || 'Text Report' };
};

// Validation Schema
const reportSchema = z.object({
  file: z.instanceof(FileList)
    .refine(files => files?.length === 1, 'A PDF or DOCX file is required.')
    .refine(files => files?.[0]?.type === 'application/pdf' || files?.[0]?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'File must be PDF or DOCX.')
    .refine(files => files?.[0]?.size <= 5 * 1024 * 1024, `File size must be less than 5MB.`), // Example: 5MB limit
  // content: z.string().optional(), // If text submission is allowed
}).refine(data => data.file?.length === 1 /* || data.content?.trim() */, { // Ensure at least one is provided
    // message: "Please upload a file or enter text content.",
    message: "Please upload a file.", // Simplified message if only file upload
    path: ["file"], // Or a general path if both were options
});


type ReportFormValues = z.infer<typeof reportSchema>;

function ReportUploadContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const articleId = searchParams.get('articleId');
    const [article, setArticle] = useState<Article | null>(null);
    const [isLoadingArticle, setIsLoadingArticle] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const { emitEvent } = useWebSocket(); // Get emit function

    const form = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
           // file: undefined, // Handled by input element
        },
    });
     const fileRef = form.register("file");


    useEffect(() => {
        if (articleId) {
            setIsLoadingArticle(true);
            fetchArticleDetails(articleId).then(data => {
                if (data) {
                    setArticle(data);
                } else {
                    toast({ title: "Error", description: "Could not find the specified article.", variant: "destructive" });
                    router.push('/student/articles'); // Redirect if article not found
                }
                setIsLoadingArticle(false);
            }).catch(() => {
                 toast({ title: "Error", description: "Failed to load article details.", variant: "destructive" });
                 setIsLoadingArticle(false);
                 router.push('/student/articles');
            });
        } else {
            toast({ title: "Error", description: "No article specified for upload.", variant: "destructive" });
            router.push('/student/articles'); // Redirect if no articleId
        }
    }, [articleId, router, toast]);

     const onSubmit = async (values: ReportFormValues) => {
        if (!articleId || !user) return;

        setIsSubmitting(true);
        try {
            const fileToUpload = values.file?.[0]; // Get the single file
            if (!fileToUpload) {
                 toast({ title: "Error", description: "No file selected for upload.", variant: "destructive"});
                 setIsSubmitting(false);
                 return;
            }

            const uploadData: ReportUploadData = {
                articleId: articleId,
                studentId: user.id,
                file: fileToUpload,
            };

            const result = await uploadReport(uploadData);

            if (result.success) {
                 toast({ title: "Report Submitted", description: `Your report for "${article?.title}" has been uploaded successfully.`, variant: "default" });

                 // Emit WebSocket event after successful upload
                 emitEvent('ReportUploaded', {
                    studentId: user.id,
                    studentName: user.name,
                    articleId: articleId,
                    articleTitle: article?.title,
                    reportId: result.reportId, // Send report ID if available
                    reportTitle: result.reportTitle, // Send report title (filename)
                 });

                 router.push('/student/articles'); // Redirect back to articles list
            } else {
                 throw new Error("Upload failed on the server.");
            }
        } catch (error) {
            console.error('Failed to upload report:', error);
            toast({ title: "Upload Failed", description: `Could not upload report. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingArticle) {
        return (
             <div className="container mx-auto py-6">
                 <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Card>
                     <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                     <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
            </div>
        );
    }

    if (!article) {
        // Error handled by toast and redirect in useEffect
        return null;
    }

  return (
      <div className="container mx-auto py-6">
         <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 inline-flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Articles
         </Button>

        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Upload Report for: {article.title}</CardTitle>
                <CardDescription>Please upload your report file (PDF or DOCX, max 5MB).</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="file"
                            render={({ field: { onChange, onBlur, name, ref } }) => ( // Use specific props
                                <FormItem>
                                    <FormLabel htmlFor="report-file">Report File</FormLabel>
                                    <FormControl>
                                        <Input
                                            id="report-file"
                                            type="file"
                                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            {...fileRef} // Use registered ref
                                            onChange={(e) => onChange(e.target.files)} // Pass FileList
                                            onBlur={onBlur}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    {form.watch('file')?.[0] && ( // Display selected file name
                                         <p className="text-sm text-muted-foreground mt-2 flex items-center">
                                            <FileText className="h-4 w-4 mr-1"/> Selected: {form.watch('file')?.[0]?.name}
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                         {/* Optional: Textarea for text-based submission
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Or Enter Text Content</FormLabel>
                                    <FormControl>
                                        <Textarea rows={10} placeholder="Type your report content here..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        */}

                        <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingArticle}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" /> Submit Report
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}


// Wrap the component with Suspense as useSearchParams requires it
export default function ReportUploadPage() {
    return (
        <Suspense fallback={<div className="container mx-auto py-6">Loading...</div>}>
            <ReportUploadContent />
        </Suspense>
    );
}
