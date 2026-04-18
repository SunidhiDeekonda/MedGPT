import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";
import "./AuthFlow.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        setStatus("loading");
        const res = await axios.post(`${API_BASE_URL}/auth/verify-email`, { token });
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully.");
        toast.success(res.data.message || "Email verified successfully.");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Unable to verify email.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="auth-flow-page">
      <div className="auth-flow-card">
        <p className="auth-flow-eyebrow">Verification</p>
        <h1>Verify your email</h1>
        <p className="auth-flow-copy">
          {status === "loading"
            ? "Checking your verification link..."
            : message || "We are checking your email verification status."}
        </p>

        <button className="auth-flow-btn" onClick={() => navigate("/")} disabled={status === "loading"}>
          Return to login
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;
