'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2, File, UserCheck, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Article } from '@/types/article';
import type { User } from '@/types/user';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/context/WebSocketContext'; // Import WebSocket context

// Mock data - replace with API calls using React Query
const mockStudentsData: User[] = [
  { id: '2', name: 'Alice Smith', email: 'alice@example.com', role: 'doctorant', domaine: 'Computer Science' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'doctorant', domaine: 'Physics' },
  { id: '4', name: 'Charlie Brown', email: 'charlie@example.com', role: 'doctorant', domaine: 'Mathematics' },
];

const mockArticles: Article[] = [
  { id: 'art1', title: 'Introduction to Quantum Computing', content: 'A comprehensive overview...', filePath: '/files/quantum_intro.pdf', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), assignedTo: mockStudentsData[0] },
  { id: 'art2', title: 'Deep Learning Architectures', content: 'Exploring CNNs, RNNs, and Transformers.', filePath: '/files/deep_learning.pdf', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() }, // No assigned student
   { id: 'art3', title: 'String Theory Basics', content: 'Fundamental concepts of string theory.', filePath: '/files/string_theory.pdf', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString(), assignedTo: mockStudentsData[1] },
];


// Mock API functions
const fetchArticles = async (): Promise<Article[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
   // Simulate fetching student details along with articles if backend provides it
   return mockArticles.map(article => ({
     ...article,
     assignedTo: article.assignedTo ? mockStudentsData.find(s => s.id === article.assignedTo?.id) : undefined,
   }));
};

const fetchStudentsForAssignment = async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStudentsData;
}

const createArticle = async (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'> & { file?: File }): Promise<Article> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Simulate file upload - in real app, upload to backend/storage and get URL/path
    const filePath = data.file ? `/files/mock_${data.file.name}` : undefined;
    const newArticle: Article = {
        ...data,
        id: `art${Math.random().toString(36).substring(2, 5)}`,
        filePath: filePath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockArticles.push(newArticle);
    console.log('Created article (mock):', newArticle);
    return newArticle;
};

const updateArticle = async (id: string, data: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'>> & { file?: File | null }): Promise<Article> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockArticles.findIndex(a => a.id === id);
    if (index !== -1) {
        let filePath = mockArticles[index].filePath;
        if (data.file === null) { // Explicitly removing file
            filePath = undefined;
        } else if (data.file) { // Uploading a new file
            // Simulate file upload
            filePath = `/files/mock_${data.file.name}`;
        }
        // Remove file property before merging data
        const { file, ...updateData } = data;

        mockArticles[index] = { ...mockArticles[index], ...updateData, filePath: filePath, updatedAt: new Date().toISOString() };
        console.log('Updated article (mock):', mockArticles[index]);
        return mockArticles[index];
    }
    throw new Error('Article not found');
};


const deleteArticle = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockArticles.findIndex(a => a.id === id);
    if (index !== -1) {
        console.log('Deleting article (mock):', mockArticles[index]);
        mockArticles.splice(index, 1);
    } else {
        throw new Error('Article not found');
    }
};

const assignArticle = async (articleId: string, studentId: string | null): Promise<Article> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const articleIndex = mockArticles.findIndex(a => a.id === articleId);
    if (articleIndex === -1) throw new Error('Article not found');

    const student = studentId ? mockStudentsData.find(s => s.id === studentId) : undefined;
    mockArticles[articleIndex].assignedTo = student;
    mockArticles[articleIndex].updatedAt = new Date().toISOString();
    console.log(`Assigned article ${articleId} to student ${studentId} (mock)`);

    // Return the updated article, including the student details
    return {
        ...mockArticles[articleIndex],
        assignedTo: student // Ensure the returned object has the resolved student data
    };
};


// Validation Schema
const articleSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  content: z.string().min(10, { message: "Content must be at least 10 characters." }),
  file: z.instanceof(File).optional().nullable(), // Allow File, undefined, or null
});

type ArticleFormValues = z.infer<typeof articleSchema>;


