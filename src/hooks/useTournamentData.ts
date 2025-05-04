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
  podeReinscrever,
  verificarDuplaDisponivel,
  restaurarVida,
  verificarELimparDadosTorneio,
  rodadaCompleta,
  obterVencedoresDaRodada,
  gerarPlacarPublico
} from "../utils/tournamentUtils";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/sonner";

// Função para obter o torneio do localStorage com verificação de dados
const obterTorneioDoStorage = (): Torneio => {
  return verificarELimparDadosTorneio();
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
      duplas: [...(Array.isArray(anterior.duplas) ? anterior.duplas : []), novaDupla]
    }));

    toast.success("Dupla adicionada com sucesso");
    return novaDupla;
  };

  const atualizarDupla = (duplaAtualizada: Dupla) => {
    setTorneio(anterior => ({
      ...anterior,
      duplas: Array.isArray(anterior.duplas) 
        ? anterior.duplas.map(dupla => 
            dupla.id === duplaAtualizada.id ? duplaAtualizada : dupla
          )
        : [duplaAtualizada]
    }));
    toast.success("Dupla atualizada com sucesso");
  };

  const removerDupla = (duplaId: DuplaId) => {
    setTorneio(anterior => ({
      ...anterior,
      duplas: Array.isArray(anterior.duplas) 
        ? anterior.duplas.filter(dupla => dupla.id !== duplaId)
        : []
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
      duplas: Array.isArray(anterior.duplas) 
        ? anterior.duplas.map(dupla => 
            dupla.id === duplaId ? { ...dupla, vidas: 1, eliminada: false, reinscrita: true } : dupla
          )
        : []
    }));
    toast.success("Dupla reinscrita com sucesso");
  };

  // Operações de Rodadas - CORRIGIDO para usar o maior número + 1
  const criarRodada = (): Rodada => {
    // Usar o maior número de rodada existente + 1
    const rodadasArray = Array.isArray(torneio.rodadas) ? torneio.rodadas : [];
    const maiorNumero = Math.max(...rodadasArray.map(r => r.numero ?? 0).concat([0]));
    const novoNumero = maiorNumero + 1;
    
    const novaRodada: Rodada = {
      id: uuidv4(),
      numero: novoNumero,
      partidas: [],
      completa: false,
      criadaEm: new Date()
    };

    setTorneio(anterior => ({
      ...anterior,
      rodadas: [...(Array.isArray(anterior.rodadas) ? anterior.rodadas : []), novaRodada],
      rodadaAtual: novoNumero
    }));

    toast.success(`Rodada ${novoNumero} criada`);
    return novaRodada;
  };

  const completarRodada = (rodadaId: RodadaId) => {
    setTorneio(anterior => ({
      ...anterior,
      rodadas: Array.isArray(anterior.rodadas) 
        ? anterior.rodadas.map(rodada => 
            rodada.id === rodadaId ? { ...rodada, completa: true } : rodada
          )
        : []
    }));
    toast.success("Rodada finalizada");
  };

  // Nova função para avançar para a próxima rodada automaticamente
  const avancarRodada = () => {
    // Encontrar a rodada atual
    const rodadaAtual = Array.isArray(torneio.rodadas) 
      ? torneio.rodadas.find(r => r.numero === torneio.rodadaAtual)
      : undefined;
    
    // Verificar se a rodada atual está completa
    if (!rodadaCompleta(rodadaAtual)) {
      toast.error("Todas as partidas da rodada atual devem estar finalizadas antes de avançar");
      return null;
    }
    
    // Obter os vencedores da rodada atual
    const vencedores = obterVencedoresDaRodada(rodadaAtual);
    
    // Verificar se há vencedores suficientes
    if (vencedores.length < 2) {
      toast.warning("Não há duplas suficientes para criar a próxima rodada");
      return null;
    }
    
    // Calcular o novo número da rodada
    const rodadasArray = Array.isArray(torneio.rodadas) ? torneio.rodadas : [];
    const maiorNumero = Math.max(...rodadasArray.map(r => r.numero ?? 0).concat([0]));
    const novoNumero = maiorNumero + 1;
    
    // Criar partidas para a próxima rodada com os vencedores da rodada atual
    const novasPartidas: Partida[] = [];
    for (let i = 0; i < vencedores.length; i += 2) {
      // Se houver um número ímpar de vencedores, o último avança automaticamente
      if (i + 1 >= vencedores.length) {
        toast.info(`A dupla ${torneio.duplas?.find(d => d.id === vencedores[i])?.nome} avança automaticamente`);
        continue;
      }
      
      // Criar a partida entre os vencedores
      novasPartidas.push({
        id: uuidv4(),
        rodadaId: "", // Será atualizado após a criação da rodada
        duplaUmId: vencedores[i],
        duplaDoisId: vencedores[i + 1],
        pontosDuplaUm: 0,
        pontosDuplaDois: 0,
        status: StatusPartida.AGUARDANDO
      });
    }
    
    // Criar a nova rodada
    const novaRodada: Rodada = {
      id: uuidv4(),
      numero: novoNumero,
      partidas: [],
      completa: false,
      criadaEm: new Date()
    };
    
    // Atualizar os IDs das partidas com o ID da nova rodada
    const partidasAtualizadas = novasPartidas.map(p => ({
      ...p,
      rodadaId: novaRodada.id
    }));
    
    // Atualizar a rodada com as partidas
    novaRodada.partidas = partidasAtualizadas;
    
    // Atualizar o estado do torneio
    setTorneio(anterior => ({
      ...anterior,
      rodadas: [...(Array.isArray(anterior.rodadas) ? anterior.rodadas : []), novaRodada],
      rodadaAtual: novoNumero
    }));
    
    // Finalizar a rodada anterior
    if (rodadaAtual) {
      completarRodada(rodadaAtual.id);
    }
    
    toast.success(`Rodada ${novoNumero} criada com ${partidasAtualizadas.length} partidas`);
    return novaRodada;
  };

  // Operações de Partidas
  const criarPartida = (duplaUmId: DuplaId, duplaDoisId: DuplaId, rodadaId: RodadaId): Partida | null => {
    // Validar IDs
    if (!duplaUmId || !duplaDoisId || !rodadaId) {
      toast.error("IDs inválidos ao criar partida");
      return null;
    }
    
    // Verificar se os IDs das duplas são diferentes
    if (duplaUmId === duplaDoisId) {
      toast.error("Uma dupla não pode jogar contra si mesma");
      return null;
    }

    // Verificar se as duplas existem
    const duplaUmExiste = Array.isArray(torneio.duplas) && torneio.duplas.some(d => d.id === duplaUmId);
    const duplaDoisExiste = Array.isArray(torneio.duplas) && torneio.duplas.some(d => d.id === duplaDoisId);
    
    if (!duplaUmExiste || !duplaDoisExiste) {
      toast.error("Uma ou ambas as duplas não existem");
      return null;
    }
    
    // Verificar se a rodada existe
    const rodadaExiste = Array.isArray(torneio.rodadas) && torneio.rodadas.some(r => r.id === rodadaId);
    
    if (!rodadaExiste) {
      toast.error("Rodada não encontrada");
      return null;
    }

    // Verificar se as duplas estão disponíveis nesta rodada
    const duplaUmDisponivel = verificarDuplaDisponivel(duplaUmId, rodadaId, torneio);
    const duplaDoisDisponivel = verificarDuplaDisponivel(duplaDoisId, rodadaId, torneio);

    if (!duplaUmDisponivel || !duplaDoisDisponivel) {
      const duplaIndisponivel = !duplaUmDisponivel 
        ? torneio.duplas?.find(d => d.id === duplaUmId)?.nome 
        : torneio.duplas?.find(d => d.id === duplaDoisId)?.nome;
        
      toast.error(`Dupla ${duplaIndisponivel} já está em uma partida nesta rodada`);
      return null;
    }

    // Criar a nova partida
    const partida: Partida = {
      id: uuidv4(),
      rodadaId,
      duplaUmId,
      duplaDoisId,
      pontosDuplaUm: 0,
      pontosDuplaDois: 0,
      status: StatusPartida.AGUARDANDO
    };

    // Atualizar o estado do torneio
    setTorneio(anterior => {
      // Verificar se rodadas é um array
      const rodadasAtualizadas = Array.isArray(anterior.rodadas) 
        ? anterior.rodadas.map(rodada => {
            if (rodada.id === rodadaId) {
              // Verificar se partidas é um array
              const partidasAtuais = Array.isArray(rodada.partidas) ? rodada.partidas : [];
              return {
                ...rodada,
                partidas: [...partidasAtuais, partida]
              };
            }
            return rodada;
          })
        : [];
      
      return {
        ...anterior,
        rodadas: rodadasAtualizadas
      };
    });

    // Obter nomes das duplas para o toast
    const duplaUm = Array.isArray(torneio.duplas) ? torneio.duplas.find(d => d.id === duplaUmId) : undefined;
    const duplaDois = Array.isArray(torneio.duplas) ? torneio.duplas.find(d => d.id === duplaDoisId) : undefined;
    
    toast.success(`Partida criada`, {
      description: `${duplaUm?.nome || "Dupla 1"} vs ${duplaDois?.nome || "Dupla 2"}`
    });

    return partida;
  };

  const atualizarStatusPartida = (partidaId: PartidaId, status: StatusPartida) => {
    setTorneio(anterior => ({
      ...anterior,
      rodadas: Array.isArray(anterior.rodadas) 
        ? anterior.rodadas.map(rodada => ({
            ...rodada,
            partidas: Array.isArray(rodada.partidas)
              ? rodada.partidas.map(partida => {
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
              : []
          }))
        : []
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
      rodadas: Array.isArray(anterior.rodadas) 
        ? anterior.rodadas.map(rodada => ({
            ...rodada,
            partidas: Array.isArray(rodada.partidas)
              ? rodada.partidas.map(partida => {
                  if (partida.id === partidaId) {
                    return { 
                      ...partida, 
                      pontosDuplaUm, 
                      pontosDuplaDois 
                    };
                  }
                  return partida;
                })
              : []
          }))
        : []
    }));
  };

  const finalizarPartida = (partidaId: PartidaId, pontosDuplaUm: number, pontosDuplaDois: number) => {
    let partida: Partida | undefined;
    let duplasAtualizadas: Dupla[] = Array.isArray(torneio.duplas) ? [...torneio.duplas] : [];
    let rodadasAtualizadas = Array.isArray(torneio.rodadas) ? [...torneio.rodadas] : [];
    
    // Encontrar a partida primeiro para trabalhar com ela
    if (Array.isArray(torneio.rodadas)) {
      torneio.rodadas.forEach(rodada => {
        if (Array.isArray(rodada.partidas)) {
          const partidaEncontrada = rodada.partidas.find(p => p.id === partidaId);
          if (partidaEncontrada) {
            partida = partidaEncontrada;
          }
        }
      });
    }
    
    if (!partida) return;
    
    // Atualizar os pontos primeiro
    rodadasAtualizadas = rodadasAtualizadas.map(rodada => ({
      ...rodada,
      partidas: Array.isArray(rodada.partidas)
        ? rodada.partidas.map(p => {
            if (p.id === partidaId) {
              return { ...p, pontosDuplaUm, pontosDuplaDois };
            }
            return p;
          })
        : []
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
      partidas: Array.isArray(rodada.partidas)
        ? rodada.partidas.map(p => {
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
        : []
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
    const duplaVencedora = torneio.duplas?.find(d => d.id === vencedorId);
    const duplaPerdedora = torneio.duplas?.find(d => d.id === perdedorId);
    
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
    if (Array.isArray(torneio.rodadas)) {
      torneio.rodadas.forEach(rodada => {
        if (Array.isArray(rodada.partidas)) {
          const partidaEncontrada = rodada.partidas.find(p => p.id === partidaId);
          if (partidaEncontrada && partidaEncontrada.status === StatusPartida.FINALIZADA) {
            partida = partidaEncontrada;
          }
        }
      });
    }
    
    if (!partida || !partida.vencedor || !partida.perdedor) {
      toast.error("Não é possível reverter uma partida não finalizada");
      return;
    }
    
    // Reverter o resultado da partida e atualizar vidas
    setTorneio(anterior => {
      // Primeiro restaurar a vida do perdedor
      const duplasAtualizadas = Array.isArray(anterior.duplas)
        ? anterior.duplas.map(dupla => {
            if (dupla.id === partida?.perdedor) {
              return {
                ...dupla,
                vidas: dupla.vidas + 1,
                eliminada: false
              };
            }
            return dupla;
          })
        : [];

      // Depois atualizar a partida
      const rodadasAtualizadas = Array.isArray(anterior.rodadas)
        ? anterior.rodadas.map(rodada => ({
            ...rodada,
            partidas: Array.isArray(rodada.partidas)
              ? rodada.partidas.map(p => {
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
              : []
          }))
        : [];

      return {
        ...anterior,
        duplas: duplasAtualizadas,
        rodadas: rodadasAtualizadas
      };
    });
    
    toast.success("Resultado da partida revertido");
  };

  // Nova função para remover partida 
  const removerPartida = (partidaId: PartidaId) => {
    let partida: Partida | undefined;
    
    // Encontrar a partida primeiro para ver se está finalizada
    if (Array.isArray(torneio.rodadas)) {
      torneio.rodadas.forEach(rodada => {
        if (Array.isArray(rodada.partidas)) {
          const partidaEncontrada = rodada.partidas.find(p => p.id === partidaId);
          if (partidaEncontrada) {
            partida = partidaEncontrada;
          }
        }
      });
    }
    
    if (!partida) {
      toast.error("Partida não encontrada");
      return;
    }

    // Verificar se precisa restaurar vida (se a partida estava finalizada)
    let duplasAtualizadas = Array.isArray(torneio.duplas) ? [...torneio.duplas] : [];
    if (partida.status === StatusPartida.FINALIZADA && partida.perdedor) {
      duplasAtualizadas = restaurarVida(duplasAtualizadas, partida.perdedor);
    }

    // Remover a partida da rodada
    setTorneio(anterior => {
      const rodadasAtualizadas = Array.isArray(anterior.rodadas)
        ? anterior.rodadas.map(rodada => ({
            ...rodada,
            partidas: Array.isArray(rodada.partidas)
              ? rodada.partidas.filter(p => p.id !== partidaId)
              : []
          }))
        : [];

      return {
        ...anterior,
        duplas: duplasAtualizadas,
        rodadas: rodadasAtualizadas
      };
    });
    
    toast.success("Partida removida com sucesso");
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
    avancarRodada,  // Nova função exportada
    // Operações de partidas
    criarPartida,
    atualizarStatusPartida,
    atualizarPlacar,
    finalizarPartida,
    reverterResultadoPartida,
    removerPartida,
    // Utilitários
    gerarPlacarPublico // Nova função exportada
  };
}
