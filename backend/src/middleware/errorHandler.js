// Middleware global de tratamento de erros
// Captura exceções não tratadas e devolve uma resposta JSON consistente
// Divide-se em dois handlers: erros não tratados e rotas não encontradas (404)

// Handler global de erros (Express identifica pelos 4 parâmetros)
function globalErrorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message || err);
  res.status(err.status || 500).json({ erro: err.message || 'Erro interno do servidor.' });
}

// Handler para rotas inexistentes (catch-all 404)
function notFoundHandler(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

module.exports = { globalErrorHandler, notFoundHandler };
