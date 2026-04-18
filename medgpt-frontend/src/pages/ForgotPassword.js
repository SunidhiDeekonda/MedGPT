import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";
import "./AuthFlow.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email,
      });
      setDevLink(res.data.devOnlyLink || "");
      toast.success(res.data.message || "Password reset instructions are ready.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to start password reset.");
    } finally {
      setLoading(false);
    }
  };

  const openDevLink = () => {
    if (!devLink) {
      return;
    }

    const nextUrl = new URL(devLink);
    navigate(`${nextUrl.pathname}${nextUrl.search}`);
  };

  return (
    <div className="auth-flow-page">
      <div className="auth-flow-card">
        <p className="auth-flow-eyebrow">Recovery</p>
        <h1>Reset your password</h1>
        <p className="auth-flow-copy">
          Enter the email you used for MedGPT. In local development, we will show the reset link directly.
        </p>

        <div className="auth-flow-input">
          <FaEnvelope />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
          />
        </div>

        <button className="auth-flow-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Preparing..." : "Send reset instructions"}
        </button>

        {devLink && (
          <button className="auth-flow-secondary" onClick={openDevLink}>
            Open dev reset link
          </button>
        )}

        <p className="auth-flow-link" onClick={() => navigate("/")}>
          Back to login
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
