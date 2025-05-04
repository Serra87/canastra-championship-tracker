
import React from "react";
import AdminPanel from "@/components/AdminPanel";
import { TournamentProvider } from "@/context/TournamentContext";

const Admin = () => {
  return (
    <TournamentProvider>
      <AdminPanel />
    </TournamentProvider>
  );
};

export default Admin;
