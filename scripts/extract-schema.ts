import { tables } from '../src/services/airtable';
import fs from 'fs';
import path from 'path';
import { Table, FieldSet } from 'airtable';

type Tables = typeof tables;
type TableName = keyof Tables;

interface SchemaField {
  type: string;
  example: any;
  required: boolean;
}

interface TableSchema {
  name: string;
  fields: Record<string, SchemaField>;
}

interface Schema {
  tables: Record<string, TableSchema>;
}

async function extractSchema() {
  const schema: Schema = { tables: {} };

  // Lista todas as tabelas configuradas
  const tableNames = Object.keys(tables) as TableName[];

  for (const tableName of tableNames) {
    try {
      // Busca um registro para ver os campos
      const records = await tables[tableName].select({ maxRecords: 1 }).firstPage();
      const record = records[0];

      if (record) {
        // Extrai os campos e seus tipos
        const fields = Object.keys(record.fields).reduce<Record<string, SchemaField>>((acc, fieldName) => {
          const value = record.fields[fieldName];
          const type = Array.isArray(value) ? 'array' : typeof value;
          
          acc[fieldName] = {
            type,
            example: value,
            required: false // Você precisará ajustar manualmente
          };
          
          return acc;
        }, {});

        schema.tables[tableName] = {
          name: tableName,
          fields
        };
      }
    } catch (error) {
      console.error(`Error extracting schema for table ${tableName}:`, error);
    }
  }

  // Salva o schema em um arquivo
  const schemaPath = path.join(process.cwd(), 'src/config/airtable/schema.json');
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

  console.log('Schema extracted and saved to:', schemaPath);
}

extractSchema().catch(console.error); 