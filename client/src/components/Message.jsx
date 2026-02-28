// frontend/src/components/Message.jsx
import React from "react";

const Message = ({ message, currentUserId }) => {
  const isOwnMessage = message.sender._id === currentUserId;

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2`}
    >
      <div
        className={`p-2 rounded-xl max-w-xs ${
          isOwnMessage
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-black rounded-bl-none"
        }`}
      >
        <p>{message.text}</p>
        <small className="text-xs opacity-70">
          {new Date(message.createdAt).toLocaleTimeString()}
        </small>
      </div>
    </div>
  );
};

export default Message;
