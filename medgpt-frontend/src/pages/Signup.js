import { useState } from "react";
import axios from "axios";
import { SignedIn, SignedOut, SignUpButton, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";
import "./Signup.css";

const hasClerk = Boolean(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);

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
        Create an account with your email and password or use Google for a quicker start.
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

          {hasClerk && (
            <>
              <div className="auth-divider">
                <span>OR</span>
              </div>

              <div className="auth-panel social-panel">
                <h3 className="panel-title">Create with Google</h3>
                <p className="panel-copy">
                  Choose Google if you want a faster sign-up with one click.
                </p>

                <SignedOut>
                  <SignUpButton
                    mode="modal"
                    forceRedirectUrl="/chat"
                    oauthFlow="popup"
                    strategy="oauth_google"
                  >
                    <button className="google-btn">
                      <FcGoogle className="google-icon" />
                      Create with Google
                    </button>
                  </SignUpButton>
                </SignedOut>

                <SignedIn>
                  <div className="auth-state">
                    <UserButton afterSignOutUrl="/" />
                    <p>Your Google account is connected.</p>
                  </div>
                </SignedIn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Signup;
