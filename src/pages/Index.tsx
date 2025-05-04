
import React from "react";
import LiveScoreboard from "@/components/LiveScoreboard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TournamentProvider } from "@/context/TournamentContext";
import { Settings } from "lucide-react";

const Index = () => {
  return (
    <TournamentProvider>
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto relative">
          <div className="absolute top-4 right-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin" className="flex items-center gap-1">
                <Settings size={16} /> 
                Admin
              </Link>
            </Button>
          </div>
          
          <LiveScoreboard />
        </div>
      </div>
    </TournamentProvider>
  );
};

export default Index;
