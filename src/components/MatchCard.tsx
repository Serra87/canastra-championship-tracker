
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
import { useTournament } from "@/context/TournamentProvider";
import { Partida, Dupla, StatusPartida } from "@/types";
import { Clock, CheckCircle, PlayCircle, XCircle, Undo2, Trash2 } from "lucide-react";

interface MatchCardProps {
  partida: Partida;
  duplaUm: Dupla | undefined;
  duplaDois: Dupla | undefined;
}

const MatchCard: React.FC<MatchCardProps> = ({ partida, duplaUm, duplaDois }) => {
  const { 
    atualizarStatusPartida, 
    atualizarPlacar, 
    finalizarPartida, 
    reverterResultadoPartida,
    removerPartida 
  } = useTournament();
  
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [pontosDuplaUm, setPontosDuplaUm] = useState(partida?.pontosDuplaUm ?? 0);
  const [pontosDuplaDois, setPontosDuplaDois] = useState(partida?.pontosDuplaDois ?? 0);
  const [isConfirmingReverse, setIsConfirmingReverse] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // If teams don't exist (maybe deleted), show placeholder
  if (!duplaUm || !duplaDois) {
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
        <CardFooter>
          <AlertDialog 
            open={isConfirmingDelete}
            onOpenChange={setIsConfirmingDelete}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 size={16} className="mr-1" />
                Remover Partida
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Partida</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta partida possui dados inconsistentes. Tem certeza que deseja removê-la?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    removerPartida(partida.id);
                  }}
                >
                  Sim, remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    );
  }

  const handleStartMatch = () => {
    atualizarStatusPartida(partida.id, StatusPartida.EM_ANDAMENTO);
  };

  const handleSaveScore = () => {
    atualizarPlacar(partida.id, pontosDuplaUm, pontosDuplaDois);
    setIsScoreDialogOpen(false);
  };

  const handleFinishMatch = () => {
    finalizarPartida(partida.id, pontosDuplaUm, pontosDuplaDois);
    setIsScoreDialogOpen(false);
  };

  const handleReverseResult = () => {
    reverterResultadoPartida(partida.id);
    setIsConfirmingReverse(false);
  };

  const handleDeleteMatch = () => {
    removerPartida(partida.id);
    setIsConfirmingDelete(false);
  };

  // Determine status styling
  const getStatusBadge = () => {
    if (!partida) return <Badge>Desconhecido</Badge>;
    
    switch (partida.status) {
      case StatusPartida.AGUARDANDO:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock size={12} /> Aguardando
          </Badge>
        );
      case StatusPartida.EM_ANDAMENTO:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <PlayCircle size={12} /> Em Andamento
          </Badge>
        );
      case StatusPartida.FINALIZADA:
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
    if (!partida || partida.pontosDuplaUm === partida.pontosDuplaDois) return null;
    return partida.pontosDuplaUm > partida.pontosDuplaDois ? duplaUm : duplaDois;
  };

  const winningTeam = getWinningTeam();
  const isFinished = partida?.status === StatusPartida.FINALIZADA;
  const isWaiting = partida?.status === StatusPartida.AGUARDANDO;
  const isInProgress = partida?.status === StatusPartida.EM_ANDAMENTO;

  if (!partida) {
    return (
      <Card className="border-2 border-red-300 bg-red-50">
        <CardHeader className="pb-2">
          <Badge variant="destructive">Erro: Partida inválida</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Os dados desta partida são inválidos ou não estão disponíveis.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`overflow-hidden ${isFinished ? 'border-green-300' : ''} card-shadow`}>
      <CardHeader className={`pb-2 flex flex-row justify-between ${isFinished ? 'bg-green-50' : ''}`}>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
        {isFinished && partida.vencedor && (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Vencedor: {partida.vencedor === duplaUm.id ? duplaUm.nome : duplaDois.nome}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-5 gap-2 items-center">
          {/* Dupla Um */}
          <div className="col-span-2 text-center">
            <div className="font-semibold truncate">{duplaUm?.nome}</div>
            <div className="text-xs text-muted-foreground">
              {Array.isArray(duplaUm?.jogadores) && duplaUm?.jogadores.map(p => p?.nome).join(" e ")}
            </div>
            <div className="mt-1">
              <Badge variant={partida.vencedor === duplaUm?.id ? "default" : "outline"}>
                {duplaUm?.vidas ?? 0} vida{(duplaUm?.vidas !== 1) && "s"}
              </Badge>
            </div>
          </div>

          {/* Score */}
          <div className="text-center font-bold text-xl">
            {isWaiting ? (
              <span className="text-muted-foreground">VS</span>
            ) : (
              <span>{partida.pontosDuplaUm ?? 0} - {partida.pontosDuplaDois ?? 0}</span>
            )}
          </div>

          {/* Dupla Dois */}
          <div className="col-span-2 text-center">
            <div className="font-semibold truncate">{duplaDois?.nome}</div>
            <div className="text-xs text-muted-foreground">
              {Array.isArray(duplaDois?.jogadores) && duplaDois?.jogadores.map(p => p?.nome).join(" e ")}
            </div>
            <div className="mt-1">
              <Badge variant={partida.vencedor === duplaDois?.id ? "default" : "outline"}>
                {duplaDois?.vidas ?? 0} vida{(duplaDois?.vidas !== 1) && "s"}
              </Badge>
            </div>
          </div>
        </div>

        {winningTeam && !isFinished && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {winningTeam.nome} está vencendo
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 justify-between bg-muted/10 border-t">
        {isWaiting && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
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
                className={`flex-1 ${isFinished ? 'bg-muted/20' : ''}`}
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
                    {duplaUm?.nome}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={pontosDuplaUm}
                    onChange={(e) =>
                      setPontosDuplaUm(parseInt(e.target.value) || 0)
                    }
                    className="text-center"
                  />
                </div>
                <div className="text-center font-bold">VS</div>
                <div className="col-span-2">
                  <div className="text-center font-semibold mb-2">
                    {duplaDois?.nome}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={pontosDuplaDois}
                    onChange={(e) =>
                      setPontosDuplaDois(parseInt(e.target.value) || 0)
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
                      disabled={pontosDuplaUm < 4000 && pontosDuplaDois < 4000}
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
              <Button variant="outline" size="sm" className="flex-1">
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
        
        {/* Botão para excluir partida */}
        <AlertDialog
          open={isConfirmingDelete}
          onOpenChange={setIsConfirmingDelete}
        >
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-red-200 hover:bg-red-50 text-red-500 hover:text-red-600"
            >
              <Trash2 size={16} className="mr-1" />
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Partida</AlertDialogTitle>
              <AlertDialogDescription>
                {isFinished 
                  ? "Isso excluirá a partida e restituirá a vida perdida pela dupla derrotada." 
                  : "Tem certeza que deseja excluir esta partida?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteMatch}
                className="bg-red-500 hover:bg-red-600"
              >
                Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default MatchCard;
