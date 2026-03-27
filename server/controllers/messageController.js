const Message = require('../models/Message');
const { createNotification } = require('./notificationController');

// Send a message with notification
const sendMessage = async (req, res) => {
  const io = require('../server').io;
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) {
      return res.status(400).json({ error: "receiverId and text are required" });
    }

    const receiverOnline =
      io?.sockets?.adapter?.rooms?.get(String(receiverId))?.size > 0;

    const message = new Message({
      senderId: req.user._id,
      receiverId,
      text,
      delivered: receiverOnline,
      deliveredAt: receiverOnline ? new Date() : undefined,
    });
    await message.save();

    // Create notification for the receiver
    await createNotification(
      receiverId,
      req.user._id,
      'message',
      'New Message',
      `You have a new message from ${req.user.name || req.user.username}`
    );

    // Emit to receiver and sender via Socket.IO
    if (io) {
      io.to(String(receiverId)).emit("receiveMessage", message);
      io.to(String(req.user._id)).emit("receiveMessage", message);

      if (receiverOnline) {
        // Tell the sender the message reached the receiver client.
        io.to(String(req.user._id)).emit("messageDelivered", {
          messageId: message._id,
          deliveredAt: message.deliveredAt,
        });
      }
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get messages between users
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: req.params.receiverId },
        { senderId: req.params.receiverId, receiverId: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  const io = require('../server').io;
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: "messageIds array is required" });
    }

    const messages = await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiverId: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    // Emit read receipt to senders
    if (io) {
      const updatedMessages = await Message.find({ _id: { $in: messageIds } });
      updatedMessages.forEach(message => {
        console.log("Emitting messageRead for", message._id, "to sender", message.senderId);
        io.to(String(message.senderId)).emit("messageRead", { messageId: message._id, readAt: message.readAt });
      });
    } else {
      console.log("io is undefined in markAsRead");
    }

    res.json({ updated: messages.modifiedCount });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markAsRead
};
