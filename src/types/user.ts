export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctorant'; // Define possible user roles
  // Add other relevant user fields if needed, e.g., domaine for doctorant
  domaine?: string;
}
