
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTournament } from "@/context/TournamentContext";
import { TeamId, RoundId, Team, MatchStatus, Round } from "@/types/tournament";
import { Plus, CalendarPlus } from "lucide-react";
import MatchCard from "./MatchCard";

export const RoundManagement: React.FC = () => {
  const { 
    tournament, 
    createRound, 
    createMatch,
  } = useTournament();
  
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<RoundId | null>(null);
  const [selectedTeamOneId, setSelectedTeamOneId] = useState<TeamId | "">("");
  const [selectedTeamTwoId, setSelectedTeamTwoId] = useState<TeamId | "">("");

  // Find current round
  const currentRound = tournament.rounds.find(r => r.roundNumber === tournament.currentRound);

  // Get active teams (not eliminated)
  const activeTeams = tournament.teams.filter(team => !team.eliminated);

  const handleCreateRound = () => {
    createRound();
  };

  const handleCreateMatch = () => {
    if (selectedRoundId && selectedTeamOneId && selectedTeamTwoId) {
      createMatch(selectedTeamOneId, selectedTeamTwoId, selectedRoundId);
      setSelectedTeamOneId("");
      setSelectedTeamTwoId("");
      setIsCreatingMatch(false);
    }
  };

  const handleSelectTeamOne = (value: string) => {
    setSelectedTeamOneId(value);
    // Reset team two if it's the same as team one
    if (value === selectedTeamTwoId) {
      setSelectedTeamTwoId("");
    }
  };

  const handleSelectTeamTwo = (value: string) => {
    setSelectedTeamTwoId(value);
    // Reset team one if it's the same as team two
    if (value === selectedTeamOneId) {
      setSelectedTeamOneId("");
    }
  };

  // Helper to get team by id
  const getTeam = (teamId: TeamId): Team | undefined => {
    return tournament.teams.find(team => team.id === teamId);
  };

  // Format date to display
  const formatDate = (date: Date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate match counts for a round
  const getMatchCounts = (round: Round) => {
    const total = round.matches.length;
    const finished = round.matches.filter(m => m.status === MatchStatus.FINISHED).length;
    return { total, finished };
  };

  // Check if there are no matches in the current round
  const noMatches = currentRound && currentRound.matches.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {currentRound
            ? `RODADA ${currentRound.roundNumber}`
            : "Nenhuma Rodada Iniciada"}
        </h2>
        <div className="flex gap-2">
          {currentRound && (
            <Dialog open={isCreatingMatch} onOpenChange={setIsCreatingMatch}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Criar Partida Manual</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Nova Partida</DialogTitle>
                  <DialogDescription>
                    Selecione as duplas que jogarão esta partida.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="teamOne">Dupla 1</Label>
                    <Select
                      value={selectedTeamOneId}
                      onValueChange={handleSelectTeamOne}
                    >
                      <SelectTrigger id="teamOne">
                        <SelectValue placeholder="Selecione a primeira dupla" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTeams
                          .filter(team => team.id !== selectedTeamTwoId)
                          .map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} ({team.lives} vidas)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teamTwo">Dupla 2</Label>
                    <Select
                      value={selectedTeamTwoId}
                      onValueChange={handleSelectTeamTwo}
                    >
                      <SelectTrigger id="teamTwo">
                        <SelectValue placeholder="Selecione a segunda dupla" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTeams
                          .filter(team => team.id !== selectedTeamOneId)
                          .map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} ({team.lives} vidas)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreatingMatch(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateMatch}
                    disabled={!selectedTeamOneId || !selectedTeamTwoId}
                  >
                    Criar Partida
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={handleCreateRound} className="flex items-center gap-2">
            <CalendarPlus size={16} />
            {currentRound ? "Nova Rodada" : "Iniciar Torneio"}
          </Button>
        </div>
      </div>

      {currentRound && currentRound.matches.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Partidas da Rodada Atual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentRound.matches.map(match => {
              const teamOne = getTeam(match.teamOneId);
              const teamTwo = getTeam(match.teamTwoId);
              return (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  teamOne={teamOne} 
                  teamTwo={teamTwo}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center bg-muted/20">
          {currentRound ? (
            <>
              <p className="text-muted-foreground mb-2">
                Nenhuma partida nesta rodada. Use o botão "Criar Partida Manual" para adicionar partidas.
              </p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => {
                  setSelectedRoundId(currentRound.id);
                  setIsCreatingMatch(true);
                }}
              >
                <Plus size={16} className="mr-2" />
                Criar Partida
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              Clique em "Iniciar Torneio" para começar a primeira rodada.
            </p>
          )}
        </div>
      )}

      {tournament.rounds.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Histórico de Rodadas</h3>
          <Accordion type="single" collapsible className="border rounded-md">
            {tournament.rounds
              .sort((a, b) => b.roundNumber - a.roundNumber) // Sort in descending order
              .map(round => {
                const { total, finished } = getMatchCounts(round);
                return (
                  <AccordionItem key={round.id} value={round.id}>
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Rodada {round.roundNumber}</span>
                          <span className="text-sm text-muted-foreground">
                            ({formatDate(round.createdAt)})
                          </span>
                        </div>
                        <span className="text-sm px-2 py-1 rounded-full bg-secondary">
                          {finished}/{total} partidas
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {round.matches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {round.matches.map(match => {
                            const teamOne = getTeam(match.teamOneId);
                            const teamTwo = getTeam(match.teamTwoId);
                            return (
                              <MatchCard 
                                key={match.id} 
                                match={match} 
                                teamOne={teamOne} 
                                teamTwo={teamTwo}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhuma partida nesta rodada.
                        </div>
                      )}
                      {round.id !== currentRound?.id && (
                        <div className="mt-4 text-right">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRoundId(round.id);
                              setIsCreatingMatch(true);
                            }}
                          >
                            <Plus size={14} className="mr-1" />
                            Adicionar Partida
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default RoundManagement;
