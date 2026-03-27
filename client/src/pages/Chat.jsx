import React, { useState, useEffect, useRef, useMemo } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiSearch,
  FiSend,
  FiSmile,
  FiMoreVertical,
  FiPhone,
  FiVideo,
  FiCheck,
} from "react-icons/fi";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000");

const Chat = () => {
  const { receiverId: receiverIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());

  const userId = user?._id || user?.id;
  const chatUserIdQuery = searchParams.get("userId");
  const lastMessageRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users`);
        setUsers(res.data);
        setFilteredUsers(res.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter((u) =>
          u.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, users]);

  // Join socket room
  useEffect(() => {
    if (userId) {
      socket.emit("joinRoom", userId);
    }
  }, [userId]);

  // Socket listeners
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      if (!selectedUser || !message) return;

      const selectedId = String(selectedUser._id);
      const senderId = String(message.senderId);
      const receiverId = String(message.receiverId);

      if (senderId !== selectedId && receiverId !== selectedId) return;

      // Avoid duplicate messages (we may optimistically add on send).
      const messageId = message._id;
      setMessages((prev) => {
        if (messageId && prev.some((m) => String(m?._id) === String(messageId))) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleUserOnline = (uid) => {
      setOnlineUsers((prev) => new Set(prev).add(uid));
    };

    const handleUserTyping = (uid) => {
      setTypingUsers((prev) => new Set(prev).add(uid));
    };

    const handleUserStopTyping = (uid) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(uid);
        return newSet;
      });
    };

    const handleMessageRead = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg?._id) === String(data.messageId)
            ? { ...msg, read: true, readAt: data.readAt }
            : msg
        )
      );
    };

    const handleMessageDelivered = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg?._id) === String(data.messageId)
            ? { ...msg, delivered: true, deliveredAt: data.deliveredAt }
            : msg
        )
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userOnline", handleUserOnline);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("messageRead", handleMessageRead);
    socket.on("messageDelivered", handleMessageDelivered);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userOnline", handleUserOnline);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("messageRead", handleMessageRead);
      socket.off("messageDelivered", handleMessageDelivered);
    };
  }, [selectedUser]);

  // Fetch messages
  const fetchMessages = async (receiverId) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/messages/${receiverId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessages(res.data);

      // Mark as read
      const unreadIdStrings = new Set(
        res.data
          .filter((m) => !m.read && String(m.receiverId) === String(userId))
          .map((m) => String(m._id))
      );

      if (unreadIdStrings.size > 0) {
        const unreadIds = Array.from(unreadIdStrings);
        await axios.put(
          `${API_BASE}/api/messages/markAsRead`,
          { messageIds: unreadIds },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        // Update receiver UI immediately (server will also emit read receipts to the sender).
        setMessages((prev) =>
          prev.map((m) =>
            unreadIdStrings.has(String(m?._id))
              ? { ...m, read: true, readAt: new Date().toISOString() }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Deep link: /chat/:receiverId or /chat?userId=
  useEffect(() => {
    const targetId = receiverIdParam || chatUserIdQuery;
    if (!targetId || users.length === 0) return;
    const match = users.find((u) => String(u._id) === String(targetId));
    if (match) {
      setSelectedUser(match);
      fetchMessages(match._id);
    }
    // fetchMessages is stable enough for this screen; omit to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverIdParam, chatUserIdQuery, users]);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    fetchMessages(u._id);
  };

  const handleSend = async () => {
    if (!userId || !selectedUser?._id) return;
    if (!newMessage.trim()) return;

    const messageData = {
      receiverId: selectedUser._id,
      text: newMessage,
    };

    try {
      const res = await axios.post(
        `${API_BASE}/api/messages`,
        messageData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Optimistic update; socket listener will ignore duplicates via _id check.
      setMessages((prev) => {
        const messageId = res?.data?._id;
        if (messageId && prev.some((m) => String(m?._id) === String(messageId))) {
          return prev;
        }
        return [...prev, res.data];
      });
      setNewMessage("");
      socket.emit("stopTyping", {
        senderId: userId,
        receiverId: selectedUser._id,
      });
      setIsTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { senderId: userId, receiverId: selectedUser._id });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: userId,
        receiverId: selectedUser._id,
      });
      setIsTyping(false);
    }, 1000);
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for separators
  const getDateString = (date) => {
    const today = new Date();
    const msgDate = new Date(date);
    const diffTime = today - msgDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";

    return msgDate.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Process messages with date separators
  const messagesWithDates = useMemo(() => {
    const result = [];
    let lastDate = null;

    messages.forEach((msg, idx) => {
      const dateStr = getDateString(msg.createdAt);
      if (dateStr !== lastDate) {
        result.push({
          type: "date",
          date: dateStr,
          key: `date-${dateStr}-${idx}`,
        });
        lastDate = dateStr;
      }
      result.push({
        type: "message",
        ...msg,
        key: msg._id || `msg-${idx}`,
      });
    });

    return result;
  }, [messages]);

  // Find index of last message for scrolling
  const lastMessageIndex = messagesWithDates.findLastIndex(
    (item) => item.type === "message"
  );

  return (
    <div className="flex h-[90vh] bg-gray-50 rounded-xl shadow-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r border-gray-200 p-4 flex flex-col">
        <h2 className="font-bold text-lg text-gray-700 mb-4">Chats</h2>
        <div className="relative mb-3">
          <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredUsers
            .filter((u) => u._id !== userId)
            .map((u) => (
              <div
                key={u._id}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedUser?._id === u._id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
                onClick={() => handleSelectUser(u)}
              >
                <div className="flex items-center justify-between">
                  <span>{u.username}</span>
                  {onlineUsers.has(u._id) && (
                    <span className="text-green-500 font-bold">●</span>
                  )}
                </div>
                {typingUsers.has(u._id) && (
                  <p className="ml-2 text-gray-500 italic text-sm">typing...</p>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="w-3/4 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          {selectedUser ? (
            <>
              <div>
                <h3 className="font-semibold text-gray-700">
                  {selectedUser.username}
                </h3>
                {onlineUsers.has(selectedUser._id) ? (
                  <p className="text-green-500 text-sm">Online</p>
                ) : (
                  <p className="text-gray-400 text-sm">Offline</p>
                )}
              </div>
              <div className="flex space-x-4 text-gray-500">
                <FiPhone className="cursor-pointer hover:text-blue-500" />
                <FiVideo className="cursor-pointer hover:text-blue-500" />
                <FiMoreVertical className="cursor-pointer hover:text-blue-500" />
              </div>
            </>
          ) : (
            <h3 className="text-gray-500">Select a user to start chatting</h3>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {selectedUser ? (
            messagesWithDates.map((item, idx) => {
              if (item.type === "date") {
                return (
                  <div
                    key={item.key}
                    className="text-center text-gray-500 text-sm my-4"
                  >
                    <span className="bg-gray-100 px-3 py-1 rounded-full">
                      {item.date}
                    </span>
                  </div>
                );
              } else {
                const msg = item;
                const isSender = String(msg.senderId) === String(userId);
                return (
                  <div
                    key={msg.key}
                    ref={idx === lastMessageIndex ? lastMessageRef : null}
                    className={`flex mb-2 ${
                      isSender ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl shadow ${
                        isSender
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className="flex items-center justify-end space-x-1 text-xs mt-1">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isSender && (
                          <span className="flex items-center space-x-0.5">
                            {msg.read ? (
                              <>
                                <FiCheck className="text-green-400" />
                                <FiCheck className="text-green-400" />
                              </>
                            ) : msg.delivered ? (
                              <>
                                <FiCheck className="text-blue-400" />
                                <FiCheck className="text-blue-400" />
                              </>
                            ) : (
                              <FiCheck className="text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            })
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Start a conversation
            </div>
          )}
        </div>

        {/* Input */}
        {selectedUser && (
          <div className="p-4 border-t border-gray-200 bg-white flex items-center space-x-3">
            <FiSmile className="text-gray-500 text-xl cursor-pointer hover:text-blue-500" />
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring focus:ring-blue-300 outline-none"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <button
              onClick={handleSend}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow transition"
            >
              <FiSend />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
