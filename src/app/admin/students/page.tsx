'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Mail } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User } from '@/types/user'; // Assuming User type exists
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { sendEmail } from '@/services/email'; // Assuming email service exists

// Mock data - replace with API calls using React Query
const mockStudents: User[] = [
  { id: '2', name: 'Alice Smith', email: 'alice@example.com', role: 'doctorant', domaine: 'Computer Science' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'doctorant', domaine: 'Physics' },
  { id: '4', name: 'Charlie Brown', email: 'charlie@example.com', role: 'doctorant', domaine: 'Mathematics' },
];

// Mock API functions - replace with actual API calls
const fetchStudents = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockStudents;
};

const createStudent = async (data: Omit<User, 'id' | 'role'> & { password?: string }): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = {
        ...data,
        id: Math.random().toString(36).substring(7), // Generate random ID
        role: 'doctorant',
    };
    mockStudents.push(newUser); // Add to mock data (in real app, backend handles this)
    console.log('Created student (mock):', newUser);
    // Simulate sending email manually
     try {
       await sendEmail({
         to: newUser.email,
         subject: 'Your Academic Collab Account Credentials',
         body: `Hello ${newUser.name},\n\nYour account has been created.\nEmail: ${newUser.email}\nPassword: ${data.password}\n\nPlease log in at [Your App URL].\n\nRegards,\nYour Supervisor`,
       });
       console.log(`Simulated sending credentials email to ${newUser.email}`);
     } catch (emailError) {
       console.error(`Failed to simulate sending email to ${newUser.email}:`, emailError);
       // Handle email sending failure - maybe notify admin
     }
    return newUser;
};

const updateStudent = async (id: string, data: Partial<Omit<User, 'id' | 'role'>>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockStudents.findIndex(s => s.id === id);
    if (index !== -1) {
        mockStudents[index] = { ...mockStudents[index], ...data };
        console.log('Updated student (mock):', mockStudents[index]);
        return mockStudents[index];
    }
    throw new Error('Student not found');
};

const deleteStudent = async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockStudents.findIndex(s => s.id === id);
    if (index !== -1) {
        console.log('Deleting student (mock):', mockStudents[index]);
        mockStudents.splice(index, 1);
    } else {
        throw new Error('Student not found');
    }
};


// Validation Schema
const studentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  domaine: z.string().min(2, { message: "Domain is required." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(), // Optional for edit
});

type StudentFormValues = z.infer<typeof studentSchema>;


export default function ManageStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
   const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  const form = useForm<StudentFormValues>({
      resolver: zodResolver(studentSchema),
      defaultValues: {
        name: '',
        email: '',
        domaine: '',
        password: '',
      },
  });


  useEffect(() => {
    fetchStudents().then(data => {
      setStudents(data);
      setIsLoading(false);
    });
  }, []);

   const handleOpenModal = (student: User | null = null) => {
    setEditingStudent(student);
    if (student) {
      form.reset({
        name: student.name,
        email: student.email,
        domaine: student.domaine || '',
        password: '', // Clear password field for editing
      });
    } else {
      form.reset(); // Clear form for new student
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    form.reset();
  };

   const openDeleteDialog = (student: User) => {
        setStudentToDelete(student);
        setIsDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setStudentToDelete(null);
        setIsDeleteDialogOpen(false);
    };

   const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;
        try {
            await deleteStudent(studentToDelete.id);
            setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
            toast({ title: "Student Deleted", description: `${studentToDelete.name} has been removed.` });
            closeDeleteDialog();
        } catch (error) {
            console.error('Failed to delete student:', error);
            toast({ title: "Error", description: "Could not delete student.", variant: "destructive" });
        }
    };

  const onSubmit = async (values: StudentFormValues) => {
    try {
        const dataToSubmit: Partial<StudentFormValues> & Pick<StudentFormValues, 'name' | 'email' | 'domaine'> = {
             name: values.name,
             email: values.email,
             domaine: values.domaine,
        };
        // Include password only if it's provided (and it's a new user or password change is intended)
         if (values.password) {
            dataToSubmit.password = values.password;
         }

         if (editingStudent) {
             // Update existing student
             if (!values.password) delete dataToSubmit.password; // Don't send empty password if not changing
             const updated = await updateStudent(editingStudent.id, dataToSubmit);
             setStudents(prev => prev.map(s => (s.id === updated.id ? updated : s)));
             toast({ title: "Student Updated", description: `${updated.name}'s details have been updated.` });
         } else {
            // Create new student - require password
             if (!values.password) {
                 form.setError("password", { type: "manual", message: "Password is required for new students." });
                 return; // Stop submission if password missing for new user
             }
             const created = await createStudent(dataToSubmit as StudentFormValues); // Cast needed as password is now required logic
             setStudents(prev => [...prev, created]);
             toast({ title: "Student Created", description: `${created.name} has been added and credentials email sent (simulated).`, variant: 'default' });
         }
         handleCloseModal();
    } catch (error) {
      console.error('Failed to save student:', error);
       toast({ title: "Error", description: `Could not ${editingStudent ? 'update' : 'create'} student. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    }
  };


  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Students</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>View, add, edit, or remove student accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading students...</p> // Replace with Skeleton loader
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.domaine || '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenModal(student)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={async () => {
                              // Simulate resending email
                              try {
                                   await sendEmail({
                                       to: student.email,
                                       subject: 'Academic Collab Account Credentials Reminder',
                                       body: `Hello ${student.name},\n\nThis is a reminder of your account details.\nEmail: ${student.email}\n\nPlease contact your supervisor if you have forgotten your password.\n\nRegards,\nYour Supervisor`,
                                   });
                                   toast({ title: "Email Sent (Simulated)", description: `Credentials reminder sent to ${student.email}.` });
                               } catch (emailError) {
                                   console.error(`Failed to simulate sending email to ${student.email}:`, emailError);
                                   toast({ title: "Email Error", description: "Could not simulate sending email.", variant: "destructive" });
                               }
                           }}>
                               <Mail className="mr-2 h-4 w-4" />
                               Resend Credentials (Simulated)
                           </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => openDeleteDialog(student)}>
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
           {students.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground py-4">No students found.</p>
           )}
        </CardContent>
      </Card>

        {/* Add/Edit Student Modal */}
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription>
              {editingStudent ? 'Update the details for this student.' : 'Enter the details for the new student. Credentials will be sent manually via email (simulated).'}
            </DialogDescription>
          </DialogHeader>
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Name</FormLabel>
                        <FormControl className="col-span-3">
                          <Input {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 text-right" />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Email</FormLabel>
                        <FormControl className="col-span-3">
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 text-right" />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="domaine"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Domain</FormLabel>
                        <FormControl className="col-span-3">
                          <Input placeholder="e.g., Computer Science" {...field} />
                        </FormControl>
                        <FormMessage className="col-span-4 text-right" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Password</FormLabel>
                        <FormControl className="col-span-3">
                           <Input type="password" placeholder={editingStudent ? 'Leave blank to keep current' : 'Required'} {...field} />
                        </FormControl>
                         <FormMessage className="col-span-4 text-right" />
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
                        Are you sure you want to delete the student "{studentToDelete?.name}"? This action cannot be undone.
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
