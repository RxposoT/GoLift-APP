// Core de integração com a Google Gemini AI
// Responsável por: inicializar o modelo, construir o pedido, processar a resposta
// Usado por todos os serviços de IA (report, plan, feedback, adapt)

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY: apiKey, GEMINI_MODEL: modelName } = require('../config/env');

// Instruções de sistema que definem o comportamento da IA para cada tipo de tarefa
// A Gemini usa systemInstruction para definir o papel e constraints da IA
const SYSTEM_PROMPTS = {
  report: 'És um analista de desempenho desportivo. Respondes APENAS com JSON válido, sem markdown nem texto extra.',
  plan: 'És um personal trainer experiente. Respondes APENAS com JSON válido, sem markdown nem texto extra.',
};

// Cria ou reutiliza a instância do modelo generativo da Gemini
function getGeminiModel() {
  if (!apiKey) throw new Error('[GEMINI] GEMINI_API_KEY not configured');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

// Função central que envia um prompt à Gemini e devolve o JSON parseado
// Recebe: { prompt (string com o contexto), type ('plan'|'report') }
// Devolve: objeto JSON (a Gemini está configurada para responder ONLY em JSON)
async function geminiGenerate({ prompt, type = 'plan' }) {
  const model = getGeminiModel();
  const systemMsg = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.plan;

  const result = await model.generateContent({
    systemInstruction: systemMsg,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,              // Controla criatividade (0=determinístico, 1=muito criativo)
      maxOutputTokens: 2048,         // Limite de tokens na resposta
      responseMimeType: 'application/json',  // Força a Gemini a responder em JSON
    },
  });

  const text = result.response.text();
  if (!text) throw new Error('[GEMINI] Empty response');

  // A resposta vem em texto mas deve ser JSON válido — fazemos parse
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('[GEMINI] Response not valid JSON');
  }
}

module.exports = { geminiGenerate };
