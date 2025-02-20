export const AIRTABLE_SCHEMA = {
  tables: {
    courses: {
      name: 'Courses',
      fields: {
        title: { type: 'singleLineText', required: true },
        description: { type: 'multilineText', required: true },
        price: { type: 'number', required: true },
        level: { 
          type: 'singleSelect',
          options: ['beginner', 'intermediate', 'advanced'],
          required: true 
        },
        status: {
          type: 'singleSelect',
          options: ['draft', 'published', 'archived'],
          required: true
        },
        thumbnail: { type: 'text', required: false },
        what_will_learn: { type: 'text', required: true },
        requirements: { type: 'text', required: true },
        professor: { 
          type: 'linkToAnotherRecord',
          table: 'Professors',
          relationship: 'single',
          required: true 
        },
        created_at: { type: 'date', required: true },
        updated_at: { type: 'date', required: true }
      }
    },
    // ... outras tabelas
  }
} as const; 