
import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTournament } from "@/context/TournamentProvider";
import { DuplaId, RodadaId, Dupla, StatusPartida, Rodada } from "@/types";
import { Plus, CalendarPlus, Filter, List, Table as TableIcon } from "lucide-react";
import MatchCard from "./MatchCard";
import { formatarData, verificarDuplaDisponivel } from "@/utils/tournamentUtils";

export const RoundManagement: React.FC = () => {
  const { 
    torneio, 
    criarRodada, 
    criarPartida,
  } = useTournament();
  
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [selectedRodadaId, setSelectedRodadaId] = useState<RodadaId | null>(null);
  const [selectedDuplaUmId, setSelectedDuplaUmId] = useState<DuplaId | "">("");
  const [selectedDuplaDoisId, setSelectedDuplaDoisId] = useState<DuplaId | "">("");
  const [filtroStatus, setFiltroStatus] = useState<StatusPartida | "TODOS">("TODOS");
  const [filtroDuplaId, setFiltroDuplaId] = useState<DuplaId | "">("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);

  // Find current round
  const rodadaAtual = torneio.rodadas.find(r => r.numero === torneio.rodadaAtual);

  // Get active teams (not eliminated)
  const duplasAtivas = torneio.duplas.filter(dupla => !dupla.eliminada);

  // Set selectedRodadaId initially to the current round if available
  useEffect(() => {
    if (rodadaAtual && !selectedRodadaId) {
      setSelectedRodadaId(rodadaAtual.id);
    }
  }, [rodadaAtual, selectedRodadaId]);

  const handleCreateRound = () => {
    criarRodada();
  };

  const handleCreateMatch = () => {
    if (selectedRodadaId && selectedDuplaUmId && selectedDuplaDoisId) {
      criarPartida(selectedDuplaUmId, selectedDuplaDoisId, selectedRodadaId);
      setSelectedDuplaUmId("");
      setSelectedDuplaDoisId("");
      setIsCreatingMatch(false);
    }
  };

  const handleSelectDuplaUm = (value: string) => {
    setSelectedDuplaUmId(value);
    // Reset team two if it's the same as team one
    if (value === selectedDuplaDoisId) {
      setSelectedDuplaDoisId("");
    }
  };

  const handleSelectDuplaDois = (value: string) => {
    setSelectedDuplaDoisId(value);
    // Reset team one if it's the same as team two
    if (value === selectedDuplaUmId) {
      setSelectedDuplaUmId("");
    }
  };

  // Helper to get dupla by id
  const getDupla = (duplaId: DuplaId): Dupla | undefined => {
    return torneio.duplas.find(dupla => dupla.id === duplaId);
  };

  // Filter partidas based on status and team filters
  const filtrarPartidas = (rodada: Rodada) => {
    return rodada.partidas.filter(partida => {
      const statusMatch = filtroStatus === "TODOS" || partida.status === filtroStatus;
      const duplaMatch = !filtroDuplaId || 
                        partida.duplaUmId === filtroDuplaId || 
                        partida.duplaDoisId === filtroDuplaId;
      return statusMatch && duplaMatch;
    });
  };

  // Calculate match counts for a round
  const getMatchCounts = (rodada: Rodada) => {
    const total = rodada.partidas.length;
    const finished = rodada.partidas.filter(m => m.status === StatusPartida.FINALIZADA).length;
    return { total, finished };
  };

  // Pagination logic for current round's matches
  const paginatedPartidas = (rodada?: Rodada) => {
    if (!rodada) return [];
    
    const partidasFiltradas = filtrarPartidas(rodada);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return partidasFiltradas.slice(startIndex, endIndex);
  };

  // Total pages calculation
  const getTotalPages = (rodada?: Rodada) => {
    if (!rodada) return 1;
    const partidasFiltradas = filtrarPartidas(rodada);
    return Math.ceil(partidasFiltradas.length / itemsPerPage);
  };

  // Check if there are no matches in the current round
  const noMatches = rodadaAtual && rodadaAtual.partidas.length === 0;

  // Check if a team is available for selection in a specific round
  const isDuplaDisponivel = (duplaId: DuplaId, rodadaId: RodadaId) => {
    return verificarDuplaDisponivel(duplaId, rodadaId, torneio);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">
          {rodadaAtual
            ? `RODADA ${rodadaAtual.numero}`
            : "Nenhuma Rodada Iniciada"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {rodadaAtual && (
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
                    <Label htmlFor="roundSelect">Rodada</Label>
                    <Select
                      value={selectedRodadaId || ""}
                      onValueChange={setSelectedRodadaId}
                    >
                      <SelectTrigger id="roundSelect">
                        <SelectValue placeholder="Selecione a rodada" />
                      </SelectTrigger>
                      <SelectContent>
                        {torneio.rodadas.map(rodada => (
                          <SelectItem key={rodada.id} value={rodada.id}>
                            Rodada {rodada.numero} ({formatarData(rodada.criadaEm)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teamOne">Dupla 1</Label>
                    <Select
                      value={selectedDuplaUmId}
                      onValueChange={handleSelectDuplaUm}
                    >
                      <SelectTrigger id="teamOne">
                        <SelectValue placeholder="Selecione a primeira dupla" />
                      </SelectTrigger>
                      <SelectContent>
                        {duplasAtivas
                          .filter(dupla => dupla.id !== selectedDuplaDoisId)
                          .map(dupla => {
                            const disponivel = selectedRodadaId ? 
                              isDuplaDisponivel(dupla.id, selectedRodadaId) : true;
                            
                            return (
                              <SelectItem 
                                key={dupla.id} 
                                value={dupla.id}
                                disabled={!disponivel}
                              >
                                {dupla.nome} ({dupla.vidas} vidas)
                                {!disponivel && " - Já participando"}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teamTwo">Dupla 2</Label>
                    <Select
                      value={selectedDuplaDoisId}
                      onValueChange={handleSelectDuplaDois}
                    >
                      <SelectTrigger id="teamTwo">
                        <SelectValue placeholder="Selecione a segunda dupla" />
                      </SelectTrigger>
                      <SelectContent>
                        {duplasAtivas
                          .filter(dupla => dupla.id !== selectedDuplaUmId)
                          .map(dupla => {
                            const disponivel = selectedRodadaId ? 
                              isDuplaDisponivel(dupla.id, selectedRodadaId) : true;
                              
                            return (
                              <SelectItem 
                                key={dupla.id} 
                                value={dupla.id}
                                disabled={!disponivel}
                              >
                                {dupla.nome} ({dupla.vidas} vidas)
                                {!disponivel && " - Já participando"}
                              </SelectItem>
                            );
                          })}
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
                    disabled={!selectedRodadaId || !selectedDuplaUmId || !selectedDuplaDoisId}
                  >
                    Criar Partida
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={handleCreateRound} className="flex items-center gap-2">
            <CalendarPlus size={16} />
            {rodadaAtual ? "Nova Rodada" : "Iniciar Torneio"}
          </Button>
        </div>
      </div>

      {rodadaAtual && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-semibold text-lg">Partidas da Rodada Atual</h3>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-2 items-center">
                <Select 
                  value={filtroStatus} 
                  onValueChange={(value) => {
                    setFiltroStatus(value as StatusPartida | "TODOS");
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <Filter size={14} className="mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os status</SelectItem>
                    <SelectItem value={StatusPartida.AGUARDANDO}>Aguardando</SelectItem>
                    <SelectItem value={StatusPartida.EM_ANDAMENTO}>Em andamento</SelectItem>
                    <SelectItem value={StatusPartida.FINALIZADA}>Finalizada</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={filtroDuplaId} 
                  onValueChange={(value) => {
                    setFiltroDuplaId(value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filtrar por dupla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as duplas</SelectItem>
                    {torneio.duplas.map(dupla => (
                      <SelectItem key={dupla.id} value={dupla.id}>
                        {dupla.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* View mode toggle */}
              <div className="flex border rounded-md overflow-hidden">
                <Button 
                  variant={viewMode === "cards" ? "default" : "ghost"} 
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => setViewMode("cards")}
                >
                  <List size={16} />
                </Button>
                <Button 
                  variant={viewMode === "table" ? "default" : "ghost"} 
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon size={16} />
                </Button>
              </div>
            </div>
          </div>

          {rodadaAtual.partidas.length > 0 ? (
            <>
              {/* Visualização dos cards/tabela */}
              {viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedPartidas(rodadaAtual).map(partida => {
                    const duplaUm = getDupla(partida.duplaUmId);
                    const duplaDois = getDupla(partida.duplaDoisId);
                    return (
                      <MatchCard 
                        key={partida.id} 
                        partida={partida} 
                        duplaUm={duplaUm} 
                        duplaDois={duplaDois}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Dupla 1</TableHead>
                        <TableHead className="text-center">Placar</TableHead>
                        <TableHead>Dupla 2</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPartidas(rodadaAtual).map(partida => {
                        const duplaUm = getDupla(partida.duplaUmId);
                        const duplaDois = getDupla(partida.duplaDoisId);
                        
                        // Skip if any team doesn't exist
                        if (!duplaUm || !duplaDois) return null;
                        
                        return (
                          <TableRow key={partida.id}>
                            <TableCell>
                              {partida.status === StatusPartida.AGUARDANDO && <Badge variant="outline">Aguardando</Badge>}
                              {partida.status === StatusPartida.EM_ANDAMENTO && <Badge variant="secondary">Em Andamento</Badge>}
                              {partida.status === StatusPartida.FINALIZADA && <Badge variant="default">Finalizada</Badge>}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{duplaUm.nome}</div>
                              <div className="text-xs text-muted-foreground">{duplaUm.jogadores.map(j => j.nome).join(" e ")}</div>
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {partida.status === StatusPartida.AGUARDANDO 
                                ? "VS" 
                                : `${partida.pontosDuplaUm} - ${partida.pontosDuplaDois}`}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{duplaDois.nome}</div>
                              <div className="text-xs text-muted-foreground">{duplaDois.jogadores.map(j => j.nome).join(" e ")}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setIsCreatingMatch(true);
                                // Populate dialog with data from this match for viewing details
                                setSelectedRodadaId(rodadaAtual.id);
                                setSelectedDuplaUmId(partida.duplaUmId);
                                setSelectedDuplaDoisId(partida.duplaDoisId);
                              }}>
                                Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Paginação */}
              {filtrarPartidas(rodadaAtual).length > itemsPerPage && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({length: getTotalPages(rodadaAtual)}, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(rodadaAtual)))}
                        aria-disabled={currentPage === getTotalPages(rodadaAtual)}
                        className={currentPage === getTotalPages(rodadaAtual) ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="border rounded-md p-8 text-center bg-muted/20">
              <p className="text-muted-foreground mb-2">
                Nenhuma partida nesta rodada. Use o botão "Criar Partida Manual" para adicionar partidas.
              </p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => {
                  setSelectedRodadaId(rodadaAtual.id);
                  setIsCreatingMatch(true);
                }}
              >
                <Plus size={16} className="mr-2" />
                Criar Partida
              </Button>
            </div>
          )}
        </div>
      )}

      {torneio.rodadas.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Histórico de Rodadas</h3>
          <Accordion type="single" collapsible className="border rounded-md">
            {torneio.rodadas
              .sort((a, b) => b.numero - a.numero) // Sort in descending order
              .map(rodada => {
                const { total, finished } = getMatchCounts(rodada);
                return (
                  <AccordionItem key={rodada.id} value={rodada.id}>
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Rodada {rodada.numero}</span>
                          <span className="text-sm text-muted-foreground">
                            ({formatarData(rodada.criadaEm)})
                          </span>
                        </div>
                        <span className="text-sm px-2 py-1 rounded-full bg-secondary">
                          {finished}/{total} partidas
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {rodada.partidas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rodada.partidas.map(partida => {
                            const duplaUm = getDupla(partida.duplaUmId);
                            const duplaDois = getDupla(partida.duplaDoisId);
                            return (
                              <MatchCard 
                                key={partida.id} 
                                partida={partida} 
                                duplaUm={duplaUm} 
                                duplaDois={duplaDois}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhuma partida nesta rodada.
                        </div>
                      )}
                      {rodada.id !== rodadaAtual?.id && (
                        <div className="mt-4 text-right">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRodadaId(rodada.id);
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
