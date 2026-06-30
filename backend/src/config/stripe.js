// Configuração do cliente Stripe para processamento de pagamentos
// Só inicializa se a chave secreta estiver definida no ambiente
// As operações Stripe verificam se o cliente foi inicializado antes de prosseguir

const { STRIPE_SECRET_KEY } = require('./env');

let stripe;
if (STRIPE_SECRET_KEY) {
  stripe = require('stripe')(STRIPE_SECRET_KEY);
}

module.exports = stripe;
