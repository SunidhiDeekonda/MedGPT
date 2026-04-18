import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FaArrowUp,
  FaMicrophone,
  FaPause,
  FaSearch,
  FaSignOutAlt,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  isJwtExpired,
} from "../utils/auth";
import "./Chat.css";

function Chat() {
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [activeMeta, setActiveMeta] = useState({
    titleSuggestion: "",
    riskLevel: "Unknown",
    emergencyDetected: false,
    disclaimer: "This is not a medical diagnosis.",
  });

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const jwtUser = getStoredUser();
  const jwtToken = getStoredToken();
  const userName = jwtUser?.name || jwtUser?.email?.split("@")[0] || "";

  const currentChatTitle = useMemo(() => {
    const activeChat = chatHistory.find((chat) => chat.id === currentChatId);
    return activeChat?.title || activeMeta.titleSuggestion || "New consultation";
  }, [activeMeta.titleSuggestion, chatHistory, currentChatId]);

  const handleJwtLogout = useCallback(
    (message = "Your session has expired. Please log in again.") => {
      clearStoredAuth();
      toast.error(message);
      navigate("/");
    },
    [navigate]
  );

  const getAuthHeaders = useCallback(async () => {
    if (jwtToken) {
      if (isJwtExpired(jwtToken)) {
        handleJwtLogout();
        throw new Error("JWT_EXPIRED");
      }

      return {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      };
    }

    handleJwtLogout("Please log in to continue.");
    throw new Error("JWT_EXPIRED");
  }, [handleJwtLogout, jwtToken]);

  const getChatTitle = useCallback((firstMessage, suggestion) => {
    const source = (suggestion || firstMessage || "").trim();
    const cleanMessage = source
      .replace(/\s+/g, " ")
      .replace(/[^\w\s?,.-]/g, "")
      .trim();

    const words = cleanMessage.split(" ").filter(Boolean);
    const title = words.slice(0, 8).join(" ");

    if (title.length <= 56) return title || "New chat";
    return `${title.slice(0, 56).trim()}...`;
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/chat/models`, { headers });
      if (!res.ok) {
        throw new Error("Failed to load models");
      }

      const data = await res.json();
      setModelOptions(data.models || []);
    } catch (error) {
      console.error(error);
    }
  }, [getAuthHeaders]);

  const fetchChats = useCallback(
    async (query = "") => {
      try {
        const headers = await getAuthHeaders();
        const search = query.trim();
        const endpoint = search
          ? `${API_BASE_URL}/history/all?q=${encodeURIComponent(search)}`
          : `${API_BASE_URL}/history/all`;
        const res = await fetch(endpoint, {
          headers,
        });

        if (res.status === 401) {
          handleJwtLogout("Please log in again to access your chats.");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch chats");
        }

        const data = await res.json();

        setChatHistory(
          data.map((chat) => ({
            id: chat._id,
            title: chat.title || getChatTitle(chat.messages?.[0]?.text || "New chat"),
            messages: chat.messages,
            riskLevel: chat.riskLevel || "Unknown",
            model: chat.model || selectedModel,
          }))
        );
      } catch (error) {
        if (error.message !== "JWT_EXPIRED") {
          console.error(error);
        }
        setChatHistory([]);
      }
    },
    [getAuthHeaders, getChatTitle, handleJwtLogout, selectedModel]
  );

  useEffect(() => {
    if (jwtToken && isJwtExpired(jwtToken)) {
      handleJwtLogout();
      return;
    }

    if (!jwtToken) {
      navigate("/");
      return;
    }

    fetchChats();
    fetchModels();
  }, [fetchChats, fetchModels, handleJwtLogout, jwtToken, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const parseBotText = (text) => {
    const cleanedText = (text || "").replace(/\*/g, "").trim();
    const lines = cleanedText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const sections = [];
    let introLines = [];
    let question = "";
    let currentSection = null;

    lines.forEach((line) => {
      const headingMatch = line.match(/^([A-Z][A-Za-z\s]+):$/);
      const bulletMatch = line.match(/^-\s+(.+)$/);

      if (headingMatch) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: headingMatch[1],
          items: [],
          content: [],
        };
        return;
      }

      if (currentSection) {
        if (bulletMatch) {
          currentSection.items.push(bulletMatch[1]);
        } else {
          currentSection.content.push(line);
        }
        return;
      }

      if (!question && line.endsWith("?")) {
        question = line;
      } else {
        introLines.push(line);
      }
    });

    if (currentSection) sections.push(currentSection);

    return {
      introLines,
      sections,
      question,
      hasStructuredSections: sections.length > 0,
    };
  };

  const renderSection = (section) => {
    const normalizedTitle = section.title.toLowerCase();

    if (normalizedTitle === "risk level") {
      const riskValue = section.content[0] || section.items[0] || "Unknown";
      const riskClass = `risk-pill risk-${riskValue.toLowerCase()}`;

      return (
        <div className="structured-section" key={section.title}>
          <div className="section-heading">{section.title}</div>
          <div className={riskClass}>{riskValue}</div>
        </div>
      );
    }

    return (
      <div className={`structured-section section-${normalizedTitle.replace(/\s+/g, "-")}`} key={section.title}>
        <div className="section-heading">{section.title}</div>

        {section.content.map((line, index) => (
          <div className="line" key={`${section.title}-content-${index}`}>
            {line}
          </div>
        ))}

        {section.items.map((item, index) => (
          <div className="point" key={`${section.title}-item-${index}`}>
            • {item}
          </div>
        ))}
      </div>
    );
  };

  const renderBotMessage = (text) => {
    const parsed = parseBotText(text);

    return (
      <>
        {parsed.introLines.map((line, index) => (
          <div className="line" key={`intro-${index}`}>
            {line}
          </div>
        ))}

        {parsed.hasStructuredSections && (
          <div className="structured-response">
            {parsed.sections.map((section) => renderSection(section))}
          </div>
        )}

        {parsed.question && <div className="question-card">{parsed.question}</div>}
      </>
    );
  };

  const createChat = async (firstMessage) => {
    const title = getChatTitle(firstMessage, activeMeta.titleSuggestion);
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/history`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title,
        model: selectedModel,
        riskLevel: activeMeta.riskLevel,
        messages: [{ sender: "user", text: firstMessage }],
      }),
    });

    if (res.status === 401) {
      handleJwtLogout("Please log in again to save chats.");
      throw new Error("JWT_EXPIRED");
    }

    if (!res.ok) {
      throw new Error("Failed to create chat");
    }

    return res.json();
  };

  const saveChatMessages = async (chatId, rawMessages, title, metaOverride = {}) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/history/${chatId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        ...(title ? { title } : {}),
        messages: rawMessages,
        model: metaOverride.model || selectedModel,
        riskLevel: metaOverride.riskLevel || activeMeta.riskLevel,
      }),
    });

    if (res.status === 401) {
      handleJwtLogout("Please log in again to save chats.");
      throw new Error("JWT_EXPIRED");
    }

    if (!res.ok) {
      throw new Error("Failed to update chat");
    }
  };

  const loadChat = async (chatId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/history/${chatId}`, { headers });

      if (res.status === 401) {
        handleJwtLogout("Please log in again to open saved chats.");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load chat");
      }

      const chat = await res.json();
      setMessages(chat.messages || []);
      setCurrentChatId(chat._id);
      setSelectedModel(chat.model || "llama-3.3-70b-versatile");
      setActiveMeta((current) => ({
        ...current,
        titleSuggestion: chat.title || "",
        riskLevel: chat.riskLevel || "Unknown",
        emergencyDetected: false,
      }));
    } catch (error) {
      if (error.message !== "JWT_EXPIRED") {
        console.error(error);
      }
    }
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const previousMessages = [...messages];
    const userMessage = { sender: "user", text: trimmedInput };
    const nextRawMessages = [...messages, userMessage];

    setMessages(nextRawMessages);
    setInput("");
    setLoading(true);

    try {
      let chatId = currentChatId;

      if (!chatId) {
        const createdChat = await createChat(trimmedInput);
        chatId = createdChat._id;
        setCurrentChatId(chatId);
      } else {
        await saveChatMessages(chatId, nextRawMessages);
      }

      const historyForAI = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const headers = await getAuthHeaders();
      const res = await axios.post(
        `${API_BASE_URL}/chat`,
        {
          message: trimmedInput,
          history: historyForAI,
          model: selectedModel,
        },
        {
          headers: {
            Authorization: headers.Authorization,
          },
        }
      );

      const botMessage = {
        sender: "bot",
        text: res.data.reply || "No response",
      };
      const updatedRawMessages = [...nextRawMessages, botMessage];
      const nextMeta = {
        titleSuggestion: getChatTitle(trimmedInput, res.data.meta?.titleSuggestion),
        riskLevel: res.data.meta?.riskLevel || "Unknown",
        emergencyDetected: Boolean(res.data.meta?.emergencyDetected),
        disclaimer: res.data.meta?.disclaimer || "This is not a medical diagnosis.",
      };

      setMessages(updatedRawMessages);
      setActiveMeta(nextMeta);

      if (chatId) {
        await saveChatMessages(chatId, updatedRawMessages, nextMeta.titleSuggestion, {
          model: selectedModel,
          riskLevel: nextMeta.riskLevel,
        });
      }

      await fetchChats(searchQuery);
    } catch (error) {
      if (error.message !== "JWT_EXPIRED") {
        console.error(error);
      }
      setMessages(previousMessages);
      toast.error(error.response?.data?.reply || "Unable to send message right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const startVoiceCapture = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast("Listening for your symptoms...");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice input stopped unexpectedly.");
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");
      setInput(transcript.trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleVoice = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    startVoiceCapture();
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setInput("");
    setActiveMeta({
      titleSuggestion: "",
      riskLevel: "Unknown",
      emergencyDetected: false,
      disclaimer: "This is not a medical diagnosis.",
    });
  };

  const handleLogout = () => {
    clearStoredAuth();
    toast.success("You have been logged out.");
    navigate("/");
  };

  const deleteChat = async (id) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.status === 401) {
        handleJwtLogout("Please log in again to manage chats.");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to delete chat");
      }

      if (currentChatId === id) {
        startNewChat();
      }

      await fetchChats(searchQuery);
    } catch (error) {
      if (error.message !== "JWT_EXPIRED") {
        console.error(error);
      }
    }
  };

  const handleSearchChange = (event) => {
    const nextQuery = event.target.value;
    setSearchQuery(nextQuery);

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      fetchChats(nextQuery);
    }, 250);
  };

  if (!jwtToken) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app">
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <img src="/dna.png" className="bg-icon icon1" alt="dna" />
      <img src="/heartbeat.png" className="bg-icon icon2" alt="heartbeat" />
      <img src="/leaf.png" className="bg-icon icon3" alt="leaf" />
      <img src="/stethoscope.png" className="bg-icon icon4" alt="stethoscope" />

      <div className="sidebar">
        <div className="sidebar-top">
          <h2 className="logo">MedGPT</h2>

          <div className="welcome-card">
            <div className="welcome-label">Welcome</div>
            <div className="welcome-name">{userName || "Guest"}</div>
            <div className="welcome-copy">Your AI health companion is ready whenever you need guidance.</div>
          </div>

          <button className="profile-shortcut" onClick={() => navigate("/profile")}>
            <FaUserCircle />
            Profile
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          + New Chat
        </button>

        <div className="search-box">
          <FaSearch />
          <input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search old chats"
          />
        </div>

        <div className="recent">Recent Chats</div>

        <div className="chat-list">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${currentChatId === chat.id ? "active" : ""}`}
            >
              <span className="chat-title" title={chat.title} onClick={() => loadChat(chat.id)}>
                {chat.title}
              </span>

              <button onClick={() => deleteChat(chat.id)} className="delete-btn">
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>

      <div className="main">
        <div className="chat-topbar">
          <div>
            <div className="chat-title-large">{currentChatTitle}</div>
            <div className="chat-subtitle">
              {activeMeta.riskLevel !== "Unknown"
                ? `Latest risk assessment: ${activeMeta.riskLevel}`
                : "Tell MedGPT about your symptoms for guided next steps."}
            </div>
          </div>

          <div className="chat-controls">
            <label className="model-switcher">
              <span>Model</span>
              <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)}>
                {(modelOptions.length ? modelOptions : [
                  { id: "llama-3.3-70b-versatile", label: "Balanced Clinical" },
                ]).map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className={`safety-banner ${activeMeta.emergencyDetected ? "warning" : ""}`}>
          <strong>Medical safety note:</strong> MedGPT is for guidance only and not a replacement for a doctor.
          If symptoms feel severe or urgent, seek emergency medical care immediately.
        </div>

        <div className="chat-area">
          <div className="messages">
            {messages.length === 0 && (
              <div className="empty-state">
                <h3>
                  {userName
                    ? `Hi ${userName}, how can I help you today?`
                    : "How can I help you today?"}
                </h3>
                <p>
                  Describe your symptoms or health concern, and MedGPT will guide
                  you one step at a time.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={msg.sender === "user" ? "user-msg" : "bot-msg"}>
                {msg.sender === "bot" ? renderBotMessage(msg.text) : msg.text}
              </div>
            ))}

            {loading && (
              <div className="bot-msg typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>

          <div ref={chatEndRef} />
        </div>

        <div className="input-box">
          <div className="input-stack">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe your symptoms..."
            />
            <div className="input-footnote">
              {isListening
                ? "Voice capture is active. Speak naturally."
                : voiceSupported
                  ? activeMeta.disclaimer
                  : "Voice input is unavailable in this browser."}
            </div>
          </div>

          <button className={`mic ${isListening ? "active" : ""}`} onClick={handleVoice} disabled={loading}>
            {isListening ? <FaPause /> : <FaMicrophone />}
          </button>

          <button className="send" onClick={sendMessage} disabled={loading}>
            <FaArrowUp />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
