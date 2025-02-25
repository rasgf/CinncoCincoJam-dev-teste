// Este arquivo agora serve como um stub para Airtable
// As funções estão sendo migradas para o Firebase

import { FieldSet } from 'airtable';

interface MockTable {
  select: () => { firstPage: () => Promise<any[]> };
  create: () => Promise<any[]>;
  update: () => Promise<any[]>;
  destroy: () => Promise<any[]>;
}

// Mock implementation para evitar erros
const createMockTable = (): MockTable => {
  return {
    select: () => ({ 
      firstPage: async () => {
        console.warn('Airtable está sendo deprecada. Use Firebase.');
        return [];
      } 
    }),
    create: async () => {
      console.warn('Airtable está sendo deprecada. Use Firebase.');
      return [];
    },
    update: async () => {
      console.warn('Airtable está sendo deprecada. Use Firebase.');
      return [];
    },
    destroy: async () => {
      console.warn('Airtable está sendo deprecada. Use Firebase.');
      return [];
    }
  };
};

// Tabelas mockadas para evitar erros de runtime
export const tables = {
  users: createMockTable(),
  professors: createMockTable(),
  courses: createMockTable(),
  enrollments: createMockTable(),
  affiliates: createMockTable(),
  settings: createMockTable(),
  lesson_progress: createMockTable(),
  course_contents: createMockTable()
};

// Funções de API obsoletas
export const createUser = async () => {
  console.warn('createUser do Airtable está obsoleto. Use Firebase.');
  return null;
};

export const getUserByUid = async () => {
  console.warn('getUserByUid do Airtable está obsoleto. Use Firebase.');
  return null;
};

export const updateUser = async () => {
  console.warn('updateUser do Airtable está obsoleto. Use Firebase.');
  return null;
};

export const deleteUser = async () => {
  console.warn('deleteUser do Airtable está obsoleto. Use Firebase.');
  return null;
}; 