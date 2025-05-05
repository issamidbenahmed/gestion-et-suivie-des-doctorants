import type { User } from './user';

export interface Article {
  id: string;
  title: string;
  content: string;
  filePath?: string; // Path or URL to the attached file
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  assignedTo?: User; // The student this article is assigned to (optional)
  // Add other relevant fields if needed
}
