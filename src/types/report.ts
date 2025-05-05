import type { User } from './user';
import type { Article } from './article';
import type { Comment } from './comment';

export interface Report {
  id: string;
  article: Article; // The article this report is for
  student: User; // The student who submitted the report
  content?: string; // Text content if not a file
  filePath?: string; // Path or URL to the uploaded file (PDF/docx)
  comments: Comment[]; // Comments left by the admin
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Add other relevant fields if needed
}
