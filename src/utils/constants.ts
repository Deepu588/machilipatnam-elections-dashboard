export const PARTY_COLORS: Record<string, string> = {
  TDP: '#e0a800',
  YSRCP: '#2f6fd1',
  INC: '#27a3a3',
  JSP: '#d6403a',
  PRP: '#8a5aa8',
  BSP: '#4a5bb5',
  CPI: '#b3261e',
  'CPI(M)': '#8c1c13',
  NOTA: '#8b93a1',
};
export const FALLBACK_COLOR = '#6b7280';
export const partyColor = (party: string): string => PARTY_COLORS[party] ?? FALLBACK_COLOR;

export const PARTY_NAMES: Record<string, string> = {
  TDP: 'Telugu Desam Party',
  YSRCP: 'YSR Congress Party',
  INC: 'Indian National Congress',
  JSP: 'Janasena Party',
  PRP: 'Praja Rajyam Party',
  BSP: 'Bahujan Samaj Party',
  CPI: 'Communist Party of India',
  'CPI(M)': 'Communist Party of India (Marxist)',
  NOTA: 'None of the Above',
};
