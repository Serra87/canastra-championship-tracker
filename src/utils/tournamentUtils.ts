
import { Dupla, Torneio, Partida, DuplaId, StatusPartida, RodadaId } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Verifica se uma dupla pode ser reinscrita no torneio
 */
export function podeReinscrever(dupla: Dupla, rodadaAtual: number): boolean {
  return dupla.eliminada && rodadaAtual <= 5 && !dupla.reinscrita;
}

/**
 * Atualiza as vidas de uma dupla
 */
export function atualizarVidas(duplas: Dupla[], perdedorId: DuplaId): Dupla[] {
  return Array.isArray(duplas)
    ? duplas.map(dupla => {
        if (dupla.id === perdedorId) {
          const novasVidas = dupla.vidas - 1;
          return {
            ...dupla,
            vidas: novasVidas,
            eliminada: novasVidas <= 0
          };
        }
        return dupla;
      })
    : [];
}

/**
 * Determina vencedor da partida com base na pontuação
 */
export function determinarVencedor(partida: Partida): { vencedorId: DuplaId, perdedorId: DuplaId } {
  const { duplaUmId, duplaDoisId, pontosDuplaUm, pontosDuplaDois } = partida;
  
  const vencedorId = pontosDuplaUm >= 4000 ? duplaUmId : 
                     pontosDuplaDois >= 4000 ? duplaDoisId : 
                     pontosDuplaUm > pontosDuplaDois ? duplaUmId : duplaDoisId;
                     
  const perdedorId = vencedorId === duplaUmId ? duplaDoisId : duplaUmId;
  
  return { vencedorId, perdedorId };
}

/**
 * Formata uma data para exibição
 */
export function formatarData(data: Date): string {
  const dataObj = new Date(data);
  return dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Sorteia duplas ativas (não eliminadas) para partidas
 */
export function sortearDuplasAtivas(torneio: Torneio): Dupla[] {
  const duplasAtivas = Array.isArray(torneio.duplas)
    ? torneio.duplas.filter(dupla => !dupla.eliminada)
    : [];
    
  // Embaralhar o array de duplas ativas
  return [...duplasAtivas].sort(() => Math.random() - 0.5);
}

/**
 * Cria um novo objeto torneio com valores iniciais
 */
export function criarNovoTorneio(nome: string = "Torneio de Canastra 2025"): Torneio {
  return {
    id: uuidv4(),
    nome,
    duplas: [], // Garantir que começa como array vazio
    rodadas: [], // Garantir que começa como array vazio
    rodadaAtual: 0
  };
}

/**
 * Verifica se uma dupla já está participando de alguma partida na mesma rodada
 */
export function verificarDuplaDisponivel(duplaId: DuplaId, rodadaId: RodadaId, torneio: Torneio): boolean {
  if (!Array.isArray(torneio.rodadas)) return true;
  
  const rodada = torneio.rodadas.find(r => r.id === rodadaId);
  if (!rodada || !Array.isArray(rodada.partidas)) return true; // Se a rodada não existir, a dupla está disponível
  
  // Verificar se a dupla já está em alguma partida na rodada
  const jaParticipando = rodada.partidas.some(
    partida => partida.duplaUmId === duplaId || partida.duplaDoisId === duplaId
  );
  
  return !jaParticipando; // Retorna true se a dupla estiver disponível
}

/**
 * Restaura a vida de uma dupla (usado quando uma partida é removida)
 */
export function restaurarVida(duplas: Dupla[], duplaId: DuplaId): Dupla[] {
  return Array.isArray(duplas)
    ? duplas.map(dupla => {
        if (dupla.id === duplaId) {
          const novasVidas = dupla.vidas + 1;
          return {
            ...dupla,
            vidas: novasVidas,
            eliminada: false // Se a dupla havia sido eliminada, agora não está mais
          };
        }
        return dupla;
      })
    : [];
}
