export interface VideoContent {
  id: string;
  title: string;
  youtubeUrl: string;
  releaseDate: string;
  releaseTime: string;
  order: number;
}

export interface Course {
  id: string;
  fields: {
    title: string;
    description: string;
    price: number;
    category: string;
    level: string;
    status: string;
    thumbnail?: string;
    what_will_learn?: string[];
    requirements?: string[];
    professor_id: string;
    created_at: string;
    updated_at: string;
  };
}

export interface Professor {
  id: string;
  fields: {
    user_id: string;
    name: string;
    email: string;
    bio?: string;
    profile_image?: string;
    status: 'pending' | 'active' | 'inactive';
    role: 'professor';
    created_at: string;
    updated_at: string;
  };
} 