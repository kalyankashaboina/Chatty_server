const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message"); // ✅ Needed for fetching messages
const { addUser, removeUser, getSocketIdByUserId } = require("./onlineUsers");
const { addMessageToQueue } = require("../utils/messageQueue");

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    const token = socket.handshake.query.token;

    if (!token) {
      console.log("❌ No token, disconnecting socket");
      return socket.disconnect();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log("❌ JWT invalid, disconnecting socket");
        return socket.disconnect();
      }

      const userId = decoded.userId;
      socket.userId = userId;
      addUser(userId, socket.id);

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (e) {
        console.error("❌ Error updating user online status:", e);
      }

      socket.broadcast.emit("userOnline", { userId });

      console.log(`✅ User ${userId} connected (Socket: ${socket.id})`);

      // 💬 Handle sending messages
      // 💬 Handle sending messages
      socket.on("sendMessage", (data) => {
        const { recipientId, content, type = null, mediaUrl = null } = data;
        const senderId = socket.userId;
        const recipientSocketId = getSocketIdByUserId(recipientId);

        // console.log("📤 Sending message from", senderId, "to", recipientId);
        // console.log("📄 Message Type:", type);
        // console.log("💬 Content:", content);
        if (mediaUrl) console.log("🌐 Media URL:", mediaUrl);

        // ✅ Add message to batch queue for saving
        addMessageToQueue({
          sender: senderId,
          recipient: recipientId,
          content,
          type,
          mediaUrl,
          timestamp: new Date(),
        });

        // ✅ Emit to recipient if online
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

      // 📥 Handle fetching last 20 messages
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

      // ❌ Handle disconnect
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

        socket.broadcast.emit("userOffline", { userId });
        console.log(`❌ User ${userId} disconnected`);
      });
    });
  });
};

module.exports = { handleSocketConnection };
