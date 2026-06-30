-- GoLift — Seed Exercises (200+)
INSERT INTO public.exercises (nome, descricao, video, grupo_tipo, sub_tipo) VALUES
-- ============================
-- PEITO (Peito)
-- ============================
('Supino Reto com Barra', 'Deitado no banco reto, empurra a barra para cima', NULL, 'Peito', 'Supino'),
('Supino Inclinado com Barra', 'Deitado no banco inclinado a 45°, empurra a barra', NULL, 'Peito', 'Supino'),
('Supino Declinado com Barra', 'Deitado no banco declinado, empurra a barra', NULL, 'Peito', 'Supino'),
('Supino Reto com Halteres', 'Deitado no banco reto com halteres, empurra para cima', NULL, 'Peito', 'Supino'),
('Supino Inclinado com Halteres', 'Deitado no banco inclinado com halteres', NULL, 'Peito', 'Supino'),
('Crucifixo com Halteres', 'Deitado no banco, abre os braços com halteres e junta', NULL, 'Peito', 'Isolamento'),
('Crucifixo no Cabo', 'Em pé no crossover, puxa os cabos para a frente', NULL, 'Peito', 'Isolamento'),
('Pullover com Haltere', 'Deitado no banco, haltere atrás da cabeça e puxa', NULL, 'Peito', 'Isolamento'),
('Flexões (Push Ups)', 'Posição de prancha, desce o peito ao chão e sobe', NULL, 'Peito', 'Peso Corporal'),
('Flexões Diamante', 'Mãos juntas em forma de diamante, foca tríceps e peito interno', NULL, 'Peito', 'Peso Corporal'),
('Flexões Declinadas', 'Pés elevados, mãos no chão, foca peito superior', NULL, 'Peito', 'Peso Corporal'),
('Máquina de Supino', 'Sentado na máquina, empurra os punhos para a frente', NULL, 'Peito', 'Máquina'),
('Peck Deck', 'Sentado na máquina, junta os braços à frente', NULL, 'Peito', 'Máquina'),
('Crossover de Cabos (Alto)', 'Cabos na posição alta, puxa para baixo e cruza', NULL, 'Peito', 'Isolamento'),
('Crossover de Cabos (Baixo)', 'Cabos na posição baixa, puxa para cima e cruza', NULL, 'Peito', 'Isolamento'),
('Pullover na Máquina', 'Deitado na máquina, puxa o peso de cima para baixo', NULL, 'Peito', 'Máquina'),

-- ============================
-- COSTAS (Costas)
-- ============================
('Puxada na Frente (Lat Pulldown)', 'Sentado na máquina, puxa a barra para o peito', NULL, 'Costas', 'Puxada'),
('Puxada Atrás (Lat Pulldown)', 'Sentado na máquina, puxa a barra atrás da nuca', NULL, 'Costas', 'Puxada'),
('Remada Curvada com Barra', 'Inclinado, barra no chão, puxa para a barriga', NULL, 'Costas', 'Remada'),
('Remada Curvada com Halteres', 'Inclinado com haltere, puxa para o quadril', NULL, 'Costas', 'Remada'),
('Remada Unilateral com Haltere', 'Apoiado no banco, puxa haltere para o quadril', NULL, 'Costas', 'Remada'),
('Remada na Máquina (T Bar)', 'Na máquina T-bar, puxa o peso para o peito', NULL, 'Costas', 'Máquina'),
('Remada na Máquina (Sentado)', 'Sentado na máquina, puxa os punhos para a barriga', NULL, 'Costas', 'Máquina'),
('Puxada no Pulley (Triângulo)', 'Pega no triângulo, puxa para o peito com braços fechados', NULL, 'Costas', 'Puxada'),
('Puxada Aberta (Pulley)', 'Pega larga, puxa para o peito', NULL, 'Costas', 'Puxada'),
('Pull Ups (Barra Fixa)', 'Suspenso na barra, puxa o corpo para cima', NULL, 'Costas', 'Peso Corporal'),
('Chin Ups (Barra Fixa Supinada)', 'Suspenso na barra com mãos viradas para ti, puxa', NULL, 'Costas', 'Peso Corporal'),
('Deadlift (Levantamento Terra)', 'Barra no chão, levanta com costas retas até ficar em pé', NULL, 'Costas', 'Composto'),
('Deadlift Romeno', 'Barra nas mãos, desce com pernas esticadas e sobe', NULL, 'Costas', 'Composto'),
('Bom Dia (Good Morning)', 'Barra nas costas, inclina o tronco para a frente', NULL, 'Costas', 'Composto'),
('Encolhimentos (Shrugs) com Barra', 'Em pé, eleva os ombros com barra nas mãos', NULL, 'Costas', 'Isolamento'),
('Encolhimentos (Shrugs) com Halteres', 'Em pé, eleva os ombros com halteres', NULL, 'Costas', 'Isolamento'),
('Face Pull', 'No pulley, puxa o cabo para a cara com cotovelos altos', NULL, 'Costas', 'Isolamento'),
('Remada Alta', 'Barra ou halteres, puxa para o queixo com cotovelos altos', NULL, 'Costas', 'Composto'),
('Hiperextensão (Lombar)', 'No banco romano, desce o tronco e sobe', NULL, 'Costas', 'Isolamento'),
('Pullover na Polia', 'Na polia alta, puxa o cabo de cima para baixo com braços esticados', NULL, 'Costas', 'Isolamento'),

