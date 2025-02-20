import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verificar se o usuário está autenticado
  const session = request.cookies.get('session');

  // Permitir acesso à landing page do curso
  if (request.nextUrl.pathname.match(/^\/courses\/[^/]+$/)) {
    return NextResponse.next();
  }

  // Proteger rotas de aprendizado
  if (!session && request.nextUrl.pathname.startsWith('/learn/')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/courses/:path*', '/learn/:path*']
}; 