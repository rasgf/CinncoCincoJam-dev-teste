export interface User {
  id: string;
  fields: {
    uid: string;
    email: string;
    name: string;
    role: string;
    status: string;
    created_at: string;
  };
} 