
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTournament } from "@/context/TournamentProvider";
import { Partida, StatusPartida, Dupla } from "@/types";

const LiveScoreboard: React.FC = () => {
  const { torneio } = useTournament();
  
  // Find current round
  const rodadaAtual = torneio.rodadas.find(r => r.numero === torneio.rodadaAtual);
  
  // Get active matches
  const partidasAtivas = rodadaAtual?.partidas.filter(p => 
    p.status === StatusPartida.EM_ANDAMENTO || p.status === StatusPartida.AGUARDANDO
  ) || [];
  
  // Get completed matches for the current round
  const partidasFinalizadas = rodadaAtual?.partidas.filter(p => 
    p.status === StatusPartida.FINALIZADA
  ) || [];

  // Helper to get team by id
  const getDupla = (duplaId: string): Dupla | undefined => {
    return torneio.duplas.find(dupla => dupla.id === duplaId);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mt-8 mb-2">TORNEIO DE CANASTRA 2025</h1>
        <p className="text-xl">
          {rodadaAtual ? `RODADA ${rodadaAtual.numero}` : "Torneio não iniciado"}
        </p>
      </div>
      
      {rodadaAtual && (
        <div className="space-y-8">
          {/* Active Matches Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">PARTIDAS EM ANDAMENTO</h2>
            
            {partidasAtivas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partidasAtivas.map(partida => {
                  const duplaUm = getDupla(partida.duplaUmId);
                  const duplaDois = getDupla(partida.duplaDoisId);
                  
                  if (!duplaUm || !duplaDois) return null;
                  
                  return (
                    <MatchScoreCard 
                      key={partida.id}
                      partida={partida}
                      duplaUm={duplaUm}
                      duplaDois={duplaDois}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/10">
                <p className="text-lg text-muted-foreground">Nenhuma partida em andamento</p>
              </div>
            )}
          </div>
          
          {/* Recent Results Section */}
          {partidasFinalizadas.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center mb-6">RESULTADOS RECENTES</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partidasFinalizadas.map(partida => {
                  const duplaUm = getDupla(partida.duplaUmId);
                  const duplaDois = getDupla(partida.duplaDoisId);
                  
                  if (!duplaUm || !duplaDois) return null;
                  
                  return (
                    <MatchResultCard 
                      key={partida.id}
                      partida={partida}
                      duplaUm={duplaUm}
                      duplaDois={duplaDois}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!rodadaAtual && (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-6xl text-muted-foreground">🃏</div>
          <h2 className="text-2xl mt-4">O torneio começará em breve</h2>
          <p className="text-muted-foreground mt-2">Aguarde o início da primeira rodada</p>
        </div>
      )}
    </div>
  );
};

interface MatchCardProps {
  partida: Partida;
  duplaUm: Dupla;
  duplaDois: Dupla;
}

const MatchScoreCard: React.FC<MatchCardProps> = ({ partida, duplaUm, duplaDois }) => {
  const isInProgress = partida.status === StatusPartida.EM_ANDAMENTO;
  
  return (
    <Card className="overflow-hidden card-shadow">
      <CardHeader className="bg-muted/20 pb-2 flex justify-between items-center">
        <Badge variant={isInProgress ? "secondary" : "outline"}>
          {isInProgress ? "Em Andamento" : "Aguardando"}
        </Badge>
        <div className="text-xs text-muted-foreground">
          Mesa {partida.id.slice(-2)}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-5 gap-2 items-center">
          {/* Team One */}
          <div className="col-span-2 text-center">
            <div className="font-semibold">{duplaUm.nome}</div>
            <div className="mt-1">
              <Badge variant="outline">
                {duplaUm.vidas} vida{duplaUm.vidas !== 1 && "s"}
              </Badge>
            </div>
          </div>

          {/* Score */}
          <div className="text-center font-bold text-xl">
            {isInProgress ? (
              <span>{partida.pontosDuplaUm} - {partida.pontosDuplaDois}</span>
            ) : (
              <span className="text-muted-foreground">VS</span>
            )}
          </div>

          {/* Team Two */}
          <div className="col-span-2 text-center">
            <div className="font-semibold">{duplaDois.nome}</div>
            <div className="mt-1">
              <Badge variant="outline">
                {duplaDois.vidas} vida{duplaDois.vidas !== 1 && "s"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MatchResultCard: React.FC<MatchCardProps> = ({ partida, duplaUm, duplaDois }) => {
  const winner = partida.vencedor === duplaUm.id ? duplaUm : duplaDois;
  const loser = partida.vencedor !== duplaUm.id ? duplaUm : duplaDois;
  
  return (
    <Card className="overflow-hidden border-green-300 bg-green-50/30 card-shadow">
      <CardContent className="pt-6 pb-6">
        <div className="text-center mb-2">
          <Badge variant="default" className="bg-green-600">Finalizada</Badge>
        </div>
        
        <div className="text-center font-bold text-xl mb-3">
          {partida.pontosDuplaUm} - {partida.pontosDuplaDois}
        </div>
        
        <div className="space-y-2 text-center">
          <div>
            <Badge variant="default" className="mb-1">Vencedor</Badge>
            <div className="font-semibold">{winner.nome}</div>
          </div>
          
          <div className="text-sm text-muted-foreground">vs</div>
          
          <div>
            <Badge variant="outline" className="mb-1">Perdedor</Badge>
            <div className="font-semibold">{loser.nome}</div>
            <div className="text-xs text-red-500 mt-1">
              (-1 vida)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveScoreboard;
