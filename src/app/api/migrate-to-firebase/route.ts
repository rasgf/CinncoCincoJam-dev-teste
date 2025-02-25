import { migrateAirtableToFirebase } from '@/scripts/migrate-airtable-to-firebase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await migrateAirtableToFirebase();
    return NextResponse.json({ 
      success: true, 
      message: 'Migração do Airtable para o Firebase concluída com sucesso' 
    });
  } catch (error) {
    console.error('Erro na migração:', error);
    return NextResponse.json(
      { success: false, message: 'Erro na migração', error: String(error) }, 
      { status: 500 }
    );
  }
} 