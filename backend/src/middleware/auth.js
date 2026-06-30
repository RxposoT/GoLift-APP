// Middleware de autenticação — verifica o JWT do Supabase enviado no header Authorization
// Funciona como guarda para todas as rotas que precisam de um utilizador autenticado
// Extrai o token Bearer, valida-o com o Supabase e anexa o user ao objeto req

const supabaseAdmin = require('../config/supabase');

async function authenticateSupabase(req, res, next) {
  const authHeader = req.headers.authorization;

  // Verifica se o header Authorization existe e começa com "Bearer "
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token em falta' });
  }

  // Extrai apenas o token (remove o prefixo "Bearer ")
  const token = authHeader.split(' ')[1];

  // Verifica o token junto do Supabase Auth — devolve o user se válido
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ erro: 'Token inválido' });
  }

  // Anexa o utilizador autenticado ao pedido para uso nos controllers
  req.user = user;
  next();
}

module.exports = authenticateSupabase;
