export interface User {
  id: string;
  nome: string;
  email: string;
  tipo?: number;
  idade?: number;
  peso?: number;
  altura?: number;
  isAdmin?: boolean;
}

export interface Exercise {
  id: number;
  nome: string;
  grupo_tipo?: string;
  video_url?: string;
}

export interface Serie {
  numero_serie: number;
  repeticoes: number;
  peso: number;
  concluida: boolean;
}

export interface Workout {
  id_treino: number;
  nome: string;
  exercicios: any[];
}

export interface Record {
  exercicio: string;
  weight: number;
  data?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  password: string;
  idade?: number;
  peso?: number;
  altura?: number;
}

export interface Community {
  id: number;
  nome: string;
  descricao: string;
  criador_id: string;
  criador_nome: string;
  membros: number;
  verificada: boolean;
  criada_em: string;
  imagem_url?: string;
  pais?: string;
  linguas?: string;
  categoria?: string;
  privada?: boolean;
}

export interface CommunityMember {
  id: number;
  comunidade_id: number;
  user_id: string;
  user_nome: string;
  juntou_em: string;
}

export interface CommunityMessage {
  id: number;
  comunidade_id: number;
  user_id: string;
  user_nome: string;
  mensagem: string;
  criada_em: string;
}
