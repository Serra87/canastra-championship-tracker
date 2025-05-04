
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/context/TournamentProvider";
import TeamManagement from "./TeamManagement";
import RoundManagement from "./RoundManagement";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Users } from "lucide-react";

const AdminPanel: React.FC = () => {
  const { torneio, carregando } = useTournament();
  const [activeTab, setActiveTab] = useState("teams");

  if (carregando || !torneio) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie o torneio de Canastra 2025
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild className="flex items-center gap-1">
            <Link to="/">
              Ver Placar <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users size={16} />
              <span>Gerenciar Duplas</span>
            </TabsTrigger>
            <TabsTrigger value="rounds" className="flex items-center gap-2">
              <BarChart3 size={16} />
              <span>Rodadas e Partidas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="rounds">
            <RoundManagement />
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Torneio de Canastra 2025 - Rotary Club - v1.0
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
