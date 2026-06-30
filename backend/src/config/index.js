// Barrel export — centraliza a exportação de todas as configurações
// Permite importar com: const { supabaseAdmin, stripe, env } = require('../config');

const env = require('./env');
const supabaseAdmin = require('./supabase');
const stripe = require('./stripe');

module.exports = { env, supabaseAdmin, stripe };
