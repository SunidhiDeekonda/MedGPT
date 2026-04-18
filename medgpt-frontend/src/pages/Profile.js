import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";
import { clearStoredAuth, getStoredToken, getStoredUser, setStoredAuth } from "../utils/auth";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const token = getStoredToken();
  const storedUser = getStoredUser();
  const [form, setForm] = useState({
    name: storedUser?.name || "",
    bio: storedUser?.bio || "",
    age: storedUser?.age ?? "",
    phone: storedUser?.phone || "",
  });
  const [profile, setProfile] = useState(storedUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [devLink, setDevLink] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data.user);
        setForm({
          name: res.data.user.name || "",
          bio: res.data.user.bio || "",
          age: res.data.user.age ?? "",
          phone: res.data.user.phone || "",
        });
        setStoredAuth({ token, user: res.data.user });
      } catch (error) {
        if (error.response?.status === 401) {
          clearStoredAuth();
          toast.error("Please log in again.");
          navigate("/");
        } else {
          toast.error(error.response?.data?.message || "Unable to load your profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, token]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axios.patch(`${API_BASE_URL}/auth/me`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(res.data.user);
      setStoredAuth({ token, user: res.data.user });
      toast.success(res.data.message || "Profile updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setSendingVerification(true);
      const res = await axios.post(
        `${API_BASE_URL}/auth/resend-verification`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDevLink(res.data.devOnlyLink || "");
      toast.success(res.data.message || "Verification link prepared.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to resend verification.");
    } finally {
      setSendingVerification(false);
    }
  };

  const openVerificationLink = () => {
    if (!devLink) {
      return;
    }

    const nextUrl = new URL(devLink);
    navigate(`${nextUrl.pathname}${nextUrl.search}`);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <button className="profile-back" onClick={() => navigate("/chat")}>
          <FaArrowLeft />
          Back to chat
        </button>

        <div className="profile-header">
          <p className="profile-eyebrow">Account</p>
          <h1>Your profile</h1>
          <p className="profile-copy">
            Keep your identity and contact details current so your chat experience stays personalized.
          </p>
        </div>

        {loading ? (
          <div className="profile-loading">Loading profile...</div>
        ) : (
          <>
            <div className="profile-grid">
              <label className="profile-field">
                <span>Name</span>
                <div className="profile-input">
                  <FaUser />
                  <input name="name" value={form.name} onChange={handleChange} />
                </div>
              </label>

              <label className="profile-field">
                <span>Email</span>
                <div className="profile-input readonly">
                  <FaEnvelope />
                  <input value={profile?.email || ""} readOnly />
                </div>
              </label>

              <label className="profile-field">
                <span>Phone</span>
                <div className="profile-input">
                  <FaPhone />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Optional phone number"
                  />
                </div>
              </label>

              <label className="profile-field">
                <span>Age</span>
                <div className="profile-input">
                  <input
                    name="age"
                    type="number"
                    min="0"
                    max="120"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="Optional age"
                  />
                </div>
              </label>
            </div>

            <label className="profile-field">
              <span>Bio</span>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Share a short note about yourself or your health goals."
                rows={5}
              />
            </label>

            <div className="profile-status">
              <div>
                <div className="profile-status-label">Email verification</div>
                <div className={`profile-badge ${profile?.isEmailVerified ? "verified" : "pending"}`}>
                  {profile?.isEmailVerified ? "Verified" : "Pending"}
                </div>
              </div>

              {!profile?.isEmailVerified && (
                <div className="profile-actions-inline">
                  <button
                    className="profile-secondary"
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                  >
                    {sendingVerification ? "Preparing..." : "Resend verification"}
                  </button>

                  {devLink && (
                    <button className="profile-secondary" onClick={openVerificationLink}>
                      Open dev verification link
                    </button>
                  )}
                </div>
              )}
            </div>

            <button className="profile-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
