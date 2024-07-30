import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import "./ChatWindow.css";

const ChatWindow = ({ user, currentUser }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false); // New state
  const chatHistoryRef = useRef(null);
  const limit = 20;
  const lastMessageIdRef = useRef(null);
  const audioRef = useRef(null);
  const scrollTopRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const loadingTimerRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.emit("setUser", currentUser.email);

      socket.on("userList", ({ online, all }) => {
        // Handle user list updates
      });

      return () => {
        socket.off("userList");
      };
    }
  }, [socket, currentUser.email]);

  useEffect(() => {
    if (user && socket) {
      socket.emit("loadInitialMessages", {
        from: currentUser.email,
        to: user.email,
        limit,
      });

      const handleInitialMessages = (initialMessages) => {
        if (initialMessages.length > 0) {
          const lastMessage = initialMessages[0]; // First message in reversed array
          lastMessageIdRef.current = lastMessage._id;
        }
        setMessages(initialMessages);
      };

      socket.on("initialMessages", handleInitialMessages);

      return () => {
        socket.off("initialMessages", handleInitialMessages);
      };
    }
  }, [user, socket, currentUser.email]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);

        // Try to play sound only if the user interaction initiated it
        if (audioRef.current) {
          audioRef.current.play().catch(error => {
            console.error("Audio playback error:", error);
          });
        }

        // Clear scrollTopRef and scroll to the bottom
        scrollTopRef.current = 0; // Clear scroll position
        const chatHistoryElement = chatHistoryRef.current;
        if (chatHistoryElement) {
          chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
        }
      };

      socket.on("receiveMessage", handleReceiveMessage);

      return () => {
        socket.off("receiveMessage", handleReceiveMessage);
      };
    }
  }, [socket]);

  const handleScroll = useCallback(() => {
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      if (chatHistoryElement.scrollTop === 0 && !loadingMore) {
        // Generate random delay between 2 to 5 seconds
        const randomDelay = Math.floor(Math.random() * 2000) + 1000;

        // Show loading indicator
        setLoadingMessages(true);

        // Set a timeout to hide the loading indicator after random delay
        loadingTimerRef.current = setTimeout(() => {
          setLoadingMessages(false);
          setLoadingMore(true);
          socket.emit("loadMoreMessages", {
            from: currentUser.email,
            to: user.email,
            lastMessageId: lastMessageIdRef.current,
            limit,
          });
        }, randomDelay);
      }

      // Check if at bottom
      isAtBottomRef.current =
        chatHistoryElement.scrollHeight - chatHistoryElement.scrollTop ===
        chatHistoryElement.clientHeight;
    }
  }, [loadingMore, socket, currentUser.email, user.email]);

  useEffect(() => {
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      chatHistoryElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (chatHistoryElement) {
        chatHistoryElement.removeEventListener("scroll", handleScroll);
      }
      // Clear timer on unmount
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      if (isAtBottomRef.current) {
        chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
      } else {
        // Restore scroll position if not at the bottom
        chatHistoryElement.scrollTop =
          chatHistoryElement.scrollHeight - scrollTopRef.current;
      }
    }
  }, [messages]);

  useEffect(() => {
    // Reset scrollTopRef and scroll to the bottom when user changes
    scrollTopRef.current = 0;
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
    }
  }, [user.email]);

  useEffect(() => {
    if (loadingMore) {
      const handleLoadMoreMessages = (moreMessages) => {
        if (moreMessages.length > 0) {
          const lastMessage = moreMessages[0]; // First message in reversed array
          lastMessageIdRef.current = lastMessage._id;
        }
        setMessages((prevMessages) => [...moreMessages, ...prevMessages]);
        setLoadingMore(false);
        setLoadingMessages(false); // Reset loadingMessages to false

        // Preserve scroll position
        const chatHistoryElement = chatHistoryRef.current;
        if (chatHistoryElement) {
          scrollTopRef.current =
            chatHistoryElement.scrollHeight - chatHistoryElement.scrollTop;
        }
      };

      socket.on("moreMessages", handleLoadMoreMessages);

      return () => {
        socket.off("moreMessages", handleLoadMoreMessages);
      };
    }
  }, [loadingMore, socket]);

  const handleSend = useCallback(() => {
    if (message.trim()) {
      socket.emit("sendMessage", {
        from: currentUser.email,
        to: user.email,
        content: message,
      });
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: currentUser.email, content: message },
      ]);
      setMessage("");
      
      // Reset scrollTopRef and scroll to the bottom
      scrollTopRef.current = 0;
      const chatHistoryElement = chatHistoryRef.current;
      if (chatHistoryElement) {
        chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
      }
    }
  }, [message, currentUser.email, user.email, socket]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent newline in the input field
      handleSend();
    }
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return "Offline";

    const now = new Date();
    const lastLoginTime = new Date(lastLogin);

    const diffInMs = now - lastLoginTime;
    const diffInMinutes = Math.floor(diffInMs / 1000 / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `Online ${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `Online ${diffInHours} hr ago`;
    } else {
      return `Online ${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  return (
    <div className="chat-window d-flex flex-column h-100">
      <div className="chat-header d-flex align-items-center px-3 py-2 border-bottom">
        <strong>{user.fullName}</strong>
        <span className="ms-2 text-muted">
          {formatLastLogin(user.lastLogin)}
        </span>
        {loadingMessages && (
          <div className="loading-indicator ms-2">Loading...</div>
        )}
      </div>
      <div
        className="chat-history flex-grow-1 overflow-auto"
        ref={chatHistoryRef}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`d-flex ${
              msg.from === currentUser.email
                ? "justify-content-end"
                : "justify-content-start"
            } mb-2`}
          >
            <div
              className={`message-bubble ${
                msg.from === currentUser.email ? "sent" : "received"
              }`}
            >
              <strong>
                {msg.from === currentUser.email ? "Me" : user.fullName}:
              </strong>
              <p className="mb-0">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input d-flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="form-control me-2"
          onKeyDown={handleKeyDown} // Added onKeyDown event
        />
        <button onClick={handleSend} className="btn btn-primary">
          Send
        </button>
      </div>

      <audio
        ref={audioRef}
        src={`${process.env.PUBLIC_URL}/assets/message.mp3`}
        preload="auto"
      />
    </div>
  );
};

export default ChatWindow;
