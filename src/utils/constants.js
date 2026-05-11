export const PHASES = {
  GROUP_STAGE: 'Grupos',
  ROUND_16: 'Oitavas',
  QUARTER: 'Quartas',
  SEMI: 'Semifinal',
  FINAL: 'Final',
};

export const PHASES_ARRAY = Object.values(PHASES);

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const FLAG_CODES = {
  'México': 'MX',
  'África do Sul': 'ZA',
  'Coreia do Sul': 'KR',
  'República Tcheca': 'CZ',
  'Canadá': 'CA',
  'Bósnia': 'BA',
  'Bósnia e Herzegovina': 'BA',
  'Qatar': 'QA',
  'Catar': 'QA',
  'Suíça': 'CH',
  'Brasil': 'BR',
  'Marrocos': 'MA',
  'Haiti': 'HT',
  'Escócia': 'SCO',
  'Estados Unidos': 'US',
  'Paraguai': 'PY',
  'Austrália': 'AU',
  'Turquia': 'TR',
  'Alemanha': 'DE',
  'Curaçau': 'CW',
  'Curaçao': 'CW',
  'Costa do Marfim': 'CI',
  'Equador': 'EC',
  'Holanda': 'NL',
  'Japão': 'JP',
  'Suécia': 'SE',
  'Tunísia': 'TN',
  'Espanha': 'ES',
  'Cabo Verde': 'CV',
  'Arábia Saudita': 'SA',
  'Uruguai': 'UY',
  'Bélgica': 'BE',
  'Egito': 'EG',
  'Irã': 'IR',
  'Nova Zelândia': 'NZ',
  'França': 'FR',
  'Senegal': 'SN',
  'Iraque': 'IQ',
  'Noruega': 'NO',
  'Argentina': 'AR',
  'Argélia': 'DZ',
  'Áustria': 'AT',
  'Jordânia': 'JO',
  'Portugal': 'PT',
  'Rep. Democrática do Congo': 'CD',
  'RD Congo': 'CD',
  'Uzbequistão': 'UZ',
  'Colômbia': 'CO',
  'Inglaterra': 'ENG',
  'Croácia': 'HR',
  'Gana': 'GH',
  'Panamá': 'PA',
};

export const getCountryFlag = (countryName) => {
  const code = FLAG_CODES[countryName] || '??';
  return code;
};
