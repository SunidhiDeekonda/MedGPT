import React from "react";
import { Navigate } from "react-router-dom";

function Dashboard() {
  return <Navigate to="/chat" replace />;
}

export default Dashboard;
