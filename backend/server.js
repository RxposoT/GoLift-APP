// Ponto de entrada do servidor GoLift Backend
// Importa a app configurada e inicia o servidor na porta definida
// As variáveis de ambiente são carregadas automaticamente pelo src/config/env.js

const app = require('./src/app');
const env = require('./src/config/env');

app.listen(env.PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(70));
  console.log('  GoLift Backend v2 — Supabase-native');
  console.log('='.repeat(70));
  console.log(`  Porta     : ${env.PORT}`);
  console.log(`  Stripe    : ${env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
  console.log(`  AI (Gemini) : ${env.GEMINI_API_KEY ? '✅' : '❌'}`);
  console.log(`  Supabase  : ${env.SUPABASE_URL ? '✅' : '❌'}`);
  console.log('='.repeat(70) + '\n');
});
