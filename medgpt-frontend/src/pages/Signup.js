import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/auth/signup`, form);
      toast.success(res.data.message || "Account created successfully.");

      if (res.data.devOnlyLink) {
        const nextUrl = new URL(res.data.devOnlyLink);
        navigate(`${nextUrl.pathname}${nextUrl.search}`);
        return;
      }

      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Signup failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <h1 className="logo">MedGPT</h1>
      <h2 className="heading">Create Your Account</h2>
      <p className="subtext">
        Create an account with your email and password to start chatting with MedGPT.
      </p>

      <div className="auth-card">
        <div className="auth-grid">
          <div className="auth-panel">
            <h3 className="panel-title">Create MedGPT Account</h3>

            <div className="input-group">
              <FaUser />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
              />
            </div>

            <div className="input-group">
              <FaEnvelope />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
              />
            </div>

            <div className="input-group password-group">
              <FaLock />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
              />

              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button className="primary-btn" onClick={handleSignup} disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p className="switch-link">
              Already have an account? <span onClick={() => navigate("/")}>Login</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
