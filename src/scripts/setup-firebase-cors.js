/**
 * Script para configurar as regras CORS no Firebase Storage
 * 
 * Para executar:
 * 1. Instale o Firebase CLI: `npm install -g firebase-tools`
 * 2. Faça login no Firebase: `firebase login`
 * 3. Execute: `node src/scripts/setup-firebase-cors.js`
 */

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Diretório temporário para o arquivo de configuração CORS
const tempDir = path.join(__dirname, '../../temp');
const corsConfigPath = path.join(tempDir, 'cors.json');

// Criar diretório temporário se não existir
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Configuração CORS para permitir solicitações de qualquer origem
// Pode ser restrito para domínios específicos em produção
const corsConfig = [
  {
    // Em produção, restrinja para seus domínios específicos:
    // "origin": ["https://seuapp.com", "https://outrodominio.com"],
    "origin": ["*"], // Permite qualquer origem (bom para desenvolvimento)
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Content-Disposition", "Content-Length", "Cache-Control"],
    "maxAgeSeconds": 3600
  }
];

// Gravar a configuração em um arquivo temporário
fs.writeFileSync(corsConfigPath, JSON.stringify(corsConfig, null, 2));
console.log(`Arquivo de configuração CORS criado em: ${corsConfigPath}`);

// Execute o comando para configurar CORS no Firebase Storage
console.log('Configurando CORS no Firebase Storage...');

// Obter o nome do bucket do .env
require('dotenv').config({ path: '.env.local' });
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!storageBucket) {
  console.error('Erro: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET não está definido no .env.local');
  process.exit(1);
}

// Executar o comando gsutil
const command = `gsutil cors set ${corsConfigPath} gs://${storageBucket}`;

console.log(`Executando: ${command}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro: ${error.message}`);
    console.error('Verifique se você está logado no Firebase CLI e tem permissões de administrador.');
    console.error('Execute: firebase login');
    return;
  }
  
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  
  console.log(`Resultado: ${stdout}`);
  console.log('Configuração CORS aplicada com sucesso!');
  
  // Limpar o arquivo temporário
  fs.unlinkSync(corsConfigPath);
  console.log('Arquivo temporário removido.');
}); 