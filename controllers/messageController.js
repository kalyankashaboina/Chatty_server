// controllers/messageController.js
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const { Types } = require("mongoose");

// Send message
const sendMessage = async (req, res) => {
  const { sender, receiver, chatId, content, type } = req.body;

  try {
    const newMessage = new Message({
      sender,
      receiver,
      chat: chatId,
      content,
      type,
    });
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Get messages for a chat
const getMessages = async (req, res) => {
  const userId = req.userId; // assuming this is being set by an auth middleware

  if (!userId) {
    return res.status(400).json({ message: "User ID is missing" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId },
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};


// Controller to fetch the last 20 messages between two users

const getLast20Messages = async (req, res) => {
  console.log("💬 Fetching paginated messages:", req.query);
  const { userId, selectedUserId, page = 1, limit = 20 } = req.query;

  if (!userId || !selectedUserId) {
    return res.status(400).json({ error: "Both userId and selectedUserId are required" });
  }

  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(selectedUserId)) {
    return res.status(400).json({ error: "Invalid userId or selectedUserId" });
  }

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  if (isNaN(pageNumber) || pageNumber <= 0 || isNaN(pageSize) || pageSize <= 0) {
    return res.status(400).json({ error: "Invalid page or limit values" });
  }

  try {
    // Count total messages between users
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: userId, recipient: selectedUserId },
        { sender: selectedUserId, recipient: userId },
      ],
    });

    // Fetch paginated messages
    const skip = (pageNumber - 1) * pageSize;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: selectedUserId },
        { sender: selectedUserId, recipient: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.json({
      messages: messages.reverse(), // so oldest comes first in chat display
      total: totalMessages,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error while fetching messages" });
  }
};

// Export the controller function using CommonJS module.exports
module.exports = {
  getLast20Messages,
  sendMessage,
  getMessages,
};
