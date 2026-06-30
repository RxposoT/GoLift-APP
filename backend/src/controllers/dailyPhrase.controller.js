// Controller da frase motivacional diária
// Delega a lógica para o phrase.service e trata erros com fallback

const phraseService = require('../services/phrase.service');

async function getDailyPhrase(req, res) {
  try {
    const result = await phraseService.getDailyPhrase();
    res.json(result);
  } catch {
    // Fallback seguro caso a base de dados ou API falhe
    res.json({ frase: 'Acredita no processo. Os resultados vêm com o tempo.', cached: false, mock: true });
  }
}

module.exports = { getDailyPhrase };
