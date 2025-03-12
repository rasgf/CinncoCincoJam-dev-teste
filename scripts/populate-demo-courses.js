const { execSync } = require('child_process');
const path = require('path');

// Caminho para o script TypeScript
const scriptPath = path.join(__dirname, '../src/scripts/populateDemoCourses.ts');

try {
  console.log('Executando script para popular cursos de demonstração...');
  
  // Executar o script TypeScript com ts-node
  execSync(`npx ts-node ${scriptPath}`, { stdio: 'inherit' });
  
  console.log('Script executado com sucesso!');
} catch (error) {
  console.error('Erro ao executar o script:', error);
  process.exit(1);
} 