-- ============================
-- OMBROS (Ombros)
-- ============================
('Desenvolvimento com Barra (Shoulder Press)', 'Sentado, barra à frente da cara, empurra para cima', NULL, 'Ombros', 'Press'),
('Desenvolvimento com Halteres', 'Sentado com halteres aos ombros, empurra para cima', NULL, 'Ombros', 'Press'),
('Desenvolvimento Máquina', 'Sentado na máquina, empurra os punhos para cima', NULL, 'Ombros', 'Máquina'),
('Elevação Lateral com Halteres', 'Em pé, eleva os halteres para os lados', NULL, 'Ombros', 'Isolamento'),
('Elevação Lateral no Cabo', 'No cabo, eleva o braço para o lado', NULL, 'Ombros', 'Isolamento'),
('Elevação Frontal com Halteres', 'Em pé, eleva os halteres à frente', NULL, 'Ombros', 'Isolamento'),
('Elevação Frontal no Cabo', 'No cabo, eleva o braço à frente', NULL, 'Ombros', 'Isolamento'),
('Elevação Frontal com Barra', 'Barra nas mãos, eleva à frente', NULL, 'Ombros', 'Isolamento'),
('Arnold Press', 'Halteres aos ombros com palmas viradas para ti, roda e empurra', NULL, 'Ombros', 'Press'),
('Remada Alta (Upright Row)', 'Barra ou halteres, puxa para o queixo', NULL, 'Ombros', 'Composto'),
('Face Pull no Cabo', 'Cabo na cara, puxa para trás com cotovelos abertos', NULL, 'Ombros', 'Isolamento'),
('Pá Delft (Lateral no Cabo)', 'No cabo, eleva para o lado com inclinação', NULL, 'Ombros', 'Isolamento'),
('Rotação Externa com Cabo', 'Cabo na cintura, roda o braço para fora', NULL, 'Ombros', 'Rotação'),
('Rotação Interna com Cabo', 'Cabo na cintura, roda o braço para dentro', NULL, 'Ombros', 'Rotação'),
('Y T W L (Ativação de Ombros)', 'No chão ou inclinado, faz movimentos Y T W L', NULL, 'Ombros', 'Ativação'),

-- ============================
-- BÍCEPS (Bíceps)
-- ============================
('Rosca Direta com Barra', 'Em pé, barra nas mãos, enrola para o peito', NULL, 'Bíceps', 'Rosca'),
('Rosca Direta com Halteres', 'Em pé, halteres nas mãos, enrola alternado', NULL, 'Bíceps', 'Rosca'),
('Rosca Martelo', 'Halteres com palmas viradas para o corpo, enrola', NULL, 'Bíceps', 'Rosca'),
('Rosca Scott (Banco)', 'Sentado no banco Scott, barra ou halteres, enrola', NULL, 'Bíceps', 'Rosca'),
('Rosca Concentrada', 'Sentado, cotovelo apoiado na coxa, haltere enrola', NULL, 'Bíceps', 'Isolamento'),
('Rosca no Cabo (Direta)', 'No cabo, pega na barra reta e enrola', NULL, 'Bíceps', 'Cabo'),
('Rosca no Cabo (Corda)', 'No cabo com corda, enrola com rotação', NULL, 'Bíceps', 'Cabo'),
('Rosca no Cabo (Unilateral)', 'No cabo, pega na pega individual e enrola', NULL, 'Bíceps', 'Cabo'),
('Rosca Inversa com Barra', 'Barra com palmas viradas para baixo, enrola', NULL, 'Bíceps', 'Rosca'),
('Rosca no Pulley (Inclinado)', 'No banco inclinado, halteres enrolam para trás', NULL, 'Bíceps', 'Rosca'),
('Rosca no Banco Inclinado', 'Sentado no banco inclinado, halteres enrolam', NULL, 'Bíceps', 'Rosca'),
('Drag Curl', 'Barra nas mãos, enrola mantendo cotovelos para trás', NULL, 'Bíceps', 'Rosca'),
('21s (Rosca Parcial)', '7 infra + 7 supra + 7 completas = 21 repetições', NULL, 'Bíceps', 'Técnica'),

