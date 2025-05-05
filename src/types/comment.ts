import type { User } from './user';

export interface Comment {
  id: string;
  reportId: string; // ID of the report this comment belongs to
  author: User; // Should always be the admin in this case
  text: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
