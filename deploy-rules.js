const { exec } = require('child_process');
const fs = require('fs');

console.log('Deploying Firebase Database Rules...');

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

    // Ler o arquivo de regras
    const rules = fs.readFileSync('./firebase.rules.json', 'utf8');
    console.log('Regras a serem publicadas:');
    console.log(rules);

    // Publicar as regras
    exec('firebase database:set / ./firebase.rules.json', (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao publicar regras: ${error.message}`);
        console.error(stderr);
        process.exit(1);
      }
      
      console.log('Regras publicadas com sucesso!');
      console.log(stdout);
    });
  });
}); 