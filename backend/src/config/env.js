// Carrega as variáveis de ambiente do ficheiro .env para o process.env
require('dotenv').config();

// Objeto centralizado que contém todas as variáveis de ambiente da aplicação
// Cada propriedade tem um valor por omissão seguro para desenvolvimento
const env = {
  PORT: process.env.PORT || 3001,
  CLIENT_URL: process.env.CLIENT_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: 'gemini-2.0-flash',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  SERVER_URL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`,
};

// Valida que as variáveis obrigatórias estão definidas
// Apenas avisa no console, não bloqueia o startup (útil para desenvolvimento)
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
for (const key of required) {
  if (!env[key]) {
    console.warn(`[WARN] Variável de ambiente ${key} não configurada`);
  }
}

module.exports = env;
