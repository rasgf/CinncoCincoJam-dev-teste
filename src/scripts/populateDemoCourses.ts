import { getDatabase, ref, set } from 'firebase/database';
import { app } from '../config/firebase';
import { collections } from '../services/firebase';

// Inicializar o Realtime Database
const db = getDatabase(app);

// Função para adicionar professores de demonstração
const addDemoProfessors = async () => {
  console.log('Adicionando professores de demonstração...');
  
  const professors = [
    {
      id: 'prof1',
      data: {
        user_id: 'prof1',
        name: 'João Silva',
        email: 'joao.silva@exemplo.com',
        bio: 'Professor de violão com mais de 10 anos de experiência.',
        profile_image: 'https://randomuser.me/api/portraits/men/1.jpg',
        status: 'active',
        role: 'professor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    },
    {
      id: 'prof2',
      data: {
        user_id: 'prof2',
        name: 'Maria Oliveira',
        email: 'maria.oliveira@exemplo.com',
        bio: 'Especialista em teoria musical e composição.',
        profile_image: 'https://randomuser.me/api/portraits/women/1.jpg',
        status: 'active',
        role: 'professor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    },
    {
      id: 'prof3',
      data: {
        user_id: 'prof3',
        name: 'Carlos Mendes',
        email: 'carlos.mendes@exemplo.com',
        bio: 'Pianista profissional com formação no Conservatório de Música.',
        profile_image: 'https://randomuser.me/api/portraits/men/2.jpg',
        status: 'active',
        role: 'professor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  ];

  for (const professor of professors) {
    const professorRef = ref(db, `${collections.professors}/${professor.id}`);
    await set(professorRef, professor.data);
    console.log(`Professor ${professor.data.name} adicionado com sucesso!`);
  }
};

// Função para adicionar cursos de demonstração
const addDemoCourses = async () => {
  console.log('Adicionando cursos de demonstração...');
  
  const courses = [
    {
      id: 'course1',
      data: {
        title: 'Violão para Iniciantes',
        description: 'Aprenda os fundamentos do violão, desde a afinação até os primeiros acordes.',
        price: 99,
        level: 'beginner',
        status: 'published',
        category: 'Instrumentos de corda',
        thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=1470&auto=format&fit=crop',
        what_will_learn: ['Afinação do violão', 'Acordes básicos'],
        requirements: ['Ter um violão disponível'],
        professor_id: 'prof1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paymentType: 'one_time'
      }
    },
    {
      id: 'course2',
      data: {
        title: 'Teoria Musical Essencial',
        description: 'Entenda os conceitos básicos da teoria musical para melhorar sua prática musical.',
        price: 149,
        level: 'intermediate',
        status: 'published',
        category: 'Teoria Musical',
        thumbnail: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1470&auto=format&fit=crop',
        what_will_learn: ['Introdução à teoria musical', 'Escalas e modos'],
        requirements: ['Conhecimento básico de música'],
        professor_id: 'prof2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paymentType: 'one_time'
      }
    },
    {
      id: 'course3',
      data: {
        title: 'Técnicas Avançadas de Piano',
        description: 'Domine técnicas avançadas para piano e eleve sua performance musical.',
        price: 199,
        level: 'advanced',
        status: 'published',
        category: 'Instrumentos de teclas',
        thumbnail: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=1470&auto=format&fit=crop',
        what_will_learn: ['Arpejos avançados', 'Improvisação no piano'],
        requirements: ['Piano ou teclado disponível', 'Conhecimento intermediário de piano'],
        professor_id: 'prof3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paymentType: 'one_time'
      }
    }
  ];

  for (const course of courses) {
    const courseRef = ref(db, `${collections.courses}/${course.id}`);
    await set(courseRef, course.data);
    console.log(`Curso ${course.data.title} adicionado com sucesso!`);
  }
};

// Função para adicionar conteúdos dos cursos
const addCourseContents = async () => {
  console.log('Adicionando conteúdos dos cursos...');
  
  const courseContents = [
    {
      courseId: 'course1',
      contents: {
        'vid1': {
          title: 'Como Afinar o Violão',
          youtubeUrl: 'https://www.youtube.com/watch?v=5TqzeQJZQxQ',
          releaseDate: '2024-03-01',
          releaseTime: '10:00',
          order: 1
        },
        'vid2': {
          title: 'Primeiros Acordes Básicos',
          youtubeUrl: 'https://www.youtube.com/watch?v=Jg-BRpn38L8',
          releaseDate: '2024-03-02',
          releaseTime: '10:00',
          order: 2
        }
      }
    },
    {
      courseId: 'course2',
      contents: {
        'vid3': {
          title: 'Introdução à Teoria Musical',
          youtubeUrl: 'https://www.youtube.com/watch?v=6gHEIF0rT2w',
          releaseDate: '2024-03-03',
          releaseTime: '10:00',
          order: 1
        },
        'vid4': {
          title: 'Escalas e Modos',
          youtubeUrl: 'https://www.youtube.com/watch?v=ZQ3b4Q7Q5x4',
          releaseDate: '2024-03-04',
          releaseTime: '10:00',
          order: 2
        }
      }
    },
    {
      courseId: 'course3',
      contents: {
        'vid5': {
          title: 'Arpejos Avançados',
          youtubeUrl: 'https://www.youtube.com/watch?v=2X7eQe7Q5x4',
          releaseDate: '2024-03-05',
          releaseTime: '10:00',
          order: 1
        },
        'vid6': {
          title: 'Improvisação no Piano',
          youtubeUrl: 'https://www.youtube.com/watch?v=3X7eQe7Q5x4',
          releaseDate: '2024-03-06',
          releaseTime: '10:00',
          order: 2
        }
      }
    }
  ];

  for (const item of courseContents) {
    const contentsRef = ref(db, `${collections.course_contents}/${item.courseId}`);
    await set(contentsRef, item.contents);
    console.log(`Conteúdos do curso ${item.courseId} adicionados com sucesso!`);
  }
};

// Função principal para popular a plataforma
const populateDemoCourses = async () => {
  try {
    console.log('Iniciando população de dados de demonstração...');
    
    // Adicionar professores
    await addDemoProfessors();
    
    // Adicionar cursos
    await addDemoCourses();
    
    // Adicionar conteúdos dos cursos
    await addCourseContents();
    
    console.log('População de dados de demonstração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao popular dados de demonstração:', error);
  }
};

// Executar a função principal
populateDemoCourses();

export default populateDemoCourses; 