const supabaseAdmin = require('../config/supabase');

async function requireAdmin(req, res, next) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tipo')
      .eq('id', req.user.id)
      .single();

    if (!profile || profile.tipo !== 1) {
      return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
    }

    next();
  } catch (error) {
    console.error('[AdminAuth] Erro ao verificar admin:', error);
    return res.status(500).json({ erro: 'Erro ao verificar permissões' });
  }
}

module.exports = requireAdmin;
