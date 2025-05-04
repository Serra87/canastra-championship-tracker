
import { useState, useEffect } from "react";
import {
  Torneio,
  Dupla,
  Rodada,
  Partida,
  StatusPartida,
  DuplaId,
  RodadaId,
  PartidaId,
  Jogador
} from "../types";
import {
  atualizarVidas,
  criarNovoTorneio,
  determinarVencedor,
  podeReinscrever
} from "../utils/tournamentUtils";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/sonner";

// Função para obter o torneio do localStorage
const obterTorneioDoStorage = (): Torneio => {
  const torneioSalvo = localStorage.getItem("canastra-tournament");
  if (torneioSalvo) {
    return JSON.parse(torneioSalvo);
  }
  return criarNovoTorneio();
};

// Função para salvar o torneio no localStorage
const salvarTorneioNoStorage = (torneio: Torneio): void => {
  localStorage.setItem("canastra-tournament", JSON.stringify(torneio));
};

export function useTournamentData() {
  const [torneio, setTorneio] = useState<Torneio>(criarNovoTorneio());
  const [carregando, setCarregando] = useState<boolean>(true);

  // Carregar os dados do torneio ao iniciar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const torneioSalvo = obterTorneioDoStorage();
        setTorneio(torneioSalvo);
      } catch (erro) {
        console.error("Falha ao carregar dados do torneio:", erro);
        toast.error("Falha ao carregar dados do torneio");
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, []);

  // Salvar os dados do torneio quando houver alterações
  useEffect(() => {
    if (!carregando) {
      salvarTorneioNoStorage(torneio);
    }
  }, [torneio, carregando]);

  // Operações de Duplas
  const adicionarDupla = (dadosDupla: Omit<Dupla, "id" | "vidas" | "eliminada" | "reinscrita">): Dupla => {
    const novaDupla: Dupla = {
      id: uuidv4(),
      ...dadosDupla,
      vidas: 2,
      eliminada: false,
      reinscrita: false
    };

    setTorneio(anterior => ({
      ...anterior,
      duplas: [...anterior.duplas, novaDupla]
    }));

    toast.success("Dupla adicionada com sucesso");
    return novaDupla;
  };

  const atualizarDupla = (duplaAtualizada: Dupla) => {
    setTorneio(anterior => ({
      ...anterior,
      duplas: anterior.duplas.map(dupla => 
        dupla.id === duplaAtualizada.id ? duplaAtualizada : dupla
      )
    }));
    toast.success("Dupla atualizada com sucesso");
  };

  const removerDupla = (duplaId: DuplaId) => {
    setTorneio(anterior => ({
      ...anterior,
      duplas: anterior.duplas.filter(dupla => dupla.id !== duplaId)
    }));
    toast.success("Dupla removida com sucesso");
  };

  const reinscreverDupla = (duplaId: DuplaId) => {
    if (torneio.rodadaAtual >= 5) {
      toast.error("Não é possível reinscrever após a 5ª rodada");
      return;
    }

    setTorneio(anterior => ({
      ...anterior,
      duplas: anterior.duplas.map(dupla => 
        dupla.id === duplaId ? { ...dupla, vidas: 1, eliminada: false, reinscrita: true } : dupla
      )
    }));
    toast.success("Dupla reinscrita com sucesso");
  };

  // Operações de Rodadas
  const criarRodada = (): Rodada => {
    const novoNumero = torneio.rodadaAtual + 1;
    const novaRodada: Rodada = {
      id: uuidv4(),
      numero: novoNumero,
      partidas: [],
      completa: false,
      criadaEm: new Date()
    };

    setTorneio(anterior => ({
      ...anterior,
      rodadas: [...anterior.rodadas, novaRodada],
      rodadaAtual: novoNumero
    }));

    toast.success(`Rodada ${novoNumero} criada`);
    return novaRodada;
  };

  const completarRodada = (rodadaId: RodadaId) => {
    setTorneio(anterior => ({
      ...anterior,
      rodadas: anterior.rodadas.map(rodada => 
        rodada.id === rodadaId ? { ...rodada, completa: true } : rodada
      )
    }));
    toast.success("Rodada finalizada");
  };

  // Operações de Partidas
  const criarPartida = (duplaUmId: DuplaId, duplaDoisId: DuplaId, rodadaId: RodadaId): Partida => {
    const partida: Partida = {
      id: uuidv4(),
      rodadaId,
      duplaUmId,
      duplaDoisId,
      pontosDuplaUm: 0,
      pontosDuplaDois: 0,
      status: StatusPartida.AGUARDANDO
    };

    setTorneio(anterior => ({
      ...anterior,
      rodadas: anterior.rodadas.map(rodada => {
        if (rodada.id === rodadaId) {
          return {
            ...rodada,
            partidas: [...rodada.partidas, partida]
          };
        }
        return rodada;
      })
    }));

    // Obter nomes das duplas para o toast
    const duplaUm = torneio.duplas.find(d => d.id === duplaUmId);
    const duplaDois = torneio.duplas.find(d => d.id === duplaDoisId);
    toast.success(`Partida criada`, {
      description: `${duplaUm?.nome} vs ${duplaDois?.nome}`
    });

    return partida;
  };

  const atualizarStatusPartida = (partidaId: PartidaId, status: StatusPartida) => {
    setTorneio(anterior => ({
      ...anterior,
      rodadas: anterior.rodadas.map(rodada => ({
        ...rodada,
        partidas: rodada.partidas.map(partida => {
          if (partida.id === partidaId) {
            const partidaAtualizada = { ...partida, status };
            
            // Se mudando para EM_ANDAMENTO, definir hora de início
            if (status === StatusPartida.EM_ANDAMENTO) {
              partidaAtualizada.horaInicio = new Date();
            }
            
            return partidaAtualizada;
          }
          return partida;
        })
      }))
    }));
    
    const mensagensStatus = {
      [StatusPartida.AGUARDANDO]: "Partida aguardando início",
      [StatusPartida.EM_ANDAMENTO]: "Partida iniciada",
      [StatusPartida.FINALIZADA]: "Partida finalizada"
    };
    
    toast.success(mensagensStatus[status]);
  };

  const atualizarPlacar = (partidaId: PartidaId, pontosDuplaUm: number, pontosDuplaDois: number) => {
    setTorneio(anterior => ({
      ...anterior,
      rodadas: anterior.rodadas.map(rodada => ({
        ...rodada,
        partidas: rodada.partidas.map(partida => {
          if (partida.id === partidaId) {
            return { 
              ...partida, 
              pontosDuplaUm, 
              pontosDuplaDois 
            };
          }
          return partida;
        })
      }))
    }));
  };

  const finalizarPartida = (partidaId: PartidaId, pontosDuplaUm: number, pontosDuplaDois: number) => {
    let partida: Partida | undefined;
    let duplasAtualizadas: Dupla[] = [...torneio.duplas];
    let rodadasAtualizadas = [...torneio.rodadas];
    
    // Encontrar a partida primeiro para trabalhar com ela
    torneio.rodadas.forEach(rodada => {
      const partidaEncontrada = rodada.partidas.find(p => p.id === partidaId);
      if (partidaEncontrada) {
        partida = partidaEncontrada;
      }
    });
    
    if (!partida) return;
    
    // Atualizar os pontos primeiro
    rodadasAtualizadas = rodadasAtualizadas.map(rodada => ({
      ...rodada,
      partidas: rodada.partidas.map(p => {
        if (p.id === partidaId) {
          return { ...p, pontosDuplaUm, pontosDuplaDois };
        }
        return p;
      })
    }));

    // Determinar o vencedor e perdedor
    const { vencedorId, perdedorId } = determinarVencedor({
      ...partida,
      pontosDuplaUm,
      pontosDuplaDois
    });

    // Atualizar a partida com resultado
    rodadasAtualizadas = rodadasAtualizadas.map(rodada => ({
      ...rodada,
      partidas: rodada.partidas.map(p => {
        if (p.id === partidaId) {
          return {
            ...p,
            pontosDuplaUm,
            pontosDuplaDois,
            vencedor: vencedorId,
            perdedor: perdedorId,
            status: StatusPartida.FINALIZADA,
            horaFim: new Date()
          };
        }
        return p;
      })
    }));

    // Atualizar as vidas do perdedor
    duplasAtualizadas = atualizarVidas(duplasAtualizadas, perdedorId);

    // Atualizar o estado do torneio
    setTorneio(anterior => ({
      ...anterior,
      duplas: duplasAtualizadas,
      rodadas: rodadasAtualizadas
    }));

    // Encontrar duplas para mensagem toast
    const duplaVencedora = torneio.duplas.find(d => d.id === vencedorId);
    const duplaPerdedora = torneio.duplas.find(d => d.id === perdedorId);
    
    if (duplaVencedora && duplaPerdedora) {
      toast.success(`Partida finalizada`, {
        description: `Vencedor: ${duplaVencedora.nome}`
      });
      
      // Verificar se a dupla foi eliminada
      const vidasRestantes = duplaPerdedora.vidas - 1;
      if (vidasRestantes <= 0) {
        toast.error(`Dupla ${duplaPerdedora.nome} foi eliminada!`);
      }
    }
  };

  const reverterResultadoPartida = (partidaId: PartidaId) => {
    let partida: Partida | undefined;
    
    // Encontrar a partida primeiro
    torneio.rodadas.forEach(rodada => {
      const partidaEncontrada = rodada.partidas.find(p => p.id === partidaId);
      if (partidaEncontrada && partidaEncontrada.status === StatusPartida.FINALIZADA) {
        partida = partidaEncontrada;
      }
    });
    
    if (!partida || !partida.vencedor || !partida.perdedor) {
      toast.error("Não é possível reverter uma partida não finalizada");
      return;
    }
    
    // Reverter o resultado da partida e atualizar vidas
    setTorneio(anterior => {
      // Primeiro restaurar a vida do perdedor
      const duplasAtualizadas = anterior.duplas.map(dupla => {
        if (dupla.id === partida?.perdedor) {
          return {
            ...dupla,
            vidas: dupla.vidas + 1,
            eliminada: false
          };
        }
        return dupla;
      });

      // Depois atualizar a partida
      const rodadasAtualizadas = anterior.rodadas.map(rodada => ({
        ...rodada,
        partidas: rodada.partidas.map(p => {
          if (p.id === partidaId) {
            return {
              ...p,
              vencedor: undefined,
              perdedor: undefined,
              status: StatusPartida.EM_ANDAMENTO,
              horaFim: undefined
            };
          }
          return p;
        })
      }));

      return {
        ...anterior,
        duplas: duplasAtualizadas,
        rodadas: rodadasAtualizadas
      };
    });
    
    toast.success("Resultado da partida revertido");
  };

  // Retornar todas as operações e dados
  return {
    torneio,
    carregando,
    // Operações de duplas
    adicionarDupla,
    atualizarDupla,
    removerDupla,
    reinscreverDupla,
    // Operações de rodadas
    criarRodada,
    completarRodada,
    // Operações de partidas
    criarPartida,
    atualizarStatusPartida,
    atualizarPlacar,
    finalizarPartida,
    reverterResultadoPartida
  };
}
