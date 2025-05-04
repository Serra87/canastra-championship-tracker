
import React, { useState } from "react";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTournament } from "@/context/TournamentContext";
import { Match, Team, MatchStatus } from "@/types/tournament";
import { Clock, CheckCircle, PlayCircle, XCircle, Undo2 } from "lucide-react";

interface MatchCardProps {
  match: Match;
  teamOne: Team | undefined;
  teamTwo: Team | undefined;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, teamOne, teamTwo }) => {
  const { updateMatchStatus, updateMatchScore, finishMatch, reverseMatchResult } = useTournament();
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [teamOneScore, setTeamOneScore] = useState(match.teamOneScore);
  const [teamTwoScore, setTeamTwoScore] = useState(match.teamTwoScore);
  const [isConfirmingReverse, setIsConfirmingReverse] = useState(false);

  // If teams don't exist (maybe deleted), show placeholder
  if (!teamOne || !teamTwo) {
    return (
      <Card className="border-2 border-red-300 bg-red-50">
        <CardHeader className="pb-2">
          <Badge variant="destructive">Erro: Dupla não encontrada</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Uma ou ambas as duplas desta partida foram removidas do torneio.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleStartMatch = () => {
    updateMatchStatus(match.id, MatchStatus.IN_PROGRESS);
  };

  const handleSaveScore = () => {
    updateMatchScore(match.id, teamOneScore, teamTwoScore);
    setIsScoreDialogOpen(false);
  };

  const handleFinishMatch = () => {
    finishMatch(match.id, teamOneScore, teamTwoScore);
    setIsScoreDialogOpen(false);
  };

  const handleReverseResult = () => {
    reverseMatchResult(match.id);
    setIsConfirmingReverse(false);
  };

  // Determine status styling
  const getStatusBadge = () => {
    switch (match.status) {
      case MatchStatus.WAITING:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock size={12} /> Aguardando
          </Badge>
        );
      case MatchStatus.IN_PROGRESS:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <PlayCircle size={12} /> Em Andamento
          </Badge>
        );
      case MatchStatus.FINISHED:
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle size={12} /> Finalizada
          </Badge>
        );
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  // Calculate who is winning based on current score
  const getWinningTeam = () => {
    if (match.teamOneScore === match.teamTwoScore) return null;
    return match.teamOneScore > match.teamTwoScore ? teamOne : teamTwo;
  };

  const winningTeam = getWinningTeam();
  const isFinished = match.status === MatchStatus.FINISHED;
  const isWaiting = match.status === MatchStatus.WAITING;
  const isInProgress = match.status === MatchStatus.IN_PROGRESS;

  return (
    <Card className={`overflow-hidden ${isFinished ? 'border-green-300' : ''} card-shadow`}>
      <CardHeader className={`pb-2 flex flex-row justify-between ${isFinished ? 'bg-green-50' : ''}`}>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
        {isFinished && match.winner && (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Vencedor: {match.winner === teamOne.id ? teamOne.name : teamTwo.name}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-5 gap-2 items-center">
          {/* Team One */}
          <div className="col-span-2 text-center">
            <div className="font-semibold truncate">{teamOne.name}</div>
            <div className="text-xs text-muted-foreground">
              {teamOne.players.map(p => p.name).join(" e ")}
            </div>
            <div className="mt-1">
              <Badge variant={match.winner === teamOne.id ? "default" : "outline"}>
                {teamOne.lives} vida{teamOne.lives !== 1 && "s"}
              </Badge>
            </div>
          </div>

          {/* Score */}
          <div className="text-center font-bold text-xl">
            {isWaiting ? (
              <span className="text-muted-foreground">VS</span>
            ) : (
              <span>{match.teamOneScore} - {match.teamTwoScore}</span>
            )}
          </div>

          {/* Team Two */}
          <div className="col-span-2 text-center">
            <div className="font-semibold truncate">{teamTwo.name}</div>
            <div className="text-xs text-muted-foreground">
              {teamTwo.players.map(p => p.name).join(" e ")}
            </div>
            <div className="mt-1">
              <Badge variant={match.winner === teamTwo.id ? "default" : "outline"}>
                {teamTwo.lives} vida{teamTwo.lives !== 1 && "s"}
              </Badge>
            </div>
          </div>
        </div>

        {winningTeam && !isFinished && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {winningTeam.name} está vencendo
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between bg-muted/10 border-t">
        {isWaiting && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleStartMatch}
          >
            <PlayCircle size={16} className="mr-1" />
            Iniciar Partida
          </Button>
        )}

        {(isInProgress || isFinished) && (
          <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={isFinished ? "outline" : "default"}
                size="sm"
                className={`w-full ${isFinished ? 'bg-muted/20' : ''}`}
              >
                {isFinished ? "Editar Placar" : "Atualizar Placar"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {isFinished ? "Editar Placar Final" : "Atualizar Placar"}
                </DialogTitle>
                <DialogDescription>
                  {isFinished
                    ? "Edite o placar final desta partida."
                    : "Insira a pontuação atual da partida."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-5 gap-4 py-4 items-center">
                <div className="col-span-2">
                  <div className="text-center font-semibold mb-2">
                    {teamOne.name}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={teamOneScore}
                    onChange={(e) =>
                      setTeamOneScore(parseInt(e.target.value) || 0)
                    }
                    className="text-center"
                  />
                </div>
                <div className="text-center font-bold">VS</div>
                <div className="col-span-2">
                  <div className="text-center font-semibold mb-2">
                    {teamTwo.name}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={teamTwoScore}
                    onChange={(e) =>
                      setTeamTwoScore(parseInt(e.target.value) || 0)
                    }
                    className="text-center"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsScoreDialogOpen(false)}>
                  Cancelar
                </Button>
                {isFinished ? (
                  <Button onClick={handleSaveScore}>Salvar Edição</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleSaveScore}>
                      Apenas Salvar
                    </Button>
                    <Button 
                      onClick={handleFinishMatch}
                      disabled={teamOneScore < 4000 && teamTwoScore < 4000}
                    >
                      Finalizar Partida
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {isFinished && (
          <AlertDialog
            open={isConfirmingReverse}
            onOpenChange={setIsConfirmingReverse}
          >
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Undo2 size={16} className="mr-1" />
                Reverter
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reverter Resultado</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso reverterá o resultado da partida e restituirá a vida perdida pela dupla derrotada. Tem certeza?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReverseResult}>
                  Sim, reverter
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
};

export default MatchCard;
