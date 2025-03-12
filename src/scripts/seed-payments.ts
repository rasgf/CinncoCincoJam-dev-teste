import { getDatabase, ref, set, push, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDnbDN5aCBB6_sHwZG-l1dRzlWxQfWQZWE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cincocincojam.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://cincocincojam-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cincocincojam",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cincocincojam.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1045382662201",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1045382662201:web:f4c8bf0e3b4c73e3c6d29c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LFCFVR9RQE"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Coleções do Firebase
const collections = {
  users: 'users',
  professors: 'professors',
  courses: 'courses',
  enrollments: 'enrollments',
  affiliates: 'affiliates',
  settings: 'settings',
  lesson_progress: 'lesson_progress',
  course_contents: 'courseContents'
};

interface SamplePayment {
  course_id: string;
  user_id: string;
  professor_id: string;
  payment_status: 'paid' | 'pending' | 'processing' | 'overdue';
  payment_date?: string;
  payment_due_date?: string;
  payment_method?: string;
  payment_id?: string;
  amount?: number;
  created_at: string;
  updated_at: string;
}

// Função para gerar uma data aleatória nos últimos 3 meses
const getRandomDate = (isPast = true) => {
  const now = new Date();
  const monthsAgo = isPast ? 3 : -1; // Se for passado, até 3 meses atrás, se for futuro, até 1 mês à frente
  const minDate = new Date();
  minDate.setMonth(now.getMonth() - monthsAgo);
  
  const randomTimestamp = minDate.getTime() + Math.random() * (now.getTime() - minDate.getTime());
  const date = new Date(randomTimestamp);
  
  return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

// Função para gerar um status de pagamento aleatório
const getRandomStatus = (): 'paid' | 'pending' | 'processing' | 'overdue' => {
  const statuses: ('paid' | 'pending' | 'processing' | 'overdue')[] = ['paid', 'pending', 'processing', 'overdue'];
  const weights = [0.5, 0.2, 0.1, 0.2]; // 50% pagos, 20% pendentes, 10% processando, 20% atrasados
  
  const random = Math.random();
  let sum = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    sum += weights[i];
    if (random < sum) {
      return statuses[i];
    }
  }
  
  return 'paid';
};

// Função para gerar um método de pagamento aleatório
const getRandomPaymentMethod = (): string => {
  const methods = ['credit_card', 'debit_card', 'bank_transfer', 'pix', 'boleto'];
  return methods[Math.floor(Math.random() * methods.length)];
};

// Função para criar pagamentos de exemplo
const createSamplePayments = async () => {
  try {
    console.log('Iniciando criação de pagamentos de exemplo...');
    
    // Buscar cursos existentes
    const coursesRef = ref(db, collections.courses);
    console.log('Buscando cursos...');
    const coursesSnapshot = await get(coursesRef);
    
    if (!coursesSnapshot.exists()) {
      console.log('Nenhum curso encontrado. Crie cursos primeiro.');
      return;
    }
    
    // Buscar usuários existentes (alunos)
    const usersRef = ref(db, collections.users);
    console.log('Buscando usuários...');
    const usersSnapshot = await get(usersRef);
    
    if (!usersSnapshot.exists()) {
      console.log('Nenhum usuário encontrado. Crie usuários primeiro.');
      return;
    }
    
    // Coletar cursos e usuários
    const courses: { id: string; professor_id: string }[] = [];
    const students: string[] = [];
    
    console.log('Processando cursos...');
    coursesSnapshot.forEach((childSnapshot) => {
      const courseData = childSnapshot.val();
      courses.push({
        id: childSnapshot.key as string,
        professor_id: courseData.professor_id
      });
    });
    
    console.log('Processando usuários...');
    usersSnapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (userData.role === 'aluno') {
        students.push(childSnapshot.key as string);
      }
    });
    
    if (courses.length === 0) {
      console.log('Nenhum curso encontrado.');
      return;
    }
    
    if (students.length === 0) {
      console.log('Nenhum aluno encontrado.');
      return;
    }
    
    console.log(`Encontrados ${courses.length} cursos e ${students.length} alunos.`);
    
    // Criar matrículas com pagamentos
    const totalEnrollments = 10; // Reduzindo para 10 para teste
    const enrollments: SamplePayment[] = [];
    
    console.log(`Criando ${totalEnrollments} matrículas com pagamentos...`);
    for (let i = 0; i < totalEnrollments; i++) {
      const courseIndex = Math.floor(Math.random() * courses.length);
      const studentIndex = Math.floor(Math.random() * students.length);
      
      const course = courses[courseIndex];
      const student = students[studentIndex];
      
      console.log(`Criando matrícula ${i+1}/${totalEnrollments}: Curso ${course.id}, Aluno ${student}`);
      
      const status = getRandomStatus();
      const now = new Date().toISOString();
      
      const enrollment: SamplePayment = {
        course_id: course.id,
        user_id: student,
        professor_id: course.professor_id,
        payment_status: status,
        created_at: now,
        updated_at: now
      };
      
      // Adicionar campos específicos com base no status
      if (status === 'paid') {
        enrollment.payment_date = getRandomDate(true); // Data no passado
        enrollment.payment_method = getRandomPaymentMethod();
        enrollment.payment_id = `pay_${Math.random().toString(36).substring(2, 15)}`;
      } else if (status === 'pending' || status === 'processing') {
        enrollment.payment_due_date = getRandomDate(false); // Data no futuro
      } else if (status === 'overdue') {
        enrollment.payment_due_date = getRandomDate(true); // Data no passado
      }
      
      enrollments.push(enrollment);
    }
    
    // Salvar as matrículas no banco de dados
    console.log('Salvando matrículas no banco de dados...');
    for (const enrollment of enrollments) {
      const enrollmentsRef = ref(db, collections.enrollments);
      const newEnrollmentRef = push(enrollmentsRef);
      await set(newEnrollmentRef, enrollment);
      console.log(`Matrícula criada: ${newEnrollmentRef.key}`);
    }
    
    console.log(`${enrollments.length} matrículas com pagamentos foram criadas com sucesso.`);
  } catch (error) {
    console.error('Erro ao criar pagamentos de exemplo:', error);
  }
};

// Executar o script
createSamplePayments()
  .then(() => {
    console.log('Script concluído com sucesso.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar o script:', error);
    process.exit(1);
  }); 