import { getDatabase, ref, set, push } from 'firebase/database';
import { app } from '@/config/firebase';
import { collections } from '@/services/firebase';

// Inicializar o Realtime Database
const db = getDatabase(app);

// Função para gerar um ID aleatório
const generateId = () => Math.random().toString(36).substring(2, 15);

// Função para gerar SVG de placeholder como Data URL
function generatePlaceholderSVG(width = 500, height = 300, text = 'No Image'): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="24" 
        fill="#999" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${text}
      </text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Dados de exemplo para usuários
const sampleUsers = [
  {
    uid: 'admin123',
    email: 'admin@example.com',
    name: 'Administrador',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active',
    profile_image: 'https://randomuser.me/api/portraits/men/1.jpg',
    bio: 'Administrador do sistema',
    specialties: ['Administração', 'Gestão de Cursos'],
    social_media: 'https://linkedin.com/in/admin'
  },
  {
    uid: 'professor123',
    email: 'professor@example.com',
    name: 'João Professor',
    role: 'professor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active',
    profile_image: 'https://randomuser.me/api/portraits/men/2.jpg',
    bio: 'Professor experiente em programação',
    specialties: ['JavaScript', 'React', 'Node.js'],
    social_media: 'https://linkedin.com/in/professor'
  },
  {
    uid: 'professor456',
    email: 'maria@example.com',
    name: 'Maria Silva',
    role: 'professor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active',
    profile_image: 'https://randomuser.me/api/portraits/women/2.jpg',
    bio: 'Especialista em design e experiência do usuário',
    specialties: ['UX/UI', 'Design Thinking', 'Figma'],
    social_media: 'https://linkedin.com/in/maria'
  },
  {
    uid: 'student123',
    email: 'aluno@example.com',
    name: 'Carlos Aluno',
    role: 'aluno',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active',
    profile_image: 'https://randomuser.me/api/portraits/men/3.jpg',
    bio: 'Estudante dedicado',
    specialties: ['Desenvolvimento Web'],
    social_media: 'https://linkedin.com/in/carlos'
  },
  {
    uid: 'student456',
    email: 'ana@example.com',
    name: 'Ana Pereira',
    role: 'aluno',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active',
    profile_image: 'https://randomuser.me/api/portraits/women/3.jpg',
    bio: 'Estudante de tecnologia',
    specialties: ['Mobile Development'],
    social_media: 'https://linkedin.com/in/ana'
  }
];

// Dados de exemplo para cursos
const sampleCourses = [
  {
    title: 'Desenvolvimento Web com React',
    description: 'Aprenda a desenvolver interfaces modernas usando React',
    price: 99.90,
    level: 'intermediate',
    status: 'published',
    thumbnail: generatePlaceholderSVG(500, 300, 'React Course'),
    what_will_learn: 'Fundamentos do React,Componentes,Props e State,Hooks,Context API,Redux',
    requirements: 'HTML,CSS,JavaScript básico',
    professor_id: 'professor123',
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0]
  },
  {
    title: 'Introdução ao UX/UI Design',
    description: 'Aprenda os fundamentos de design de experiência do usuário',
    price: 79.90,
    level: 'beginner',
    status: 'published',
    thumbnail: generatePlaceholderSVG(500, 300, 'UX/UI Design'),
    what_will_learn: 'Princípios de UX,Design Thinking,Wireframing,Protótipos no Figma',
    requirements: 'Noções básicas de design,Criatividade',
    professor_id: 'professor456',
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0]
  },
  {
    title: 'JavaScript Avançado',
    description: 'Domine os conceitos avançados de JavaScript',
    price: 129.90,
    level: 'advanced',
    status: 'published',
    thumbnail: generatePlaceholderSVG(500, 300, 'JS Advanced'),
    what_will_learn: 'Closures,Promises,Async/Await,Padrões de Design',
    requirements: 'JavaScript básico,HTML,CSS',
    professor_id: 'professor123',
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0]
  },
  {
    title: 'Design Responsivo',
    description: 'Crie layouts que se adaptam a qualquer dispositivo',
    price: 69.90,
    level: 'intermediate',
    status: 'published',
    thumbnail: generatePlaceholderSVG(500, 300, 'Responsive Design'),
    what_will_learn: 'Media Queries,Flexbox,CSS Grid,Mobile First',
    requirements: 'HTML,CSS básico',
    professor_id: 'professor456',
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0]
  },
  {
    title: 'Introdução ao Node.js',
    description: 'Aprenda a criar aplicações backend com Node.js',
    price: 89.90,
    level: 'beginner',
    status: 'draft',
    thumbnail: generatePlaceholderSVG(500, 300, 'Node.js'),
    what_will_learn: 'JavaScript no servidor,Express,APIs REST,MongoDB',
    requirements: 'JavaScript básico',
    professor_id: 'professor123',
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0]
  }
];

// Dados de exemplo para as matrículas (enrollments)
const createSampleEnrollments = (courseIds: string[]) => {
  return [
    {
      student_id: 'student123',
      course_id: courseIds[0],
      status: 'active',
      enrollment_date: new Date().toISOString().split('T')[0],
      last_access: new Date().toISOString(),
      progress: 25
    },
    {
      student_id: 'student123',
      course_id: courseIds[2],
      status: 'active',
      enrollment_date: new Date().toISOString().split('T')[0],
      last_access: new Date().toISOString(),
      progress: 10
    },
    {
      student_id: 'student456',
      course_id: courseIds[1],
      status: 'active',
      enrollment_date: new Date().toISOString().split('T')[0],
      last_access: new Date().toISOString(),
      progress: 45
    },
    {
      student_id: 'student456',
      course_id: courseIds[3],
      status: 'active',
      enrollment_date: new Date().toISOString().split('T')[0],
      last_access: new Date().toISOString(),
      progress: 75
    }
  ];
};

// Função para popular os usuários
const seedUsers = async () => {
  for (const user of sampleUsers) {
    const userRef = ref(db, `${collections.users}/${user.uid}`);
    await set(userRef, user);
    console.log(`Usuário criado: ${user.name}`);
  }
};

// Função para popular os cursos
const seedCourses = async () => {
  const courseIds: string[] = [];
  
  for (const course of sampleCourses) {
    const coursesRef = ref(db, collections.courses);
    const newCourseRef = push(coursesRef);
    await set(newCourseRef, course);
    
    const courseId = newCourseRef.key as string;
    courseIds.push(courseId);
    console.log(`Curso criado: ${course.title}`);
  }
  
  return courseIds;
};

// Função para popular as matrículas
const seedEnrollments = async (courseIds: string[]) => {
  const enrollments = createSampleEnrollments(courseIds);
  
  for (const enrollment of enrollments) {
    const enrollmentsRef = ref(db, collections.enrollments);
    const newEnrollmentRef = push(enrollmentsRef);
    await set(newEnrollmentRef, enrollment);
    console.log(`Matrícula criada para: ${enrollment.student_id} - Curso: ${enrollment.course_id}`);
  }
};

// Função principal para executar o seed
export const seedFirebase = async () => {
  try {
    console.log('Iniciando população do Firebase...');
    
    // Primeiro, populamos os usuários
    await seedUsers();
    
    // Depois, os cursos e obtemos os IDs
    const courseIds = await seedCourses();
    
    // Por fim, as matrículas
    await seedEnrollments(courseIds);
    
    console.log('Firebase populado com sucesso!');
  } catch (error) {
    console.error('Erro ao popular o Firebase:', error);
  }
};

// Verificar se o script está sendo executado diretamente
if (require.main === module) {
  seedFirebase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erro no script de seed:', error);
      process.exit(1);
    });
} 