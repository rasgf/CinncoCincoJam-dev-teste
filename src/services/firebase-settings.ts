import { getDatabase, ref, set, get, update } from 'firebase/database';
import { collections } from './firebase';

const db = getDatabase();

// Interface para as configurações do chatbot
export interface ChatbotSettings {
  customInstructions: string;
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Salva as instruções personalizadas do chatbot no banco de dados
 * @param customInstructions - As instruções personalizadas a serem salvas
 * @param userId - ID do usuário que está salvando as instruções (opcional)
 * @returns Promise que resolve para as configurações salvas
 */
export const saveChatbotInstructions = async (
  customInstructions: string,
  userId?: string
): Promise<ChatbotSettings> => {
  try {
    const settingsRef = ref(db, `${collections.settings}/chatbot`);
    
    const settings: ChatbotSettings = {
      customInstructions,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || 'unknown'
    };
    
    await set(settingsRef, settings);
    console.log('Instruções do chatbot salvas com sucesso no Firebase');
    
    return settings;
  } catch (error) {
    console.error('Erro ao salvar instruções do chatbot no Firebase:', error);
    throw error;
  }
};

/**
 * Recupera as instruções personalizadas do chatbot do banco de dados
 * @returns Promise que resolve para as configurações do chatbot ou null se não existirem
 */
export const getChatbotInstructions = async (): Promise<ChatbotSettings | null> => {
  try {
    const settingsRef = ref(db, `${collections.settings}/chatbot`);
    const snapshot = await get(settingsRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as ChatbotSettings;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao recuperar instruções do chatbot do Firebase:', error);
    throw error;
  }
}; 