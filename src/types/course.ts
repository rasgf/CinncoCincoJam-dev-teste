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

// Definição das categorias principais
export type CourseMainCategory = 
  'instrumentos' | 
  'teoria_musical' | 
  'producao' | 
  'canto' | 
  'composicao' | 
  'dj' | 
  'outros';

// Subcategorias para cada categoria principal
export interface CourseCategories {
  instrumentos: {
    cordas: string[]; // Guitarra, Violão, Baixo, Violino, etc.
    teclas: string[]; // Piano, Teclado, Sanfona, etc.
    sopro: string[]; // Flauta, Saxofone, Trompete, etc.
    percussao: string[]; // Bateria, Cajón, etc.
  };
  teoria_musical: {
    harmonia: string[];
    leitura: string[];
    ritmo: string[];
    solfejo: string[];
  };
  producao: {
    daw: string[]; // Ableton, FL Studio, Logic, etc.
    mixagem: string[];
    masterizacao: string[];
    gravacao: string[];
  };
  canto: {
    tecnica_vocal: string[];
    estilos: string[];
  };
  composicao: {
    songwriting: string[];
    arranjo: string[];
  };
  dj: {
    mixagem: string[];
    controladores: string[];
  };
  outros: {
    geral: string[];
  };
}

// Valores predefinidos para as categorias
export const COURSE_CATEGORIES: CourseCategories = {
  instrumentos: {
    cordas: ['guitarra', 'violao', 'baixo', 'violino', 'viola', 'cello', 'ukulele', 'cavaquinho'],
    teclas: ['piano', 'teclado', 'sanfona', 'acordeao', 'orgao'],
    sopro: ['flauta', 'saxofone', 'trompete', 'clarinete', 'trombone', 'gaita'],
    percussao: ['bateria', 'cajon', 'pandeiro', 'congas', 'bongo']
  },
  teoria_musical: {
    harmonia: ['acordes', 'progressao_harmonica', 'escalas'],
    leitura: ['partituras', 'tablatura'],
    ritmo: ['metrica', 'compassos'],
    solfejo: ['percepcao', 'ditado_musical']
  },
  producao: {
    daw: ['ableton', 'flstudio', 'logic', 'protools', 'cubase', 'reason'],
    mixagem: ['equalizacao', 'compressao', 'efeitos'],
    masterizacao: ['loudness', 'equalizacao_final'],
    gravacao: ['microfonacao', 'acustica', 'homestudio']
  },
  canto: {
    tecnica_vocal: ['respiracao', 'impostacao', 'extensao'],
    estilos: ['pop', 'rock', 'mpb', 'lirico', 'gospel', 'sertanejo', 'jazz']
  },
  composicao: {
    songwriting: ['letras', 'melodia', 'estrutura'],
    arranjo: ['instrumentacao', 'orquestracao']
  },
  dj: {
    mixagem: ['beatmatching', 'harmonic_mixing', 'loops'],
    controladores: ['cdj', 'traktor', 'serato']
  },
  outros: {
    geral: ['business', 'marketing_musical', 'historia_da_musica']
  }
};

// Interface plana para facilitar o uso em formulários
export interface FlattenedCategory {
  main: CourseMainCategory;
  sub: string;
  specific: string;
}

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
    professor_name?: string; // Nome do professor
    category?: string;
    main_category?: CourseMainCategory;
    sub_category?: string;
    specific_category?: string;
    created_at?: string;
    updated_at?: string;
    paymentType?: PaymentType;
    recurrenceInterval?: RecurrenceInterval;
    installments?: boolean;
    installmentCount?: number;
    releaseDate?: string;
    releaseTime?: string;
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
  main_category?: CourseMainCategory;
  sub_category?: string;
  specific_category?: string;
  thumbnail: File | null;
  what_will_learn: string[] | string;
  requirements: string[] | string;
  professor_id: string;
  contents?: VideoContent[];
  paymentType: PaymentType;
  recurrenceInterval?: RecurrenceInterval;
  installments?: boolean;
  installmentCount?: number;
  releaseDate?: string;
  releaseTime?: string;
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