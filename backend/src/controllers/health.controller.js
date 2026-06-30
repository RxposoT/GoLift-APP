// Controller de health check — usado para verificar se o servidor está operacional
// Rota pública, sem autenticação necessária

function getHealth(req, res) {
  res.json({ sucesso: true, mensagem: 'GoLift Backend v2 online' });
}

module.exports = { getHealth };
