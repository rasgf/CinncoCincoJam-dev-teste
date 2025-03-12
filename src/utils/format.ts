/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param value Valor numérico a ser formatado
 * @returns String formatada no padrão R$ X,XX
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('pt-BR');
};

/**
 * Formata um número com separadores de milhar
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
}; 