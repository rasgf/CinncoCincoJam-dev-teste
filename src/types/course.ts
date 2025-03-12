export interface VideoContent {
  id: string;
  title: string;
  youtubeUrl: string;
  releaseDate: string;
  releaseTime: string;
  order: number;
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type PaymentType = 'one_time' | 'recurring';
export type RecurrenceInterval = 'monthly' | 'quarterly' | 'biannual' | 'annual';

export interface Course {
  id: string;
  fields: {
    title: string;
    description: string;
    price: number;
    level: CourseLevel | string;
    status: CourseStatus | string;
    thumbnail?: string;
    what_will_learn?: string;
    requirements?: string;
    professor_id?: string;
    category?: string;
    created_at?: string;
    updated_at?: string;
    paymentType?: PaymentType;
    recurrenceInterval?: RecurrenceInterval;
    installments?: boolean;
    installmentCount?: number;
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

export interface CreateCourseData {
  title: string;
  description: string;
  price: number;
  level: CourseLevel | string;
  status: CourseStatus | string;
  category?: string;
  thumbnail: File | null;
  what_will_learn: string[] | string;
  requirements: string[] | string;
  professor_id: string;
  contents?: VideoContent[];
  paymentType: PaymentType;
  recurrenceInterval?: RecurrenceInterval;
  installments?: boolean;
  installmentCount?: number;
}

export interface ProfessorStats {
  totalStudents: number;
  activeCourses: number;
  monthlyRevenue: number;
  studentsTrend: {
    value: number;
    isPositive: boolean;
  };
  revenueTrend: {
    value: number;
    isPositive: boolean;
  };
}

export interface CourseCardProps {
  title: string;
  description: string;
  thumbnail?: string;
  progress?: number;
  professor?: string;
  price?: number;
  level?: string;
  status?: string;
  what_will_learn?: string;
  requirements?: string;
} 