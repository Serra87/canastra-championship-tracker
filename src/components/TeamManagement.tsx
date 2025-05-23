
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTournament } from "@/context/TournamentProvider";
import { Jogador } from "@/types";
import { Plus, Trash2, Edit, RefreshCcw } from "lucide-react";

export const TeamManagement: React.FC = () => {
  const { torneio, adicionarDupla, atualizarDupla, removerDupla, reinscreverDupla } = useTournament();
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [teamName, setTeamName] = useState("");
  const [player1Name, setPlayer1Name] = useState("");
  const [player1Contact, setPlayer1Contact] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player2Contact, setPlayer2Contact] = useState("");

  const resetForm = () => {
    setTeamName("");
    setPlayer1Name("");
    setPlayer1Contact("");
    setPlayer2Name("");
    setPlayer2Contact("");
    setSelectedTeam(null);
    setIsAddingTeam(false);
    setIsEditingTeam(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const jogadores: Jogador[] = [
      {
        id: selectedTeam?.jogadores?.[0]?.id || "player1",
        nome: player1Name,
        contato: player1Contact,
      },
      {
        id: selectedTeam?.jogadores?.[1]?.id || "player2",
        nome: player2Name,
        contato: player2Contact,
      },
    ];

    if (isEditingTeam && selectedTeam) {
      atualizarDupla({
        ...selectedTeam,
        nome: teamName,
        jogadores: jogadores,
      });
    } else {
      adicionarDupla({
        nome: teamName,
        jogadores: jogadores,
      });
    }

    resetForm();
  };

  const handleEdit = (team: any) => {
    setSelectedTeam(team);
    setTeamName(team.nome || "");
    setPlayer1Name(team.jogadores?.[0]?.nome || "");
    setPlayer1Contact(team.jogadores?.[0]?.contato || "");
    setPlayer2Name(team.jogadores?.[1]?.nome || "");
    setPlayer2Contact(team.jogadores?.[1]?.contato || "");
    setIsEditingTeam(true);
  };

  const handleDelete = (teamId: string) => {
    removerDupla(teamId);
  };

  const handleReregister = (teamId: string) => {
    reinscreverDupla(teamId);
  };

  // Safe access to duplas array with fallback to empty array
  const duplas = torneio?.duplas || [];
  const rodadaAtual = torneio?.rodadaAtual ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Duplas ({duplas.length})</h2>
        <Dialog open={isAddingTeam} onOpenChange={setIsAddingTeam}>
          <DialogTrigger asChild>
            <Button variant="default" className="flex items-center gap-2">
              <Plus size={16} />
              <span>Nova Dupla</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Dupla</DialogTitle>
              <DialogDescription>
                Preencha as informações da dupla abaixo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="teamName">Nome da Dupla</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="player1Name">Nome do Jogador 1</Label>
                  <Input
                    id="player1Name"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="player1Contact">Contato do Jogador 1</Label>
                  <Input
                    id="player1Contact"
                    value={player1Contact}
                    onChange={(e) => setPlayer1Contact(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="player2Name">Nome do Jogador 2</Label>
                  <Input
                    id="player2Name"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="player2Contact">Contato do Jogador 2</Label>
                  <Input
                    id="player2Contact"
                    value={player2Contact}
                    onChange={(e) => setPlayer2Contact(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditingTeam} onOpenChange={setIsEditingTeam}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Dupla</DialogTitle>
            <DialogDescription>
              Atualize as informações da dupla abaixo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editTeamName">Nome da Dupla</Label>
                <Input
                  id="editTeamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPlayer1Name">Nome do Jogador 1</Label>
                <Input
                  id="editPlayer1Name"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPlayer1Contact">Contato do Jogador 1</Label>
                <Input
                  id="editPlayer1Contact"
                  value={player1Contact}
                  onChange={(e) => setPlayer1Contact(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPlayer2Name">Nome do Jogador 2</Label>
                <Input
                  id="editPlayer2Name"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPlayer2Contact">Contato do Jogador 2</Label>
                <Input
                  id="editPlayer2Contact"
                  value={player2Contact}
                  onChange={(e) => setPlayer2Contact(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingTeam(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dupla</TableHead>
              <TableHead>Jogadores</TableHead>
              <TableHead className="text-center">Vidas</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duplas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Nenhuma dupla cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              Array.isArray(duplas) && duplas.map((dupla) => (
                <TableRow key={dupla.id}>
                  <TableCell className="font-medium">{dupla.nome}</TableCell>
                  <TableCell>
                    {Array.isArray(dupla.jogadores) && dupla.jogadores.map((jogador) => jogador?.nome).join(" e ")}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-primary text-white font-bold">
                      {dupla.vidas}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {dupla.eliminada ? (
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                        Eliminada
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        Ativa
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(dupla)}
                      >
                        <Edit size={16} />
                      </Button>
                      {dupla.eliminada && rodadaAtual < 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReregister(dupla.id)}
                          title="Reinscrever"
                        >
                          <RefreshCcw size={16} />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Tem certeza?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A dupla será permanentemente removida.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(dupla.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TeamManagement;
