#!/usr/bin/env node

/**
 * Script para atualizar o arquivo AI_CURSOR_RULES.md com base em mensagens de commit
 * que mencionam problemas, soluções ou melhorias relacionadas ao desenvolvimento.
 * 
 * Uso: node scripts/update-cursor-rules.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rulesFilePath = path.join(process.cwd(), 'AI_CURSOR_RULES.md');

// Funções auxiliares
function getCurrentDate() {
  const date = new Date();
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function getLastCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error('Erro ao obter o hash do último commit:', error);
    return null;
  }
}

function getLastUpdateCommitHash() {
  try {
    // Tenta ler o hash do último commit que atualizou as diretrizes
    const hashFilePath = path.join(process.cwd(), '.cursor', 'last_guidelines_update');
    if (fs.existsSync(hashFilePath)) {
      return fs.readFileSync(hashFilePath, 'utf-8').trim();
    }
    return null;
  } catch (error) {
    console.error('Erro ao ler o hash do último commit de atualização:', error);
    return null;
  }
}

function saveLastUpdateCommitHash(hash) {
  try {
    // Salva o hash do commit atual como o último que atualizou as diretrizes
    const dirPath = path.join(process.cwd(), '.cursor');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const hashFilePath = path.join(dirPath, 'last_guidelines_update');
    fs.writeFileSync(hashFilePath, hash, 'utf-8');
  } catch (error) {
    console.error('Erro ao salvar o hash do commit de atualização:', error);
  }
}

function getRecentCommitMessages() {
  try {
    const lastUpdateHash = getLastUpdateCommitHash();
    let gitLogCommand = 'git log --since="2 weeks ago" --pretty=format:"%s"';
    
    // Se temos o hash do último commit de atualização, só pegamos commits desde então
    if (lastUpdateHash) {
      gitLogCommand = `git log ${lastUpdateHash}..HEAD --pretty=format:"%s"`;
    }
    
    // Filtra apenas mensagens relevantes
    gitLogCommand += ' | grep -i -E "fix|issue|problem|error|solve|solution|guideline"';
    
    // Exclui commits relacionados à atualização das próprias diretrizes
    gitLogCommand += ' | grep -v -i "atualiza.*guidelines\\|guidelines.*atualiza\\|atualiza.*diretrizes\\|diretrizes.*atualiza"';
    
    const gitLog = execSync(gitLogCommand, { encoding: 'utf-8' });
    return gitLog.split('\n').filter(Boolean);
  } catch (error) {
    console.log('Nenhum commit relevante encontrado ou erro ao buscar commits.');
    return [];
  }
}

function updateVersionAndDate(content) {
  // Extrair versão atual
  const versionMatch = content.match(/> \*\*Versão:\*\* ([0-9]+)\.([0-9]+)\.([0-9]+)/);
  if (!versionMatch) return content;

  const [, major, minor, patch] = versionMatch;
  const newVersion = `${major}.${minor}.${parseInt(patch, 10) + 1}`;
  const currentDate = getCurrentDate();

  // Atualizar versão e data
  content = content.replace(
    /> \*\*Versão:\*\* [0-9]+\.[0-9]+\.[0-9]+/,
    `> **Versão:** ${newVersion}`
  );
  content = content.replace(
    /> \*\*Última atualização:\*\* [0-9]{2}\/[0-9]{2}\/[0-9]{4}/,
    `> **Última atualização:** ${currentDate}`
  );

  return content;
}

// Função principal
function main() {
  try {
    // Verifica se o último commit foi relacionado ao arquivo AI_CURSOR_RULES.md
    const lastCommitFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD', { encoding: 'utf-8' });
    if (lastCommitFiles.includes('AI_CURSOR_RULES.md')) {
      console.log('Commit relacionado às diretrizes detectado. Pulando atualização automática.');
      return;
    }
    
    // Lê o arquivo de regras
    let content = fs.readFileSync(rulesFilePath, 'utf-8');
    const originalContent = content;
    
    // Obtém mensagens de commit recentes
    const commitMessages = getRecentCommitMessages();
    if (commitMessages.length === 0) {
      console.log('Nenhuma nova guideline encontrada em commits recentes.');
      return;
    }

    // Atualiza versão e data
    content = updateVersionAndDate(content);

    // Adiciona um registro de alterações se não existir
    if (!content.includes('## 📝 Registro de Alterações')) {
      const changelogSection = `\n## 📝 Registro de Alterações\n\nEste registro documenta as alterações feitas nas diretrizes ao longo do tempo.\n\n`;
      content = content.replace('---\n\n🚀', `${changelogSection}---\n\n🚀`);
    }

    // Adiciona novas entradas ao registro de alterações
    const changelogRegex = /## 📝 Registro de Alterações\n\n/;
    const currentDate = getCurrentDate();
    let changelogEntry = `### ${currentDate}\n\n`;
    
    commitMessages.forEach(msg => {
      changelogEntry += `- ${msg}\n`;
    });
    
    changelogEntry += '\n';
    content = content.replace(changelogRegex, `## 📝 Registro de Alterações\n\n${changelogEntry}`);

    // Verifica se houve mudanças
    if (content !== originalContent) {
      fs.writeFileSync(rulesFilePath, content, 'utf-8');
      console.log('AI_CURSOR_RULES.md atualizado com sucesso!');
      
      // Salva o hash do commit atual
      const currentCommitHash = getLastCommitHash();
      if (currentCommitHash) {
        saveLastUpdateCommitHash(currentCommitHash);
      }
    } else {
      console.log('Nenhuma mudança necessária no arquivo AI_CURSOR_RULES.md.');
    }
  } catch (error) {
    console.error('Erro ao atualizar o arquivo AI_CURSOR_RULES.md:', error);
  }
}

main(); 