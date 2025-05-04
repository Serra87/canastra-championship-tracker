
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
 * Melhorada para tratar melhor os arrays vazios ou undefined
 */
export function verificarDuplaDisponivel(duplaId: DuplaId, rodadaId: RodadaId, torneio: Torneio): boolean {
  // Verifica se rodadas é um array válido
  if (!Array.isArray(torneio.rodadas)) return true;
  
  // Encontra a rodada pelo ID
  const rodada = torneio.rodadas.find(r => r?.id === rodadaId);
  
  // Verifica se a rodada existe e se partidas é um array válido
  if (!rodada || !Array.isArray(rodada.partidas)) return true;
  
  // Verificar se a dupla já está em alguma partida na rodada
  const jaParticipando = rodada.partidas.some(
    partida => partida?.duplaUmId === duplaId || partida?.duplaDoisId === duplaId
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

/**
 * Verifica se todas as partidas de uma rodada estão finalizadas
 */
export function rodadaCompleta(rodada?: Rodada): boolean {
  if (!rodada || !Array.isArray(rodada.partidas) || rodada.partidas.length === 0) {
    return false;
  }
  
  return rodada.partidas.every(partida => partida.status === StatusPartida.FINALIZADA);
}

/**
 * Obtém todos os vencedores de uma rodada
 */
export function obterVencedoresDaRodada(rodada?: Rodada): DuplaId[] {
  if (!rodada || !Array.isArray(rodada.partidas)) {
    return [];
  }
  
  return rodada.partidas
    .filter(partida => partida.status === StatusPartida.FINALIZADA && partida.vencedor)
    .map(partida => partida.vencedor as DuplaId);
}

/**
 * Gera um placar público para exibição externa
 */
export function gerarPlacarPublico(torneio: Torneio) {
  if (!Array.isArray(torneio.rodadas) || !Array.isArray(torneio.duplas)) {
    return [];
  }
  
  const buscarNomeDaDupla = (duplaId?: DuplaId): string => {
    if (!duplaId) return "Desconhecido";
    const dupla = torneio.duplas.find(d => d.id === duplaId);
    return dupla?.nome || "Desconhecido";
  };
  
  return torneio.rodadas
    .filter(r => Array.isArray(r.partidas) && r.partidas.every(p => p.vencedor))
    .sort((a, b) => a.numero - b.numero)
    .map(rodada => ({
      rodada: rodada.numero,
      partidas: rodada.partidas.map(p => ({
        duplaA: buscarNomeDaDupla(p.duplaUmId),
        duplaB: buscarNomeDaDupla(p.duplaDoisId),
        pontosA: p.pontosDuplaUm,
        pontosB: p.pontosDuplaDois,
        vencedora: buscarNomeDaDupla(p.vencedor),
      }))
    }));
}

/**
 * Verifica e limpa dados do torneio corrompidos no localStorage
 */
export function verificarELimparDadosTorneio(): Torneio {
  try {
    const dadosSalvos = localStorage.getItem("canastra-tournament");
    
    if (!dadosSalvos) {
      return criarNovoTorneio();
    }
    
    const torneio = JSON.parse(dadosSalvos);
    
    // Verificar se a estrutura básica é válida
    if (!torneio || typeof torneio !== 'object') {
      throw new Error("Estrutura de torneio inválida");
    }
    
    // Verificar se as propriedades essenciais existem e são do tipo correto
    if (!Array.isArray(torneio.duplas)) torneio.duplas = [];
    if (!Array.isArray(torneio.rodadas)) torneio.rodadas = [];
    if (typeof torneio.rodadaAtual !== 'number') torneio.rodadaAtual = 0;
    if (!torneio.id) torneio.id = uuidv4();
    if (!torneio.nome) torneio.nome = "Torneio de Canastra 2025";
    
    // Salvar os dados corrigidos
    localStorage.setItem("canastra-tournament", JSON.stringify(torneio));
    
    return torneio;
  } catch (erro) {
    console.error("Dados do torneio corrompidos. Criando novo torneio:", erro);
    const novoTorneio = criarNovoTorneio();
    localStorage.setItem("canastra-tournament", JSON.stringify(novoTorneio));
    return novoTorneio;
  }
}
