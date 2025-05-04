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
import { Badge } from "@/components/ui/badge";
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
import { 
  Plus, 
  CalendarPlus, 
  Filter, 
  List, 
  Table as TableIcon, 
  ArrowRight,
  AlertTriangle,
  Trash2 
} from "lucide-react";
import MatchCard from "./MatchCard";
import { 
  formatarData, 
  verificarDuplaDisponivel, 
  rodadaCompleta, 
  obterVencedoresDaRodada 
} from "@/utils/tournamentUtils";
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

export const RoundManagement: React.FC = () => {
  const { 
    torneio, 
    criarRodada, 
    criarPartida,
    avancarRodada,
    removerRodada 
  } = useTournament();
  
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [selectedRodadaId, setSelectedRodadaId] = useState<RodadaId | null>(null);
  const [selectedDuplaUmId, setSelectedDuplaUmId] = useState<DuplaId | "">("");
  const [selectedDuplaDoisId, setSelectedDuplaDoisId] = useState<DuplaId | "">("");
  const [filtroStatus, setFiltroStatus] = useState<StatusPartida | "TODOS">("TODOS");
  const [filtroDuplaId, setFiltroDuplaId] = useState<DuplaId | "">("_all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRounds, setExpandedRounds] = useState<string[]>([]);
  const [rodadaParaExcluir, setRodadaParaExcluir] = useState<RodadaId | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!torneio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="mt-4">Carregando dados do torneio...</p>
        </div>
      </div>
    );
  }

  const rodadas = torneio.rodadas || [];

  const rodadaAtual = rodadas.find(r => r?.numero === torneio.rodadaAtual);

  const duplasAtivas = torneio.duplas?.filter(dupla => !dupla.eliminada) || [];

  const rodadaAtualCompleta = rodadaCompleta(rodadaAtual);
  
  const vencedoresRodadaAtual = obterVencedoresDaRodada(rodadaAtual);
  
  const podeAvancarRodada = rodadaAtualCompleta && vencedoresRodadaAtual.length >= 2;

  useEffect(() => {
    if (rodadaAtual && !selectedRodadaId) {
      setSelectedRodadaId(rodadaAtual.id);
    }
    if (rodadaAtual && !expandedRounds.includes(rodadaAtual.id)) {
      setExpandedRounds(prev => [...prev, rodadaAtual.id]);
    }
  }, [rodadaAtual, selectedRodadaId, expandedRounds]);

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

  const handleAdvanceRound = () => {
    if (podeAvancarRodada) {
      avancarRodada();
    }
  };

  const handleSelectDuplaUm = (value: string) => {
    setSelectedDuplaUmId(value);
    if (value === selectedDuplaDoisId) {
      setSelectedDuplaDoisId("");
    }
  };

  const handleSelectDuplaDois = (value: string) => {
    setSelectedDuplaDoisId(value);
    if (value === selectedDuplaUmId) {
      setSelectedDuplaUmId("");
    }
  };

  const handleAccordionValueChange = (value: string[]) => {
    setExpandedRounds(value);
  };

  const getDupla = (duplaId: DuplaId): Dupla | undefined => {
    return torneio.duplas?.find(dupla => dupla.id === duplaId);
  };

  const filtrarPartidas = (rodada: Rodada) => {
    const partidas = rodada?.partidas || [];
    return partidas.filter(partida => {
      const statusMatch = filtroStatus === "TODOS" || partida.status === filtroStatus;
      const duplaMatch = !filtroDuplaId || 
                        filtroDuplaId === "_all" ||
                        partida.duplaUmId === filtroDuplaId || 
                        partida.duplaDoisId === filtroDuplaId;
      return statusMatch && duplaMatch;
    });
  };

  const getMatchCounts = (rodada: Rodada) => {
    const partidas = rodada?.partidas || [];
    const total = partidas.length;
    const finished = partidas.filter(m => m.status === StatusPartida.FINALIZADA).length;
    return { total, finished };
  };

  const paginatedPartidas = (rodada?: Rodada) => {
    if (!rodada) return [];
    
    const partidasFiltradas = filtrarPartidas(rodada);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return partidasFiltradas.slice(startIndex, endIndex);
  };

  const getTotalPages = (rodada?: Rodada) => {
    if (!rodada) return 1;
    const partidasFiltradas = filtrarPartidas(rodada);
    return Math.ceil(partidasFiltradas.length / itemsPerPage);
  };

  const noMatches = rodadaAtual && (rodadaAtual.partidas?.length ?? 0) === 0;

  const isDuplaDisponivel = (duplaId: DuplaId, rodadaId: RodadaId) => {
    if (!torneio) return false;
    return verificarDuplaDisponivel(duplaId, rodadaId, torneio);
  };

  const handleDeleteRound = (rodadaId: RodadaId, event: React.MouseEvent) => {
    event.stopPropagation();
    setRodadaParaExcluir(rodadaId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRound = () => {
    if (rodadaParaExcluir) {
      removerRodada(rodadaParaExcluir);
      setRodadaParaExcluir(null);
      setIsDeleteDialogOpen(false);
    }
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
            <>
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
                          {Array.isArray(rodadas) && rodadas.map(rodada => (
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
                          {Array.isArray(duplasAtivas) && duplasAtivas
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
                          {Array.isArray(duplasAtivas) && duplasAtivas
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

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="flex items-center gap-2" 
                    variant="secondary" 
                    disabled={!podeAvancarRodada}
                  >
                    <ArrowRight size={16} />
                    <span>Avançar para Próxima Rodada</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Avançar para a próxima rodada?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {podeAvancarRodada ? (
                        <>
                          Esta ação criará automaticamente a rodada {rodadaAtual.numero + 1} com 
                          {Math.floor(vencedoresRodadaAtual.length / 2)} partidas entre os vencedores 
                          da rodada atual. Esta ação não pode ser desfeita.
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-500">
                          <AlertTriangle size={16} />
                          <span>
                            Todas as partidas da rodada atual devem ser finalizadas antes de avançar para a próxima rodada.
                          </span>
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={!podeAvancarRodada}
                      onClick={handleAdvanceRound}
                    >
                      Avançar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <Button onClick={handleCreateRound} className="flex items-center gap-2">
            <CalendarPlus size={16} />
            {rodadaAtual ? "Nova Rodada" : "Iniciar Torneio"}
          </Button>
        </div>
      </div>

      {/* Status da Rodada */}
      {rodadaAtual && (
        <div className="bg-muted/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="font-medium text-sm">Status da Rodada</div>
            <div className="flex items-center gap-2 mt-1">
              {rodadaAtualCompleta ? (
                <Badge variant="default" className="bg-green-500">Completa</Badge>
              ) : (
                <Badge variant="outline">Em Andamento</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {rodadaAtual.partidas?.filter(p => p.status === StatusPartida.FINALIZADA).length || 0} / {rodadaAtual.partidas?.length || 0} partidas finalizadas
              </span>
            </div>
          </div>
          <div>
            {rodadaAtualCompleta && vencedoresRodadaAtual.length >= 2 ? (
              <Button 
                size="sm" 
                onClick={handleAdvanceRound}
                className="flex items-center gap-1"
              >
                <ArrowRight size={14} />
                Avançar para Rodada {rodadaAtual.numero + 1}
              </Button>
            ) : rodadaAtualCompleta ? (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Rodada Final
              </Badge>
            ) : null}
          </div>
        </div>
      )}

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
                    <SelectItem value="_all">Todas as duplas</SelectItem>
                    {Array.isArray(torneio.duplas) && torneio.duplas.map(dupla => (
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

          {rodadaAtual.partidas && rodadaAtual.partidas.length > 0 ? (
            <>
              {/* Visualização dos cards/tabela */}
              {viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(paginatedPartidas(rodadaAtual)) && paginatedPartidas(rodadaAtual).map(partida => {
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
                      {Array.isArray(paginatedPartidas(rodadaAtual)) && paginatedPartidas(rodadaAtual).map(partida => {
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
                              <div className="text-xs text-muted-foreground">
                                {Array.isArray(duplaUm.jogadores) && duplaUm.jogadores.map(j => j.nome).join(" e ")}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {partida.status === StatusPartida.AGUARDANDO 
                                ? "VS" 
                                : `${partida.pontosDuplaUm} - ${partida.pontosDuplaDois}`}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{duplaDois.nome}</div>
                              <div className="text-xs text-muted-foreground">
                                {Array.isArray(duplaDois.jogadores) && duplaDois.jogadores.map(j => j.nome).join(" e ")}
                              </div>
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
              {rodadaAtual && filtrarPartidas(rodadaAtual).length > itemsPerPage && (
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
                  setSelectedRodadaId(rodadaAtual?.id);
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

      {torneio.rodadas && torneio.rodadas.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Histórico de Rodadas</h3>
          <Accordion 
            type="multiple" 
            value={expandedRounds} 
            onValueChange={handleAccordionValueChange} 
            className="border rounded-md"
          >
            {Array.isArray(rodadas) && rodadas
              .sort((a, b) => b.numero - a.numero) // Sort in descending order
              .map(rodada => {
                const { total, finished } = getMatchCounts(rodada);
                const isCurrentRound = rodada.numero === torneio.rodadaAtual;
                return (
                  <AccordionItem key={rodada.id} value={rodada.id}>
                    <AccordionTrigger className="px-4 hover:no-underline group">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            Rodada {rodada.numero}
                            {isCurrentRound && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                Atual
                              </span>
                            )}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({formatarData(rodada.criadaEm)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm px-2 py-1 rounded-full bg-secondary">
                            {finished}/{total} partidas
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 w-8"
                            onClick={(e) => handleDeleteRound(rodada.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {rodada.partidas && rodada.partidas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array.isArray(rodada.partidas) && rodada.partidas.map(partida => {
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
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Rodada</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta rodada? 
                  Esta ação irá remover todas as partidas associadas e restaurar as vidas 
                  das duplas que perderam partidas nesta rodada.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteRound}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default RoundManagement;
