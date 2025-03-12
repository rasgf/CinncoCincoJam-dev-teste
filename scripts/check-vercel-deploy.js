#!/usr/bin/env node

/**
 * Script para verificar o status do deploy no Vercel
 * 
 * Para usar este script, você precisa:
 * 1. Instalar o pacote 'axios': npm install axios
 * 2. Configurar um token de acesso do Vercel: https://vercel.com/account/tokens
 * 3. Executar: VERCEL_TOKEN=seu_token node scripts/check-vercel-deploy.js
 */

const axios = require('axios');

// Configurações
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = 'cincocincojam'; // Substitua pelo nome do seu projeto no Vercel

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN não definido. Configure a variável de ambiente VERCEL_TOKEN.');
  process.exit(1);
}

async function getDeployments() {
  try {
    const response = await axios.get(`https://api.vercel.com/v6/deployments`, {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`
      },
      params: {
        limit: 5,
        projectName: PROJECT_NAME
      }
    });

    return response.data.deployments;
  } catch (error) {
    console.error('❌ Erro ao obter deployments:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function checkDeployStatus() {
  console.log('🔍 Verificando status dos deployments no Vercel...');
  
  const deployments = await getDeployments();
  
  if (!deployments || deployments.length === 0) {
    console.log('❓ Nenhum deployment encontrado para este projeto.');
    return;
  }

  console.log('\n📋 Últimos deployments:');
  console.log('------------------------');
  
  deployments.forEach((deployment, index) => {
    const createdAt = new Date(deployment.created).toLocaleString();
    const branch = deployment.meta?.githubCommitRef || 'N/A';
    const commitMessage = deployment.meta?.githubCommitMessage || 'N/A';
    
    console.log(`\n#${index + 1} - ${deployment.name} (${deployment.url})`);
    console.log(`Branch: ${branch}`);
    console.log(`Status: ${getStatusEmoji(deployment.state)} ${deployment.state}`);
    console.log(`Criado em: ${createdAt}`);
    console.log(`Commit: ${commitMessage}`);
    
    if (deployment.state === 'ERROR') {
      console.log(`Erro: ${deployment.errorMessage || 'Erro desconhecido'}`);
    }
  });
  
  console.log('\n✅ Verificação concluída!');
}

function getStatusEmoji(status) {
  switch (status) {
    case 'READY':
      return '🟢';
    case 'ERROR':
      return '🔴';
    case 'BUILDING':
      return '🟡';
    case 'QUEUED':
      return '⏳';
    case 'CANCELED':
      return '⚪';
    default:
      return '❓';
  }
}

// Executar a verificação
checkDeployStatus(); 