export default function ManageArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const { toast } = useToast();
  const { emitEvent } = useWebSocket(); // Get emit function

  const form = useForm<ArticleFormValues>({
      resolver: zodResolver(articleSchema),
      defaultValues: {
        title: '',
        content: '',
        file: undefined,
      },
  });
  const fileRef = form.register("file");


  useEffect(() => {
    Promise.all([fetchArticles(), fetchStudentsForAssignment()]).then(([articleData, studentData]) => {
      setArticles(articleData);
      setStudents(studentData);
      setIsLoading(false);
    }).catch(error => {
        console.error("Failed to load data:", error);
        toast({ title: "Error", description: "Could not load articles or students.", variant: "destructive" });
        setIsLoading(false);
    });
  }, [toast]); // Added toast dependency


   const handleOpenModal = (article: Article | null = null) => {
    setEditingArticle(article);
    if (article) {
      form.reset({
        title: article.title,
        content: article.content,
        file: undefined, // Reset file input, handle existing file display separately
      });
    } else {
      form.reset();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    form.reset();
  };

   const openDeleteDialog = (article: Article) => {
        setArticleToDelete(article);
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setArticleToDelete(null);
        setIsDeleteDialogOpen(false);
    };

   const handleDeleteConfirm = async () => {
        if (!articleToDelete) return;
        try {
            await deleteArticle(articleToDelete.id);
            setArticles(prev => prev.filter(a => a.id !== articleToDelete.id));
            toast({ title: "Article Deleted", description: `"${articleToDelete.title}" has been removed.` });
            closeDeleteDialog();
        } catch (error) {
            console.error('Failed to delete article:', error);
            toast({ title: "Error", description: "Could not delete article.", variant: "destructive" });
        }
    };

    const handleAssign = async (articleId: string, studentId: string | null) => {
        try {
            const updatedArticle = await assignArticle(articleId, studentId);

             // Update local state with resolved student data
            setArticles(prev => prev.map(a => (a.id === articleId ? updatedArticle : a)));

            const studentName = updatedArticle.assignedTo ? updatedArticle.assignedTo.name : 'nobody';
            toast({
                title: "Article Assignment Updated",
                description: `"${updatedArticle.title}" assigned to ${studentName}.`
            });

            // Emit WebSocket event only if assigning to a specific student
             if (studentId && updatedArticle.assignedTo) {
               emitEvent('ArticleAssigned', {
                 studentId: studentId,
                 articleId: articleId,
                 articleTitle: updatedArticle.title,
                 // Include any other relevant data for the student notification
               });
             }

        } catch (error) {
            console.error('Failed to assign article:', error);
            toast({ title: "Error", description: "Could not assign article.", variant: "destructive" });
        }
    };


  const onSubmit = async (values: ArticleFormValues) => {
     const dataToSubmit: ArticleFormValues = {
            title: values.title,
            content: values.content,
            file: values.file?.[0] // react-hook-form wraps file input value in FileList
        };

    try {
         if (editingArticle) {
             const updated = await updateArticle(editingArticle.id, {
                 ...dataToSubmit,
                 // Signal removal if file is undefined/null and there was an existing file
                  file: dataToSubmit.file === undefined && editingArticle.filePath ? null : dataToSubmit.file,
             });
             setArticles(prev => prev.map(a => (a.id === updated.id ? updated : a)));
             toast({ title: "Article Updated", description: `"${updated.title}" has been updated.` });
         } else {
             const created = await createArticle(dataToSubmit);
             setArticles(prev => [...prev, created]);
             toast({ title: "Article Created", description: `"${created.title}" has been added.` });
         }
         handleCloseModal();
    } catch (error) {
      console.error('Failed to save article:', error);
       toast({ title: "Error", description: `Could not ${editingArticle ? 'update' : 'create'} article.`, variant: "destructive" });
    }
  };

  const currentFile = editingArticle?.filePath ? editingArticle.filePath.split('/').pop() : null;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Articles</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article List</CardTitle>
          <CardDescription>View, add, edit, assign, or remove articles.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading articles...</p> // Replace with Skeleton loader
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                     <TableCell>
                      {article.filePath ? (
                        <a href={article.filePath} target="_blank" rel="noreferrer" className="flex items-center text-primary hover:underline">
                          <File className="mr-1 h-4 w-4" /> {article.filePath.split('/').pop()} <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                       {article.assignedTo ? (
                            <Badge variant="outline">{article.assignedTo.name}</Badge>
                        ) : (
                            <Badge variant="secondary">Unassigned</Badge>
                        )}
                    </TableCell>
                    <TableCell>{new Date(article.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenModal(article)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Assign To
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                        value={article.assignedTo?.id || 'unassigned'}
                                        onValueChange={(studentId) => handleAssign(article.id, studentId === 'unassigned' ? null : studentId)}
                                    >
                                        <DropdownMenuRadioItem value="unassigned">
                                            Unassigned
                                        </DropdownMenuRadioItem>
                                        {students.map((student) => (
                                            <DropdownMenuRadioItem key={student.id} value={student.id}>
                                                {student.name}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                           <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => openDeleteDialog(article)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
            {articles.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground py-4">No articles found.</p>
            )}
        </CardContent>
      </Card>

      {/* Add/Edit Article Modal */}
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]"> {/* Increased width for file input */}
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Edit Article' : 'Add New Article'}</DialogTitle>
            <DialogDescription>
              {editingArticle ? 'Update the details for this article.' : 'Enter the details for the new article.'}
            </DialogDescription>
          </DialogHeader>
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right pt-1.5">Title</FormLabel> {/* Adjusted alignment */}
                        <FormControl className="col-span-3">
                          <Input {...field} />
                        </FormControl>
                        <FormMessage className="col-span-3 col-start-2" /> {/* Message below input */}
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-start gap-4"> {/* Changed to items-start */}
                        <FormLabel className="text-right pt-1.5">Content</FormLabel> {/* Adjusted alignment */}
                        <FormControl className="col-span-3">
                          <Textarea rows={5} {...field} />
                        </FormControl>
                         <FormMessage className="col-span-3 col-start-2" /> {/* Message below input */}
                      </FormItem>
                    )}
                  />
                    <FormField
                      control={form.control}
                      name="file"
                      render={({ field: { onChange, onBlur, name, ref } }) => ( // Destructure field props
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">File (PDF)</FormLabel>
                          <div className="col-span-3 space-y-2">
                            <FormControl>
                               <Input
                                type="file"
                                accept=".pdf"
                                {...fileRef} // Use registered ref
                                onChange={(e) => onChange(e.target.files)} // Pass FileList to react-hook-form
                                onBlur={onBlur}
                              />
                            </FormControl>
                             {currentFile && !form.watch('file')?.[0] && ( // Show current file if no new file is selected
                                <div className="text-sm text-muted-foreground flex items-center justify-between">
                                    <span>Current: {currentFile}</span>
                                     <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => {
                                            form.setValue('file', null); // Signal file removal
                                            setEditingArticle(prev => prev ? {...prev, filePath: undefined } : null); // Update visual state
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            )}
                            {form.watch('file')?.[0] && ( // Show selected file name
                                <p className="text-sm text-muted-foreground">Selected: {form.watch('file')?.[0]?.name}</p>
                            )}
                           <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />


                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </form>
           </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the article "{articleToDelete?.title}"? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={closeDeleteDialog}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