-- ============================
-- TRÍCEPS (Tríceps)
-- ============================
('Tríceps no Pulley (Corda)', 'No pulley alto, puxa a corda para baixo', NULL, 'Tríceps', 'Cabo'),
('Tríceps no Pulley (Barra Reta)', 'No pulley alto, puxa barra reta para baixo', NULL, 'Tríceps', 'Cabo'),
('Tríceps no Pulley (Unilateral)', 'No pulley alto, puxa com uma mão', NULL, 'Tríceps', 'Cabo'),
('Tríceps Francês (Deitado)', 'Deitado no banco, barra atrás da cabeça e estende', NULL, 'Tríceps', 'Barra'),
('Tríceps Francês (Sentado)', 'Sentado, haltere atrás da cabeça e estende', NULL, 'Tríceps', 'Haltere'),
('Tríceps Mergulho (Dips)', 'No banco ou paralelas, desce o corpo e sobe', NULL, 'Tríceps', 'Peso Corporal'),
('Tríceps Mergulho (Máquina)', 'Na máquina de mergulho, empurra os punhos para baixo', NULL, 'Tríceps', 'Máquina'),
('Tríceps Coice (Kickback)', 'Inclinado, haltere no cotovelo, estende o braço para trás', NULL, 'Tríceps', 'Haltere'),
('Tríceps no Banco (Close Grip Press)', 'Supino com mãos juntas, foca tríceps', NULL, 'Tríceps', 'Barra'),
('Extensão de Tríceps Acima da Cabeça', 'Em pé, haltere acima da cabeça, desce atrás e estende', NULL, 'Tríceps', 'Haltere'),
('Tríceps no Cabo (Inverso)', 'No pulley baixo, puxa o cabo para baixo com costas viradas', NULL, 'Tríceps', 'Cabo'),
('Diamond Push Ups', 'Flexões com mãos em diamante', NULL, 'Tríceps', 'Peso Corporal'),

