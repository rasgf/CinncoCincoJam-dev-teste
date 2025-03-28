import { NextResponse } from 'next/server';
import { updateOldSessionsWithCreatedAt } from '@/services/firebase-studio-sessions';

export async function POST(request: Request) {
  try {
    const data = await request.json().catch(() => ({}));
    const forceUpdate = data?.forceUpdate === true;
    
    const result = await updateOldSessionsWithCreatedAt(forceUpdate);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao atualizar sessões antigas:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao atualizar sessões antigas' },
      { status: 500 }
    );
  }
} 