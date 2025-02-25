import { seedFirebase } from '@/scripts/seed-firebase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await seedFirebase();
    return NextResponse.json({ 
      success: true, 
      message: 'Firebase populado com dados de exemplo com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao popular o Firebase:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao popular o Firebase', error: String(error) }, 
      { status: 500 }
    );
  }
} 