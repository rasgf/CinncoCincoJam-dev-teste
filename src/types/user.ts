export interface User {
  id: string;
  fields: {
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'professor' | 'aluno';
    status: 'active' | 'inactive';
    bio?: string;
    profile_image?: string;
    specialties?: string[];
    social_media?: string;
    bank_info?: string;
    created_at: string;
    updated_at: string;
  };
} 