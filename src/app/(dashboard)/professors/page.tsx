'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProfessors } from '@/services/professors';

interface Professor {
  id: string;
  fields: {
    user_id: string;
    name: string;
    bio: string;
    specialties: string[];
    profile_image?: string;
    status: string;
  };
}

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    try {
      const data = await getProfessors();
      setProfessors(data.filter(prof => prof.fields.status === 'approved'));
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    } finally {
      setLoading(false);
    }
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
      <h1 className="text-2xl font-bold text-gray-900">Professores</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professors.map((professor) => (
          <Link 
            key={professor.id} 
            href={`/professors/${professor.id}`}
            className="block"
          >
            <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    {professor.fields.profile_image ? (
                      <Image
                        src={professor.fields.profile_image}
                        alt={professor.fields.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {professor.fields.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {professor.fields.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500 line-clamp-3">
                  {professor.fields.bio}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 