-- ============================
-- PERNAS (Pernas)
-- ============================
('Agachamento (Squat) com Barra', 'Barra nas costas, agacha e sobe', NULL, 'Pernas', 'Agachamento'),
('Agachamento Frontal', 'Barra à frente dos ombros, agacha e sobe', NULL, 'Pernas', 'Agachamento'),
('Agachamento com Halteres (Goblet)', 'Haltere ao peito, agacha', NULL, 'Pernas', 'Agachamento'),
('Agachamento Búlgaro', 'Um pé no banco atrás, agacha com a outra perna', NULL, 'Pernas', 'Agachamento'),
('Agachamento Sumô', 'Pés largos, barra entre as pernas, agacha', NULL, 'Pernas', 'Agachamento'),
('Leg Press (Máquina)', 'Sentado na máquina, empurra a plataforma', NULL, 'Pernas', 'Máquina'),
('Leg Press 45°', 'Inclinado na máquina a 45°, empurra a plataforma', NULL, 'Pernas', 'Máquina'),
('Extensão de Pernas (Leg Extension)', 'Sentado na máquina, estende as pernas', NULL, 'Pernas', 'Isolamento'),
('Flexão de Pernas (Leg Curl) Deitado', 'Deitado na máquina, enrola as pernas', NULL, 'Pernas', 'Isolamento'),
('Flexão de Pernas (Leg Curl) Sentado', 'Sentado na máquina, enrola as pernas', NULL, 'Pernas', 'Isolamento'),
('Avanço (Lunge) com Halteres', 'Passo à frente com halteres, desce e sobe', NULL, 'Pernas', 'Composto'),
('Avanço (Lunge) com Barra', 'Passo à frente com barra nas costas', NULL, 'Pernas', 'Composto'),
('Avanço Lateral (Side Lunge)', 'Passo lateral, desce e volta', NULL, 'Pernas', 'Composto'),
('Avanço Reverso (Reverse Lunge)', 'Passo atrás, desce e volta', NULL, 'Pernas', 'Composto'),
('Levantamento Terra (Deadlift)', 'Barra no chão, levanta até ficar em pé', NULL, 'Pernas', 'Composto'),
('Levantamento Terra Romeno', 'Barra nas mãos, desce com pernas esticadas', NULL, 'Pernas', 'Composto'),
('Stiff Leg Deadlift', 'Barra nas mãos, pernas esticadas, desce e sobe', NULL, 'Pernas', 'Isolamento'),
('Good Morning (Bom Dia)', 'Barra nas costas, inclina o tronco', NULL, 'Pernas', 'Composto'),
('Ponte de Glúteos (Barra)', 'Deitado no chão, barra nos quadris, eleva', NULL, 'Pernas', 'Glúteos'),
('Ponte de Glúteos (Haltere)', 'Deitado no chão, haltere nos quadris, eleva', NULL, 'Pernas', 'Glúteos'),
('Glúteo 4 Apoios (Hip Thrust)', 'No chão com costas no banco, barra nos quadris, eleva', NULL, 'Pernas', 'Glúteos'),
('Elevação Pélvica (Hip Thrust Máquina)', 'Na máquina de hip thrust, empurra o peso', NULL, 'Pernas', 'Glúteos'),
('Abdução de Pernas (Máquina)', 'Sentado na máquina, abre as pernas', NULL, 'Pernas', 'Isolamento'),
('Adução de Pernas (Máquina)', 'Sentado na máquina, junta as pernas', NULL, 'Pernas', 'Isolamento'),
('Elevação de Gémeos (Gêmeos) em Pé', 'Em pé, eleva os calcanhares', NULL, 'Pernas', 'Gémeos'),
('Elevação de Gémeos Sentado', 'Sentado com peso nos joelhos, eleva os calcanhares', NULL, 'Pernas', 'Gémeos'),
('Elevação de Gémeos na Máquina', 'Na máquina de gémeos, eleva os calcanhares', NULL, 'Pernas', 'Gémeos'),
('Passadas (Walking Lunges)', 'Passos à frente alternados com halteres', NULL, 'Pernas', 'Composto'),
('Sissy Squat', 'Agachamento com joelhos à frente, barra ou sem peso', NULL, 'Pernas', 'Agachamento'),
('Agachamento Isométrico (Wall Sit)', 'Costas na parede, agacha e segura', NULL, 'Pernas', 'Isométrico'),
('Step Up (Banco)', 'Sobe num banco com halteres', NULL, 'Pernas', 'Composto'),

-- ============================
-- ABDOMINAIS (Abdominais)
-- ============================
('Abdominal (Crunch)', 'Deitado no chão, eleva o tronco', NULL, 'Abdominais', 'Crunch'),
('Abdominal na Máquina', 'Sentado na máquina, enrola o tronco', NULL, 'Abdominais', 'Máquina'),
('Abdominal Invertido', 'Deitado, eleva as pernas e o quadril', NULL, 'Abdominais', 'Elevação'),
('Elevação de Pernas (Leg Raise)', 'Deitado ou suspenso, eleva as pernas', NULL, 'Abdominais', 'Elevação'),
('Elevação de Pernas Suspenso', 'Suspenso na barra, eleva as pernas', NULL, 'Abdominais', 'Elevação'),
('Prancha (Plank)', 'Posição de prancha, segura o máximo', NULL, 'Abdominais', 'Isométrico'),
('Prancha Lateral', 'De lado, segura o corpo alinhado', NULL, 'Abdominais', 'Isométrico'),
('Bicicleta (Bicycle Crunch)', 'Deitado, alterna cotovelo ao joelho oposto', NULL, 'Abdominais', 'Crunch'),
('Russian Twist', 'Sentado, tronco inclinado, roda o tronco com peso', NULL, 'Abdominais', 'Rotação'),
('Abdominal na Polia (Cabo)', 'No pulley alto, puxa o cabo para baixo com o tronco', NULL, 'Abdominais', 'Cabo'),
('V-up', 'Deitado, eleva braços e pernas ao mesmo tempo', NULL, 'Abdominais', 'Composto'),
('Toque nos Pés (Toe Touch)', 'Deitado, eleva as pernas e toca nos pés', NULL, 'Abdominais', 'Crunch'),
('Abdominal com Peso (Declinado)', 'No banco declinado com peso ao peito, enrola', NULL, 'Abdominais', 'Crunch'),
('Dragon Flag', 'Deitado no banco, segura o corpo reto e desce', NULL, 'Abdominais', 'Avançado'),
('Ab Wheel (Roda)', 'De joelhos, rola a roda para a frente e volta', NULL, 'Abdominais', 'Isolamento'),
('Pallof Press', 'No cabo lateral, segura o cabo à frente do peito', NULL, 'Abdominais', 'Antirrotação'),
('Dead Bug', 'Deitado de costas, alterna braço e perna opostos', NULL, 'Abdominais', 'Ativação'),
('Crunches com Cabo (Declinado)', 'No banco declinado com cabo na nuca, enrola', NULL, 'Abdominais', 'Cabo'),
('Elevação de Joelhos Suspenso', 'Suspenso na barra, eleva os joelhos ao peito', NULL, 'Abdominais', 'Elevação'),

