import { NextRequest, NextResponse } from 'next/server';

// Função para gerar SVG de placeholder
function generatePlaceholderSVG(width = 300, height = 200, text = 'No Image') {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="24" 
        fill="#999" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${text}
      </text>
    </svg>
  `.trim();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const width = parseInt(searchParams.get('width') || '300');
  const height = parseInt(searchParams.get('height') || '200');
  const text = searchParams.get('text') || 'No Image';
  
  const svg = generatePlaceholderSVG(width, height, text);
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
} 