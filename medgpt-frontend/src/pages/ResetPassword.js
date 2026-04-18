import { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";
import "./AuthFlow.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!token) {
      toast.error("Reset token is missing.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        token,
        password,
      });
      toast.success(res.data.message || "Password reset successful.");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-flow-page">
      <div className="auth-flow-card">
        <p className="auth-flow-eyebrow">Recovery</p>
        <h1>Choose a new password</h1>
        <p className="auth-flow-copy">
          Use a strong password with at least 6 characters to secure your MedGPT account.
        </p>

        <div className="auth-flow-input">
          <FaLock />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
          />
          <span className="auth-flow-eye" onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="auth-flow-input">
          <FaLock />
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
          />
        </div>

        <button className="auth-flow-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Updating..." : "Reset password"}
        </button>

        <p className="auth-flow-link" onClick={() => navigate("/")}>
          Back to login
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
