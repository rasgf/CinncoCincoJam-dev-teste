'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CourseCard from '@/components/courses/CourseCard';
import { getAllPublishedCourses } from '@/services/firebase-courses';
import { getCourseAverageRating } from '@/services/firebase-ratings';
import { StarRating } from '@/components/common/StarRating';
import { Course, COURSE_CATEGORIES, CourseMainCategory } from '@/types/course';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesWithRatings, setCoursesWithRatings] = useState<(Course & { rating?: number, ratingCount?: number })[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<(Course & { rating?: number, ratingCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Estados para os filtros
  const [selectedMainCategory, setSelectedMainCategory] = useState<CourseMainCategory | ''>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedSpecificCategory, setSelectedSpecificCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Opções para os filtros
  const mainCategories = Object.keys(COURSE_CATEGORIES) as CourseMainCategory[];
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [specificCategories, setSpecificCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);
  
  // Atualizar as subcategorias quando a categoria principal mudar
  useEffect(() => {
    if (selectedMainCategory) {
      const subCats = Object.keys(COURSE_CATEGORIES[selectedMainCategory]);
      setSubCategories(subCats);
      setSelectedSubCategory('');
      setSelectedSpecificCategory('');
    } else {
      setSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [selectedMainCategory]);
  
  // Atualizar as categorias específicas quando a subcategoria mudar
  useEffect(() => {
    if (selectedMainCategory && selectedSubCategory) {
      const specificCats = COURSE_CATEGORIES[selectedMainCategory][selectedSubCategory as keyof (typeof COURSE_CATEGORIES)[typeof selectedMainCategory]];
      setSpecificCategories(specificCats);
      setSelectedSpecificCategory('');
    } else {
      setSpecificCategories([]);
      setSelectedSpecificCategory('');
    }
  }, [selectedMainCategory, selectedSubCategory]);
  
  // Aplicar filtros quando os valores mudarem
  useEffect(() => {
    if (!coursesWithRatings.length) return;
    
    let filtered = [...coursesWithRatings];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.fields.title.toLowerCase().includes(searchLower) || 
        course.fields.description.toLowerCase().includes(searchLower) || 
        (course.fields.professor_name && course.fields.professor_name.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtrar por categoria principal
    if (selectedMainCategory) {
      filtered = filtered.filter(course => course.fields.main_category === selectedMainCategory);
      
      // Filtrar por subcategoria se selecionada
      if (selectedSubCategory) {
        filtered = filtered.filter(course => course.fields.sub_category === selectedSubCategory);
        
        // Filtrar por categoria específica se selecionada
        if (selectedSpecificCategory) {
          filtered = filtered.filter(course => course.fields.specific_category === selectedSpecificCategory);
        }
      }
    }
    
    setFilteredCourses(filtered);
  }, [coursesWithRatings, selectedMainCategory, selectedSubCategory, selectedSpecificCategory, searchTerm]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getAllPublishedCourses();
      setCourses(data);
      
      // Buscar avaliações para cada curso
      const coursesWithRatingPromises = data.map(async (course) => {
        try {
          const ratingData = await getCourseAverageRating(course.id);
          return {
            ...course,
            rating: ratingData.average,
            ratingCount: ratingData.count
          };
        } catch (error) {
          console.error(`Erro ao carregar avaliações para o curso ${course.id}:`, error);
          return course;
        }
      });
      
      const enrichedCourses = await Promise.all(coursesWithRatingPromises);
      setCoursesWithRatings(enrichedCourses);
      setFilteredCourses(enrichedCourses);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (id: string) => {
    console.log('Clicou no curso:', id);
    router.push(`/courses/${id}`);
  };
  
  const handleClearFilters = () => {
    setSelectedMainCategory('');
    setSelectedSubCategory('');
    setSelectedSpecificCategory('');
    setSearchTerm('');
  };
  
  const formatCategoryName = (name: string) => {
    return name.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cursos Disponíveis</h1>
        
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/20 p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded ${
              view === 'grid' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title="Visualização em grade"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded ${
              view === 'list' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title="Visualização em lista"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Filtrar Cursos</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, descrição, professor..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            
            {/* Categoria Principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
              <select
                value={selectedMainCategory}
                onChange={(e) => setSelectedMainCategory(e.target.value as CourseMainCategory | '')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Todas as categorias</option>
                {mainCategories.map((category) => (
                  <option key={category} value={category}>
                    {formatCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Subcategoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategoria</label>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={!selectedMainCategory}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              >
                <option value="">Todas as subcategorias</option>
                {subCategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {formatCategoryName(subcategory)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Categoria Específica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instrumento/Tema</label>
              <select
                value={selectedSpecificCategory}
                onChange={(e) => setSelectedSpecificCategory(e.target.value)}
                disabled={!selectedSubCategory}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              >
                <option value="">Todos os instrumentos/temas</option>
                {specificCategories.map((specificCategory) => (
                  <option key={specificCategory} value={specificCategory}>
                    {formatCategoryName(specificCategory)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Botão para limpar filtros */}
        <div className="flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
        </h2>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Nenhum curso encontrado com os filtros selecionados.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Limpar Filtros
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div 
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="cursor-pointer"
            >
              <CourseCard
                title={course.fields.title}
                description={course.fields.description}
                thumbnail={course.fields.thumbnail}
                professor={course.fields.professor_name}
                price={course.fields.price}
                level={course.fields.level}
                rating={course.rating}
                ratingCount={course.ratingCount}
                paymentType={course.fields.paymentType}
                recurrenceInterval={course.fields.recurrenceInterval}
                installments={course.fields.installments}
                installmentCount={course.fields.installmentCount}
                mainCategory={course.fields.main_category}
                subCategory={course.fields.sub_category}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {filteredCourses.map((course) => (
            <div 
              key={course.id}
              className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => handleCourseClick(course.id)}
            >
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {course.fields.title}
                </h3>
                
                {/* Categoria e professor */}
                <div className="flex items-center mt-1 mb-1 text-sm">
                  {course.fields.main_category && (
                    <span className="mr-3 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                      {formatCategoryName(course.fields.main_category)}
                      {course.fields.sub_category && ` | ${formatCategoryName(course.fields.sub_category)}`}
                    </span>
                  )}
                  
                  {course.fields.professor_name && (
                    <span className="text-gray-500 dark:text-gray-400 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Prof. {course.fields.professor_name}
                    </span>
                  )}
                </div>
                
                {course.rating > 0 && (
                  <div className="flex items-center mt-1 mb-1">
                    <StarRating initialRating={course.rating} readOnly size="sm" />
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {course.rating.toFixed(1)} ({course.ratingCount})
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                  {course.fields.description}
                </p>
              </div>
              <div className="ml-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                {course.fields.price ? (
                  <>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(course.fields.price)}
                    {course.fields.paymentType === 'recurring' && course.fields.recurrenceInterval && (
                      <span className="ml-1 text-xs text-gray-500">
                        /{course.fields.recurrenceInterval === 'monthly' ? 'mês' : 
                          course.fields.recurrenceInterval === 'quarterly' ? 'trimestre' :
                          course.fields.recurrenceInterval === 'biannual' ? 'semestre' : 'ano'}
                      </span>
                    )}
                    {course.fields.paymentType === 'one_time' && course.fields.installments && course.fields.installmentCount && (
                      <span className="ml-1 text-xs text-gray-500">
                        em até {course.fields.installmentCount}x
                      </span>
                    )}
                  </>
                ) : (
                  'Gratuito'
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 