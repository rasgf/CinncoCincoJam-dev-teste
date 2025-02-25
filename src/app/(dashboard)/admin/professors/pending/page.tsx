'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { getPendingProfessors, approveProfessor, rejectProfessor } from '@/services/firebase-professors-admin';

interface PendingProfessor {
  id: string;
  fields: {
    user_id: string;
    name: string;
    email: string;
    bio: string;
    specialties: string[];
    created_at: string;
  };
}

export default function PendingProfessorsPage() {
  const [professors, setProfessors] = useState<PendingProfessor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    try {
      const data = await getPendingProfessors();
      setProfessors(data);
    } catch (error) {
      console.error('Error loading pending professors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (professorId: string) => {
    try {
      await approveProfessor(professorId);
      setProfessors(professors.filter(p => p.id !== professorId));
    } catch (error) {
      console.error('Error approving professor:', error);
    }
  };

  const handleReject = async (professorId: string) => {
    try {
      await rejectProfessor(professorId);
      setProfessors(professors.filter(p => p.id !== professorId));
    } catch (error) {
      console.error('Error rejecting professor:', error);
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
      <h1 className="text-2xl font-bold text-gray-900">Professores Pendentes</h1>

      {professors.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
          Não há professores pendentes de aprovação.
        </div>
      ) : (
        <div className="grid gap-6">
          {professors.map((professor) => (
            <div key={professor.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {professor.fields.name}
                  </h2>
                  <p className="text-sm text-gray-500">{professor.fields.email}</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleReject(professor.id)}
                    className="!bg-red-50 !text-red-600 hover:!bg-red-100"
                  >
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => handleApprove(professor.id)}
                  >
                    Aprovar
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">Bio</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {professor.fields.bio}
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">Especialidades</h3>
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

              <div className="mt-4 text-sm text-gray-500">
                Solicitado em: {new Date(professor.fields.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 