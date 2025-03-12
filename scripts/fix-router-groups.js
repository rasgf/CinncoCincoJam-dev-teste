const fs = require('fs');
const path = require('path');

/**
 * Este script resolve o problema de manifesto de referência de cliente para router groups no Next.js
 * Ele é executado após o build para garantir que todos os arquivos necessários estejam presentes
 */

async function fixRouterGroups() {
  console.log('Iniciando correção para router groups...');

  // Diretório base
  const baseDir = path.join(process.cwd(), '.next', 'server', 'app');
  
  // Lista de router groups que podem precisar de correção
  const routerGroups = ['(dashboard)', '(auth)'];
  
  for (const group of routerGroups) {
    console.log(`Verificando router group: ${group}`);
    
    // Verificar se o diretório existe
    const groupDir = path.join(baseDir, group);
    if (!fs.existsSync(groupDir)) {
      console.log(`Diretório ${groupDir} não encontrado, pulando.`);
      continue;
    }
    
    // Verificar se o arquivo page.js existe
    const pageFile = path.join(groupDir, 'page.js');
    if (!fs.existsSync(pageFile)) {
      console.log(`Arquivo ${pageFile} não encontrado, pulando.`);
      continue;
    }
    
    // Verificar se o arquivo de manifesto está ausente
    const manifestFile = path.join(groupDir, 'page_client-reference-manifest.js');
    if (fs.existsSync(manifestFile)) {
      console.log(`Manifesto ${manifestFile} já existe, não é necessário corrigir.`);
      continue;
    }
    
    // Criar um arquivo de manifesto básico se não existir
    console.log(`Criando manifesto para ${group}/page.js...`);
    const manifestContent = `
self.__RSC_MANIFEST={
  "ssrModuleMapping": {},
  "edgeSSRModuleMapping": {},
  "csrModuleMapping": {},
  "tree": {},
  "clientModules": {}
};
`;
    
    try {
      fs.writeFileSync(manifestFile, manifestContent, 'utf8');
      console.log(`Manifesto criado com sucesso para ${group}/page.js`);
    } catch (err) {
      console.error(`Erro ao criar manifesto para ${group}/page.js:`, err);
    }

    // Se estamos no modo standalone, também precisamos copiar para o diretório standalone
    const standaloneDir = path.join(process.cwd(), '.next', 'standalone', '.next', 'server', 'app', group);
    
    if (fs.existsSync(path.join(process.cwd(), '.next', 'standalone'))) {
      console.log(`Copiando manifesto para o diretório standalone: ${standaloneDir}`);
      
      if (!fs.existsSync(standaloneDir)) {
        fs.mkdirSync(standaloneDir, { recursive: true });
      }
      
      const standaloneManifestFile = path.join(standaloneDir, 'page_client-reference-manifest.js');
      
      try {
        fs.copyFileSync(manifestFile, standaloneManifestFile);
        console.log(`Manifesto copiado com sucesso para ${standaloneManifestFile}`);
      } catch (err) {
        console.error(`Erro ao copiar manifesto para ${standaloneManifestFile}:`, err);
      }
    }
  }
  
  console.log('Correção de router groups concluída!');
}

fixRouterGroups().catch(err => {
  console.error('Erro ao executar script de correção:', err);
  process.exit(1);
}); 