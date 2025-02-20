import { CourseForm } from '@/components/courses/CourseForm';

export default function NewCoursePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Criar Novo Curso</h1>
      <CourseForm />
    </div>
  );
} 