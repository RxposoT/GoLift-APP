// Middleware de rate limiting específico para os endpoints de IA
// Limita a 10 pedidos por hora por IP para prevenir abuso da API Gemini
// Como a Gemini tem custos associados, é crítico controlar o uso

const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,          // Janela de 1 hora
  max: 10,                            // Máximo de 10 pedidos por hora
  message: { erro: 'Demasiados pedidos. Tenta novamente mais tarde.' },
});

module.exports = aiLimiter;
