const fs = require('fs');
const { exec } = require('child_process');

console.log('Configurando CORS para o Firebase Storage...');

// Criar arquivo cors.json
const corsConfig = [
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
];

fs.writeFileSync('cors.json', JSON.stringify(corsConfig, null, 2));
console.log('Arquivo cors.json criado.');

// Verificar se o Firebase CLI está instalado
exec('firebase --version', (error) => {
  if (error) {
    console.error('Firebase CLI não está instalado. Por favor, instale com:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }

  // Verificar se o usuário está logado no Firebase
  exec('firebase projects:list', (error) => {
    if (error) {
      console.error('Você não está logado no Firebase. Por favor, faça login com:');
      console.error('firebase login');
      process.exit(1);
    }

    // Configurar CORS para o Storage
    console.log('Configurando CORS para o Firebase Storage...');
    exec('firebase storage:cors set cors.json', (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao configurar CORS: ${error.message}`);
        console.error(stderr);
        process.exit(1);
      }
      
      console.log('CORS configurado com sucesso!');
      console.log(stdout);
      
      // Limpar arquivo temporário
      fs.unlinkSync('cors.json');
    });
  });
}); 