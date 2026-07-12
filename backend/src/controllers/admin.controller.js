const adminService = require('../services/admin.service');

async function getGrowth(req, res) {
  try {
    const data = await adminService.getGrowthData();
    res.json(data);
  } catch (error) {
    console.error('[Admin] Erro ao buscar crescimento:', error);
    res.status(500).json({ erro: 'Erro ao carregar dados de crescimento' });
  }
}

async function getStats(req, res) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('[Admin] Erro ao buscar stats:', error);
    res.status(500).json({ erro: 'Erro ao carregar estatísticas' });
  }
}

async function getUsers(req, res) {
  try {
    const users = await adminService.listUsers();
    res.json(users);
  } catch (error) {
    console.error('[Admin] Erro ao listar users:', error);
    res.status(500).json({ erro: 'Erro ao listar utilizadores' });
  }
}

async function setUserTipo(req, res) {
  try {
    const { userId } = req.params;
    const { tipo } = req.body;

    if (tipo !== 0 && tipo !== 1)
      return res.status(400).json({ erro: 'Tipo inválido. Use 0 ou 1.' });

    if (userId === req.user.id && tipo === 0)
      return res.status(400).json({ erro: 'Não podes remover os teus próprios privilégios de admin.' });

    await adminService.updateUserTipo(userId, tipo);
    res.json({ sucesso: true });
  } catch (error) {
    console.error('[Admin] Erro ao atualizar tipo:', error);
    res.status(500).json({ erro: 'Erro ao atualizar utilizador' });
  }
}

async function removeUser(req, res) {
  try {
    const { userId } = req.params;
    if (userId === req.user.id)
      return res.status(400).json({ erro: 'Não podes remover a tua própria conta.' });

    await adminService.deleteUser(userId);
    res.json({ sucesso: true });
  } catch (error) {
    console.error('[Admin] Erro ao remover user:', error);
    res.status(500).json({ erro: 'Erro ao remover utilizador' });
  }
}

async function getPhrases(req, res) {
  try {
    const phrases = await adminService.listPhrases();
    res.json(phrases);
  } catch (error) {
    console.error('[Admin] Erro ao listar frases:', error);
    res.status(500).json({ erro: 'Erro ao listar frases' });
  }
}

async function addPhrase(req, res) {
  try {
    const { data, frase } = req.body;
    if (!data || !frase)
      return res.status(400).json({ erro: 'Data e frase são obrigatórios.' });

    await adminService.createPhrase(data, frase, req.user.id);
    res.status(201).json({ sucesso: true });
  } catch (error) {
    console.error('[Admin] Erro ao criar frase:', error);
    res.status(500).json({ erro: 'Erro ao criar frase' });
  }
}

async function editPhrase(req, res) {
  try {
    const { id } = req.params;
    const { frase } = req.body;
    if (!frase) return res.status(400).json({ erro: 'Frase é obrigatória.' });

    await adminService.updatePhrase(id, frase);
    res.json({ sucesso: true });
  } catch (error) {
    console.error('[Admin] Erro ao editar frase:', error);
    res.status(500).json({ erro: 'Erro ao editar frase' });
  }
}

async function deletePhraseHandler(req, res) {
  try {
    const { id } = req.params;
    await adminService.deletePhrase(id);
    res.json({ sucesso: true });
  } catch (error) {
    console.error('[Admin] Erro ao remover frase:', error);
    res.status(500).json({ erro: 'Erro ao remover frase' });
  }
}

module.exports = { getGrowth, getStats, getUsers, setUserTipo, removeUser, getPhrases, addPhrase, editPhrase, deletePhraseHandler };