-- ============================
-- CARDIO
-- ============================
('Corrida (Esteira)', 'Correr na passadeira', NULL, 'Cardio', 'Esteira'),
('Caminhada Inclinada', 'Andar na passadeira com inclinação', NULL, 'Cardio', 'Esteira'),
('Bicicleta Estacionária', 'Pedalar na bicicleta de ginásio', NULL, 'Cardio', 'Bicicleta'),
('Bicicleta Spinning', 'Pedalar em alta intensidade na bicicleta de spin', NULL, 'Cardio', 'Spinning'),
('Elíptica', 'Na máquina elíptica, movimento de corrida sem impacto', NULL, 'Cardio', 'Elíptica'),
('Remo (Máquina)', 'Na máquina de remo, puxa o cabo', NULL, 'Cardio', 'Remo'),
('Escada (Stairmaster)', 'Na máquina de escada, sobe os degraus', NULL, 'Cardio', 'Escada'),
('Saltos à Corda', 'Corda de saltar', NULL, 'Cardio', 'Corda'),
('Burpees', 'De pé, agacha, estica, flexão, salta', NULL, 'Cardio', 'Peso Corporal'),
('Mountain Climbers', 'Na posição de flexão, alterna os joelhos ao peito', NULL, 'Cardio', 'Peso Corporal'),
('Jumping Jacks', 'Saltos com braços e pernas abertos', NULL, 'Cardio', 'Peso Corporal'),
('High Knees', 'Corrida no lugar com joelhos altos', NULL, 'Cardio', 'Peso Corporal'),
('Box Jumps', 'Sobe para uma caixa com salto', NULL, 'Cardio', 'Plyométrico'),
('Jump Squats', 'Agachamento com salto', NULL, 'Cardio', 'Plyométrico'),
('Lunges com Salto', 'Avanço com salto alternado', NULL, 'Cardio', 'Plyométrico'),
('Batalha de Cordas (Battle Ropes)', 'Cordas grossas, faz ondas alternadas', NULL, 'Cardio', 'Cordas'),
('Slam Ball', 'Bola pesada, levanta e bate no chão', NULL, 'Cardio', 'Bola'),
('Kettlebell Swings', 'Kettlebell entre as pernas, balança para a frente', NULL, 'Cardio', 'Kettlebell'),

