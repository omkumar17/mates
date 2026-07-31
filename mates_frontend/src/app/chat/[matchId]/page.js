"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { connectSocket, getSocket } from "@/socket/socket";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/apiClient";
import FullPageLoader from "@/components/FullPageLoader";
import Image from "next/image";

export default function ChatPage() {
  const { matchId } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [chatUser, setChatUser] = useState(null); // 👈 store full user
  const [socketConnected, setSocketConnected] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

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
        console.log("other user image", otherUser.images[0].url);

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
    if (!user || !matchId ) return;
    const socket = connectSocket();

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SOCKET_URL}/api/messages/${matchId}`
        );

        const data = await res.json();
        setMessages(data);
        setMessagesLoading(false);

        if (
          document.visibilityState === "visible" &&
          document.hasFocus()
        ) {
          socket.emit("markSeen", { matchId });
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [matchId,user]);
  // ------------------------
  // Socket Setup
  // ------------------------
  useEffect(() => {
    if (!user || !matchId) return;

    const socket = connectSocket();

    const onConnect = () => {
      setSocketConnected(true);

      socket.emit("joinRoom", matchId);

      if (
        document.visibilityState === "visible" &&
        document.hasFocus()
      ) {
        socket.emit("markSeen", { matchId });
      }

    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    const onReceiveMessage = (message) => {
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });

      if (
        document.visibilityState === "visible" &&
        document.hasFocus()
      ) {
        socket.emit("markSeen", { matchId });
      }
    };

    const onTyping = () => setOtherTyping(true);

    const onStopTyping = () => setOtherTyping(false);

    const onSeenUpdate = (ids) => {
      setMessages(prev =>
        prev.map(msg =>
          ids.includes(msg._id)
            ? { ...msg, seen: true }
            : msg
        )
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    socket.on("seenUpdate", onSeenUpdate);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
      socket.off("seenUpdate", onSeenUpdate);
    };

  }, [matchId, user]);

  useEffect(() => {
    const socket = getSocket();

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        document.hasFocus()
      ) {
        socket.emit("markSeen", { matchId });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [matchId]);
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
  // useEffect(() => {

  //   if (!window.visualViewport) return;

  //   const viewport = window.visualViewport;

  //   const updateKeyboard = () => {

  //     const offset =
  //       window.innerHeight -
  //       viewport.height -
  //       viewport.offsetTop;

  //     setKeyboardOffset(
  //       offset > 0 ? offset : 0
  //     );

  //   };

  //   viewport.addEventListener("resize", updateKeyboard);
  //   viewport.addEventListener("scroll", updateKeyboard);

  //   return () => {

  //     viewport.removeEventListener("resize", updateKeyboard);
  //     viewport.removeEventListener("scroll", updateKeyboard);

  //   };

  // }, []);

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
    // requestAnimationFrame(() => {
    //   messagesEndRef.current?.scrollIntoView({
    //     behavior: "smooth",
    //     block: "end",
    //   });
    // });
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

if (!user) {
    return (
      <ProtectedRoute>
        <FullPageLoader />
      </ProtectedRoute>
    );
  }

  if (!socketConnected) {
    return (
      <ProtectedRoute>
        <FullPageLoader
          title="Connecting..."
          subtitle="Please wait while we establish a secure connection."
        />
      </ProtectedRoute>
    );
  }

  if (messagesLoading) {
    return (
      <ProtectedRoute>
        <FullPageLoader
          title="Loading chat..."
          subtitle="Fetching your conversation."
        />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="sm:min-h-screen min-h-svh ">
          <div className="fixed sm:ml-64 inset-0 flex sm:mb-0 mb-16 flex-col bg-background text-foreground">
            {/* Header */}
            <div
              className="
        shrink-0
        sticky
        top-0
        z-50
        p-3
        border-b
        bg-pink-700
        backdrop-blur-md
        flex
        items-center
        gap-3
    "
            >
              <div className="flex flex-row items-center justify-center gap-4">
                <div className="relative h-9 w-9 overflow-hidden rounded-full">
                  <Image
                    src={chatUser?.images?.[0]?.url || "/default-avatar.png"}
                    alt={chatUser?.name || "Profile"}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <span>

                  <span className="text-white text-md font-bold">
                    {chatUser?.name || "User"}
                  </span>
                </span>

              </div>
              <div className="fixed top-4 right-4 z-50 md:hidden">
                <div className="flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-lg text-white " style={{
                  filter: "grayscale(100%) brightness(1000%)",
                }}>
                  <Image
                    src="/logo.png"
                    alt="metly Logo"
                    width={25}
                    height={25}
                    className="mx-auto"
                  />

                  <span>Metly</span>
                </div>
              </div>
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
              style={{
                backgroundImage: "url('/logo.png')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "200px", // 50px height (approximately)
              }}
            >
              {messages.map((msg, index) => {
                console.log("msg", msg, "user", user);
                const senderId =
                  typeof msg.sender === "string"
                    ? msg.sender
                    : msg.sender?._id;
                const isMe = senderId === user?.id;
                console.log("isMe", isMe, "msg", msg, "user", user);

                const myMessages = messages.filter(
                  (m) => {
                    const mSenderId =
                      typeof m.sender === "string"
                        ? m.sender
                        : m.sender?._id;
                    return mSenderId === user?.id;
                  }
                );

                const isLastMyMsg =
                  isMe && msg === myMessages[myMessages.length - 1];

                return (
                  <div
                    key={msg._id || index}
                    className={`flex ${isMe ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div className="flex max-w-[75%] space-y-1 flex-col">
                      <div className="space-y-1 flex flex-row gap-1 ">
                        <div className="relative h-6 w-6 overflow-hidden rounded-full">
                          <Image
                            src={chatUser?.images?.[0]?.url || "/default-avatar.png"}
                            alt={chatUser?.name || "Profile"}
                            fill
                            className={`object-cover object-top ${isMe ? "hidden" : ""} `}
                          />
                        </div>
                        <div
                          className={`px-4 py-2 rounded-2xl text-md shadow
                        ${isMe
                              ? "bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-br-sm"
                              : "bg-linear-to-r dark:bg-gray-300 bg-gray-600 dark:text-black text-white rounded-br-sm"
                            }
                      `}
                        >
                          {/* {!isMe && (
                          <p className="text-xs  opacity-50 mb-1 text-nowrap">
                            {msg.sender?.name || "User"}
                          </p>
                        )} */}
                          {msg.text}
                          <div className={`text-[10px] p-0 opacity-60 text-right pr-0 text-nowrap`}>{formatTime(msg.createdAt)}</div>
                        </div>

                        {/* Meta */}

                      </div>
                      <div
                        className={`text-[10px] opacity-60 ${isMe ? "text-right pr-1" : "pl-1"
                          }`}
                      >

                        {isLastMyMsg && (
                          <span className="ml-2 ">
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
        shrink-0     
        p-3
    "

            // style={{
            //   transform: `translateY(-${keyboardOffset}px)`,
            //   transition: "transform .25s ease",
            // }}
            >
              <div className="flex items-center z-100 text-foreground gap-2">
                <input
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-gray-200 text-black placeholder:text-black  px-3 py-3 border border-foreground outline-none"
                />

                <button
                  onClick={sendMessage}
                  className="
                rounded-full px-2 py-3 text-white font-medium
                bg-linear-to-r from-pink-500 to-purple-500
                hover:opacity-90 active:scale-95 transition
              "
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
    </ProtectedRoute>
  );
}
