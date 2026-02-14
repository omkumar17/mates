"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { connectSocket, getSocket } from "@/socket/socket";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/apiClient";

export default function ChatPage() {
  const { matchId } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [chatUser, setChatUser] = useState(null); // 👈 store full user

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ------------------------
  // Fetch Chat User Info
  // ------------------------
  useEffect(() => {
    if (!user || !matchId) return;

    const fetchMatchUser = async () => {
      try {
        const res = await api.get(`/matches/${matchId}`);

        console.log("result",res);
        console.log("user_id",user);

        const otherUser = res.data.users.find(
          (u) => u._id !== user.id
        );
        console.log("other user",otherUser);

        if (otherUser) {
          setChatUser(otherUser);
        }
      } catch (err) {
        console.error("Failed to load chat user", err);
      }
    };

    fetchMatchUser();
  }, [matchId, user]);

  // ------------------------
  // Socket Setup
  // ------------------------
  useEffect(() => {
    if (!user || !matchId) return;

    const socket = connectSocket();

    socket.on("connect", () => {
      socket.emit("joinRoom", matchId);
      socket.emit("markSeen", { matchId });
    });

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);

      if (message.sender?._id !== user._id) {
        socket.emit("markSeen", { matchId });
      }
    });

    socket.on("typing", () => setOtherTyping(true));
    socket.on("stopTyping", () => setOtherTyping(false));

    socket.on("seenUpdate", () => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender?._id === user._id
            ? { ...msg, seen: true }
            : msg
        )
      );
    });

    return () => socket.disconnect();
  }, [matchId, user]);

  // ------------------------
  // Auto Scroll
  // ------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  // ------------------------
  // Keyboard Detection (Mobile)
  // ------------------------
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const keyboardHeight =
        window.innerHeight - window.visualViewport.height;
      setKeyboardOffset(Math.max(0, keyboardHeight));
    };

    window.visualViewport.addEventListener("resize", handleResize);
    return () =>
      window.visualViewport.removeEventListener("resize", handleResize);
  }, []);

  // ------------------------
  // Send Message
  // ------------------------
  const sendMessage = () => {
    if (!text.trim() || !user) return;

    const socket = getSocket();

    const message = {
      text,
      sender: {
        _id: user._id,
        name: user.name,
      },
      createdAt: new Date().toISOString(),
      seen: false,
    };

    socket.emit("sendMessage", { matchId, message });
    socket.emit("stopTyping", { matchId });

    setMessages((prev) => [...prev, message]);
    setText("");
    setIsTyping(false);
  };

  // ------------------------
  // Typing Handler
  // ------------------------
  const handleTyping = (value) => {
    if (!user) return;

    setText(value);
    const socket = getSocket();

    if (!isTyping) {
      socket.emit("typing", { matchId });
      setIsTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { matchId });
      setIsTyping(false);
    }, 700);
  };

  // ------------------------
  // Enter Key Send
  // ------------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <ProtectedRoute>
      {!user ? (
        <div className="min-h-screen flex items-center justify-center">
          Loading chat...
        </div>
      ) : (
        <div
          className="
            flex flex-col relative min-h-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden pb-20 sm:pb-0 sm:pl-64 /* desktop sidebar spacing */ transition-all
          "
          style={{
            paddingBottom: keyboardOffset
              ? `${keyboardOffset}px`
              : "4rem",
          }}
        >
          {/* Header */}
          <div className="p-4 border-b font-semibold sticky top-0 bg-[var(--background)]/90 backdrop-blur z-10 flex items-center gap-3">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${chatUser?.name}`}
              className="w-9 h-9 rounded-full"
              alt="avatar"
            />
            <span>
              💬 Chatting with{" "}
              <span className="text-pink-500 font-semibold">
                {chatUser?.name || "User"}
              </span>
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, index) => {
              const isMe = msg.sender?._id === user._id;

              const myMessages = messages.filter(
                (m) => m.sender?._id === user._id
              );

              const isLastMyMsg =
                isMe && msg === myMessages[myMessages.length - 1];

              return (
                <div
                  key={index}
                  className={`flex ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[75%] space-y-1">
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm shadow
                        ${
                          isMe
                            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-sm"
                            : "bg-[var(--card)] text-[var(--foreground)] rounded-bl-sm"
                        }
                      `}
                    >
                      {!isMe && (
                        <p className="text-xs opacity-60 mb-1">
                          {msg.sender?.name || "User"}
                        </p>
                      )}
                      {msg.text}
                    </div>

                    {/* Meta */}
                    <div
                      className={`text-[10px] opacity-60 ${
                        isMe ? "text-right pr-1" : "pl-1"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                      {isLastMyMsg && (
                        <span className="ml-2">
                          {msg.seen ? "Seen ✓✓" : "Delivered ✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {otherTyping && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-[var(--card)] text-xs opacity-70 animate-pulse">
                  Typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex items-center gap-2 bg-[var(--background)] sticky bottom-0">
            <input
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 rounded-full px-4 py-2 border outline-none bg-transparent"
            />

            <button
              onClick={sendMessage}
              className="
                rounded-full px-4 py-2 text-white font-medium
                bg-gradient-to-r from-pink-500 to-purple-500
                hover:opacity-90 active:scale-95 transition
              "
            >
              Send
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