-- ============================
-- EXERCÍCIOS COMPOSTOS
-- ============================
('Clean and Press', 'Barra do chão ao peito e empurra para cima', NULL, 'Compostos', 'Olímpico'),
('Clean and Jerk', 'Barra do chão ao peito e acima da cabeça', NULL, 'Compostos', 'Olímpico'),
('Snatch (Arranco)', 'Barra do chão acima da cabeça num só movimento', NULL, 'Compostos', 'Olímpico'),
('Power Clean', 'Barra do chão ao peito', NULL, 'Compostos', 'Olímpico'),
('Thruster', 'Agachamento frontal + desenvolvimento em pé', NULL, 'Compostos', 'CrossFit'),
('Wall Ball', 'Bola à parede, agacha e lança', NULL, 'Compostos', 'CrossFit'),
('Turkish Get Up', 'Deitado com kettlebell em cima, levanta-te', NULL, 'Compostos', 'Kettlebell'),
('Lunges com Twist', 'Avanço com rotação do tronco', NULL, 'Compostos', 'Funcional'),
('Bear Crawl', 'Rastejar como urso, mãos e pés no chão', NULL, 'Compostos', 'Peso Corporal'),
('Man Maker', 'Flexão + remada + agachamento + press, tudo com halteres', NULL, 'Compostos', 'CrossFit'),
('Pistol Squat', 'Agachamento numa perna só', NULL, 'Compostos', 'Avançado'),
('Handstand Push Up', 'Pino na parede e desce com a cabeça ao chão', NULL, 'Compostos', 'Avançado'),

-- ============================
-- EXERCÍCIOS COM CABO / POLIA
-- ============================
('Crossover de Cabos (Peito)', 'No crossover, puxa os cabos para a frente', NULL, 'Cabo', 'Peito'),
('Puxada na Cara (Face Pull)', 'Cabo na altura da cara, puxa para trás', NULL, 'Cabo', 'Costas'),
('Tríceps Polia Alta', 'Na polia alta, puxa cabo para baixo com cotovelos fixos', NULL, 'Cabo', 'Tríceps'),
('Bíceps Polia Alta', 'Na polia alta, enrola o cabo para o peito', NULL, 'Cabo', 'Bíceps'),
('Remada no Cabo (Sentado)', 'Sentado no banco, puxa o cabo para a barriga', NULL, 'Cabo', 'Costas'),
('Puxada Tríceps (Corda)', 'Na polia alta com corda, puxa para baixo', NULL, 'Cabo', 'Tríceps'),
('Elevação Lateral no Cabo', 'Cabo lateral, eleva o braço para o lado', NULL, 'Cabo', 'Ombros'),
('Elevação Frontal no Cabo', 'Cabo à frente, eleva o braço', NULL, 'Cabo', 'Ombros'),
('Crossover Baixo (Peito)', 'Cabos na posição baixa, puxa para cima', NULL, 'Cabo', 'Peito'),
('Crunch no Cabo', 'No pulley alto com corda na nuca, enrola o tronco', NULL, 'Cabo', 'Abdominais'),
('Puxada Tríceps Inversa', 'Cabo baixo com costas viradas, puxa para baixo', NULL, 'Cabo', 'Tríceps'),
('Rotação Externa Cabo', 'Cabo na cintura, roda o braço para fora', NULL, 'Cabo', 'Ombros'),

-- ============================
-- MÁQUINAS ADICIONAIS
-- ============================
('Supino Máquina (Smith)', 'Na máquina Smith, supino reto', NULL, 'Máquina', 'Smith'),
('Agachamento Smith', 'Na máquina Smith, agachamento', NULL, 'Máquina', 'Smith'),
('Desenvolvimento Smith', 'Na máquina Smith, desenvolvimento sentado', NULL, 'Máquina', 'Smith'),
('Remada Smith', 'Na máquina Smith, remada curvada', NULL, 'Máquina', 'Smith'),
('Puxada Máquina (Assistida)', 'Na máquina de puxada assistida, puxa o corpo', NULL, 'Máquina', 'Puxada'),
('Dips Assistido (Máquina)', 'Na máquina de mergulho assistido, desce e sobe', NULL, 'Máquina', 'Assistido'),
('Hack Squat (Máquina)', 'Na máquina hack squat, agacha', NULL, 'Máquina', 'Pernas'),
('Leg Press 90°', 'Na máquina de pernas a 90°, empurra', NULL, 'Máquina', 'Pernas'),
('Chest Press (Máquina)', 'Na máquina de peito, empurra os punhos', NULL, 'Máquina', 'Peito'),
('Shoulder Press (Máquina)', 'Na máquina de ombros, empurra para cima', NULL, 'Máquina', 'Ombros'),
('Lat Pulldown (Máquina)', 'Na máquina de puxada, puxa para o peito', NULL, 'Máquina', 'Costas'),
('Leg Curl (Máquina Sentado)', 'Na máquina de pernas sentado, enrola', NULL, 'Máquina', 'Pernas'),
('Leg Extension (Máquina)', 'Na máquina de extensão, estende as pernas', NULL, 'Máquina', 'Pernas'),
('Peck Deck (Máquina)', 'Na máquina de peito, junta os braços', NULL, 'Máquina', 'Peito'),
('Remada Máquina (T-Bar)', 'Na T-Bar, puxa o peso', NULL, 'Máquina', 'Costas'),
('Puxada Tríceps (Máquina)', 'Na máquina de tríceps, puxa para baixo', NULL, 'Máquina', 'Tríceps'),
('Rosca Scott (Máquina)', 'Na máquina de bíceps, enrola', NULL, 'Máquina', 'Bíceps'),
('Abdução (Máquina)', 'Na máquina de abdução, abre as pernas', NULL, 'Máquina', 'Pernas'),
('Adução (Máquina)', 'Na máquina de adução, junta as pernas', NULL, 'Máquina', 'Pernas'),
('Glúteo (Máquina)', 'Na máquina de glúteo, empurra para trás', NULL, 'Máquina', 'Glúteos'),
('Gémeos (Máquina em Pé)', 'Na máquina de gémeos em pé, eleva calcanhares', NULL, 'Máquina', 'Gémeos'),
('Gémeos (Máquina Sentado)', 'Na máquina de gémeos sentado, eleva calcanhares', NULL, 'Máquina', 'Gémeos'),

