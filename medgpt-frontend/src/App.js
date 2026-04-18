import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Profile from "./pages/Profile";
import "./App.css";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(255,255,255,0.96)",
              color: "#12302b",
              backdropFilter: "blur(14px)",
              borderRadius: "18px",
              padding: "14px 16px",
              border: "1px solid rgba(20, 184, 166, 0.14)",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
              fontSize: "14px",
              fontWeight: "600",
              maxWidth: "420px",
            },
            success: {
              iconTheme: {
                primary: "#14b8a6",
                secondary: "#ecfeff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff1f2",
              },
            },
          }}
        />

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>

        <div className="site-credit">Created by Sunidhi Deekonda</div>
      </div>
    </BrowserRouter>
  );
}

export default App;
