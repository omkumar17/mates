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

        console.log("result", res);
        console.log("user_id", user);

        const otherUser = res.data.users.find(
          (u) => u._id !== user.id
        );
        console.log("other user", otherUser);

        if (otherUser) {
          setChatUser(otherUser);
        }
      } catch (err) {
        console.error("Failed to load chat user", err);
      }
    };

    fetchMatchUser();
  }, [matchId, user]);

  useEffect(() => {
    if (!matchId) return;
    const socket = connectSocket();

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/messages/${matchId}`
        );

        const data = await res.json();

        setMessages(data);
        socket.emit("markSeen", { matchId });
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
  }, [matchId]);
  // ------------------------
  // Socket Setup
  // ------------------------
  useEffect(() => {
    if (!user || !matchId) return;

    const socket = connectSocket();

    const onConnect = () => {
      socket.emit("joinRoom", matchId);
      socket.emit("markSeen", { matchId });

    };

    const onReceiveMessage = (message) => {

      setMessages((prev) => {

        if (prev.some((m) => m._id === message._id)) {
          return prev;
        }

        return [...prev, message];
      });

      if (message.sender?._id !== user.id) {
        socket.emit("markSeen", { matchId });
      }
    };

    const onTyping = () => setOtherTyping(true);

    const onStopTyping = () => setOtherTyping(false);

    const onSeenUpdate = () => {

      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender?._id === user.id
            ? { ...msg, seen: true }
            : msg
        )
      );
    };

    socket.on("connect", onConnect);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    socket.on("seenUpdate", onSeenUpdate);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
      socket.off("seenUpdate", onSeenUpdate);
    };

  }, [matchId, user]);
  // ------------------------
  // Auto Scroll
  // ------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    return () => clearTimeout(timer);

  }, [messages, otherTyping]);

  // ------------------------
  // Keyboard Detection (Mobile)
  // ------------------------
  useEffect(() => {

    if (!window.visualViewport) return;

    const viewport = window.visualViewport;

    const updateKeyboard = () => {

      const offset =
        window.innerHeight -
        viewport.height -
        viewport.offsetTop;

      setKeyboardOffset(
        offset > 0 ? offset : 0
      );

    };

    viewport.addEventListener("resize", updateKeyboard);
    viewport.addEventListener("scroll", updateKeyboard);

    return () => {

      viewport.removeEventListener("resize", updateKeyboard);
      viewport.removeEventListener("scroll", updateKeyboard);

    };

  }, []);

  // ------------------------
  // Send Message
  // ------------------------
  const sendMessage = () => {

    if (!text.trim() || !user) return;

    const socket = getSocket();

    socket.emit("sendMessage", {
      matchId,
      message: {
        text,
      },
    });

    socket.emit("stopTyping", { matchId });

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

    // 👇 Add this here
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
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
            flex flex-col h-dvh sm:pl-64 bg-background text-foreground overflow-hidden transition-all"
          style={{
            paddingBottom: keyboardOffset
              ? `${keyboardOffset}px`
              : "4rem",
          }}
        >
          {/* Header */}
          <div
            className="
        shrink-0
        sticky
        top-0
        z-50
        p-4
        border-b
        bg-background/95
        backdrop-blur-md
        flex
        items-center
        gap-3
    "
          >
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${chatUser?.name}`}
              className="w-9 h-9 rounded-full"
              alt="avatar"
            />
            <span>

              <span className="text-pink-500 font-semibold">
                {chatUser?.name || "User"}
              </span>
            </span>
          </div>

          {/* Messages */}
          <div
            className="
        flex-1
        overflow-y-auto
        px-4
        py-3
        space-y-3
        overscroll-contain
    "
          >
            {messages.map((msg, index) => {
              console.log("msg", msg, "user", user);
              const isMe = msg.sender?._id === user.id;
              console.log("isMe", isMe, "msg", msg, "user", user);

              const myMessages = messages.filter(
                (m) => m.sender?._id === user.id
              );

              const isLastMyMsg =
                isMe && msg === myMessages[myMessages.length - 1];

              return (
                <div
                  key={msg._id || index}
                  className={`flex ${isMe ? "justify-end" : "justify-start"
                    }`}
                >
                  <div className="max-w-[75%] space-y-1">
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm shadow
                        ${isMe
                          ? "bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-br-sm"
                          : "bg-linear-to-r from-foreground to-foreground text-background rounded-br-sm"
                        }
                      `}
                    >
                      {!isMe && (
                        <p className="text-xs text-background opacity-70 mb-1">
                          {msg.sender?.name || "User"}
                        </p>
                      )}
                      {msg.text}
                    </div>

                    {/* Meta */}
                    <div
                      className={`text-[10px] opacity-60 ${isMe ? "text-right pr-1" : "pl-1"
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
                <div className="px-3 py-2 rounded-xl bg-card text-xs opacity-70 animate-pulse">
                  Typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="
        flex-shrink-0
        border-t
        bg-background
        p-3
    "
            style={{
              paddingBottom: keyboardOffset
                ? `${keyboardOffset}px`
                : "12px",
              transition: "padding-bottom .25s ease",
            }}
          >
            <div className="flex items-center gap-2">
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
                bg-linear-to-r from-pink-500 to-purple-500
                hover:opacity-90 active:scale-95 transition
              "
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
