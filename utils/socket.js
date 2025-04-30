const { verifyToken, getTokenFromCookies } = require('./auth');
const { addUser, removeUser, getSocketIdByUserId, getOnlineUsers } = require("./onlineUsers");
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { addMessageToQueue } = require("./messageQueue");
const Message = require("../models/Message");

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    // Get token from handshake headers (cookies)
    let token = getTokenFromCookies(socket.request);
    console.log("🔑 Token from cookies:", token);

    if (!token) {
      // If token not found in cookies, check the handshake query parameters
      token = socket.handshake.query.token;
      console.log("🔑 Token from handshake query:", token);
    }
    if (!token) {
      console.log("❌ No token in cookies, disconnecting socket");
      return socket.disconnect();
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log("❌ JWT invalid, disconnecting socket");
        return socket.disconnect();
      }

      const userId = decoded.userId;
      socket.userId = userId;

      // Add user to online users
      addUser(userId, socket.id);

      try {
        // Set the user as online in DB
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (e) {
        console.error("❌ Error updating user online status:", e);
      }


      // Broadcast user online status
      socket.broadcast.emit("userOnline", { userId });
      // console.log(`✅ User ${userId} connected (Socket: ${socket.id})`);
      console.log(`✅ User ${userId} connected (Socket ID: ${socket.id})`);
      console.log("🔑 Online users:", getOnlineUsers()); 


      socket.on("typing", (data) => {
        const { recipientId } = data;
        console.log("✏️ Typing event received:", data);
        const recipientSocketId = getSocketIdByUserId(recipientId);
        console.log("✏️ Recipient socket ID:", recipientSocketId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("typing", { senderId: socket.userId });
        }
      });
      
      socket.on("stoppedTyping", (data) => {
        console.log("✏️ Stopped typing event received:", data);
        const { recipientId } = data;
   
        console.log("✏️ Recipient socket ID:", recipientId);
        const recipientSocketId = getSocketIdByUserId(recipientId);
        console.log("✏️ Recipient socket ID:", recipientSocketId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("stoppedTyping", { senderId: socket.userId });
        }
      });
      
      // Handle sending messages
      socket.on("sendMessage", (data) => {
        const { recipientId, content, type = null, mediaUrl = null } = data;
        const senderId = socket.userId;
        const recipientSocketId = getSocketIdByUserId(recipientId);

        if (mediaUrl) console.log("🌐 Media URL:", mediaUrl);

        // Add message to batch queue for saving
        addMessageToQueue({
          sender: senderId,
          recipient: recipientId,
          content,
          type,
          mediaUrl,
          timestamp: new Date(),
        });

        // Emit to recipient if online
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("message", {
            senderId,
            type,
            content,
            mediaUrl,
          });

          console.log("✅ Message delivered to recipient.");
        } else {
          console.log("⚠️ Recipient offline. Message queued.");
        }
      });

      // Handle getting recent messages
      socket.on("getRecentMessages", async (otherUserId) => {
        try {
          const messages = await Message.find({
            $or: [
              { sender: socket.userId, recipient: otherUserId },
              { sender: otherUserId, recipient: socket.userId },
            ],
          })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();

          socket.emit("recentMessages", messages.reverse()); // send in correct order
        } catch (err) {
          console.error("❌ Error fetching recent messages:", err);
        }
      });

      // Handle user disconnect
      socket.on("disconnect", async () => {
        removeUser(userId);

        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: Date.now(),
          });
        } catch (e) {
          console.error("❌ Error updating offline status:", e);
        }

        // Emit the user offline event to other users
        socket.broadcast.emit("userOffline", { userId });
        console.log(`❌ User ${userId} disconnected`);
      });

      // Handle reconnect event to mark user as online again
      socket.on('reconnect', async () => {
        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          socket.broadcast.emit("userOnline", { userId });
          console.log(`✅ User ${userId} reconnected`);
        } catch (e) {
          console.error("❌ Error updating user online status on reconnect:", e);
        }
      });
    });
  });
};

module.exports = { handleSocketConnection };
