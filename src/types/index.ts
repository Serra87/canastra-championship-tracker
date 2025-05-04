
// Tipos base para IDs
export type DuplaId = string;
export type RodadaId = string;
export type PartidaId = string;

// Enumeração para status da partida
export enum StatusPartida {
  AGUARDANDO = "AGUARDANDO",
  EM_ANDAMENTO = "EM_ANDAMENTO",
  FINALIZADA = "FINALIZADA"
}

// Interface para jogador
export interface Jogador {
  id: string;
  nome: string;
  contato?: string;
}

// Interface para dupla
export interface Dupla {
  id: DuplaId;
  nome: string;
  jogadores: Jogador[];
  vidas: number;
  eliminada: boolean;
  reinscrita: boolean;
}

// Interface para partida
export interface Partida {
  id: PartidaId;
  rodadaId: RodadaId;
  duplaUmId: DuplaId;
  duplaDoisId: DuplaId;
  pontosDuplaUm: number;
  pontosDuplaDois: number;
  vencedor?: DuplaId;
  perdedor?: DuplaId;
  status: StatusPartida;
  horaInicio?: Date;
  horaFim?: Date;
}

// Interface para rodada
export interface Rodada {
  id: RodadaId;
  numero: number;
  partidas: Partida[];
  completa: boolean;
  criadaEm: Date;
}

// Interface para torneio
export interface Torneio {
  id: string;
  nome: string;
  duplas: Dupla[];
  rodadas: Rodada[];
  rodadaAtual: number;
}

// Mapeamento entre tipos antigos e novos para facilitar a migração
export const TiposMapeamento = {
  // Status de partida
  StatusPartida: {
    AGUARDANDO: StatusPartida.AGUARDANDO,
    EM_ANDAMENTO: StatusPartida.EM_ANDAMENTO,
    FINALIZADA: StatusPartida.FINALIZADA
  }
};