-- ============================
-- YOGA / MOBILIDADE / RECUPERAÇÃO
-- ============================
('Cão Virado para Baixo (Downward Dog)', 'Posição de yoga, corpo em V invertido', NULL, 'Mobilidade', 'Yoga'),
('Cão Virado para Cima (Upward Dog)', 'Deitado de barriga, empurra o tronco para cima', NULL, 'Mobilidade', 'Yoga'),
('Postura da Criança (Child Pose)', 'Sentado sobre os calcanhares, tronco no chão', NULL, 'Mobilidade', 'Yoga'),
('Gato e Vaca (Cat Cow)', '4 apoios, alterna entre arquear e curvar as costas', NULL, 'Mobilidade', 'Yoga'),
('Pombo (Pigeon Pose)', 'Uma perna à frente, outra esticada atrás', NULL, 'Mobilidade', 'Yoga'),
('Guerreiro I (Warrior I)', 'Avanço com braços acima da cabeça', NULL, 'Mobilidade', 'Yoga'),
('Guerreiro II (Warrior II)', 'Avanço lateral com braços abertos', NULL, 'Mobilidade', 'Yoga'),
('Savasana', 'Deitado de costas, relaxamento total', NULL, 'Mobilidade', 'Yoga'),
('Alongamento de Isquiotibiais', 'Sentado, pernas esticadas, toca nos pés', NULL, 'Mobilidade', 'Alongamento'),
('Alongamento de Quadríceps', 'Em pé, puxa o calcanhar ao glúteo', NULL, 'Mobilidade', 'Alongamento'),
('Alongamento de Peito (Porta)', 'No batente da porta, braços na moldura e inclina', NULL, 'Mobilidade', 'Alongamento'),
('Rolo de Espuma (Peito)', 'Rolo de espuma no peito, role para massajar', NULL, 'Mobilidade', 'Recuperação'),
('Rolo de Espuma (Costas)', 'Rolo de espuma nas costas, role para massajar', NULL, 'Mobilidade', 'Recuperação'),
('Rolo de Espuma (Pernas)', 'Rolo de espuma nas pernas, role para massajar', NULL, 'Mobilidade', 'Recuperação'),
('Stretching Global', 'Alongamento geral de corpo inteiro', NULL, 'Mobilidade', 'Alongamento'),
('Foam Rolling (Glúteos)', 'Rolo de espuma nos glúteos', NULL, 'Mobilidade', 'Recuperação'),
('Mobilidade Torácica', 'Rolo ou banco, arqueia as costas para mobilidade', NULL, 'Mobilidade', 'Ativação'),
('Abertura de Ancas (Hip Opener)', '4 apoios, passa uma perna para a frente', NULL, 'Mobilidade', 'Ativação'),
('Band Pull Apart', 'Banda elástica à frente, puxa para os lados', NULL, 'Mobilidade', 'Ativação'),
('Dislocates (Ombro)', 'Cabo ou toalha, roda os braços à frente e atrás', NULL, 'Mobilidade', 'Ativação');

-- Verify count
SELECT COUNT(*) AS total_exercises FROM public.exercises;
