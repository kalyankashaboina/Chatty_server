const { verifyToken, getTokenFromCookies } = require("./auth");
const {
  addUser,
  removeUser,
  getOnlineUsers,
  getSocketIdByUserId,
} = require("./onlineUsers");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { addMessageToQueue } = require("./messageQueue");
const Message = require("../models/Message");

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
let token = getTokenFromCookies(socket.request);
console.log("🔑 Token from cookies:", token);
    if (!token) {
      console.log("❌ No token, disconnecting socket");
      return socket.disconnect();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log("❌ Invalid token");
        return socket.disconnect();
      }

      const userId = decoded.userId;
      socket.userId = userId;

      // Add the user to the online users
      addUser(userId, socket.id);

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (e) {
        console.error("❌ Error updating user online status:", e);
      }

      // Log current online users
      console.log(
        "🔑 Current online users after connection:",
        getOnlineUsers()
      );

      // Broadcast user online status to others
      socket.broadcast.emit("userOnline", { userId });
      console.log(`✅ User ${userId} connected (Socket ID: ${socket.id})`);

      // Video call feature - Offer
      socket.on("offer", (offer, recipientId) => {
        console.log(
          `📞 Offer received from ${socket.userId} to ${recipientId}`
        );
        const recipientSocketId = getSocketIdByUserId(recipientId);
        if (recipientSocketId.length > 0) {
          recipientSocketId.forEach((sid) =>
            io.to(sid).emit("offer", offer, socket.userId)
          );
        }
      });

      // Video call feature - Answer
      socket.on("answer", (answer, recipientId) => {
        console.log(
          `📞 Answer received from ${socket.userId} to ${recipientId}`
        );
        const recipientSocketId = getSocketIdByUserId(recipientId);
        if (recipientSocketId.length > 0) {
          recipientSocketId.forEach((sid) =>
            io.to(sid).emit("answer", answer, socket.userId)
          );
        }
      });

      // Video call feature - ICE Candidate
      socket.on("ice-candidate", (candidate, recipientId) => {
        console.log(
          `📞 ICE candidate received from ${socket.userId} to ${recipientId}`
        );
        const recipientSocketId = getSocketIdByUserId(recipientId);
        if (recipientSocketId.length > 0) {
          recipientSocketId.forEach((sid) =>
            io.to(sid).emit("ice-candidate", candidate, socket.userId)
          );
        }
      });

      // Typing and stopped typing events
      socket.on("typing", ({ recipientId }) => {
        const recipientSockets = getSocketIdByUserId(recipientId);
        if (recipientSockets.length > 0) {
          recipientSockets.forEach((sid) =>
            io.to(sid).emit("typing", { senderId: userId })
          );
        }
      });

      socket.on("stoppedTyping", ({ recipientId }) => {
        const recipientSockets = getSocketIdByUserId(recipientId);
        if (recipientSockets.length > 0) {
          recipientSockets.forEach((sid) =>
            io.to(sid).emit("stoppedTyping", { senderId: userId })
          );
        }
      });

      // Sending messages
      socket.on("sendMessage", (data) => {
        const { recipientId, content, type = null, mediaUrl = null } = data;
        const senderId = userId;
        const recipientSockets = getSocketIdByUserId(recipientId);

        if (mediaUrl) console.log("🌐 Media URL:", mediaUrl);

        addMessageToQueue({
          sender: senderId,
          recipient: recipientId,
          content,
          type,
          mediaUrl,
          timestamp: new Date(),
        });

        // Log current online users before sending the message
        console.log(
          "🔑 Current online users before sending message:",
          getOnlineUsers()
        );

        if (recipientSockets.length > 0) {
          recipientSockets.forEach((sid) => {
            io.to(sid).emit("message", {
              senderId,
              type,
              content,
              mediaUrl,
            });
          });
          console.log("✅ Message delivered");
        } else {
          console.log("⚠️ Recipient offline. Message queued.");
        }
      });

      // Fetch recent messages between users
      socket.on("getRecentMessages", async (otherUserId) => {
        try {
          const messages = await Message.find({
            $or: [
              { sender: userId, recipient: otherUserId },
              { sender: otherUserId, recipient: userId },
            ],
          })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();

          socket.emit("recentMessages", messages.reverse());
        } catch (err) {
          console.error("❌ Error fetching recent messages:", err);
        }
      });

      // Disconnect handling
      socket.on("disconnect", async () => {
        removeUser(userId, socket.id);

        const remainingSockets = getSocketIdByUserId(userId);
        if (remainingSockets.length === 0) {
          try {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastSeen: Date.now(),
            });
            socket.broadcast.emit("userOffline", { userId });
            console.log(`❌ User ${userId} disconnected (fully offline)`);
          } catch (e) {
            console.error("❌ Error updating offline status:", e);
          }
        } else {
          console.log(`👤 User ${userId} still has active connections`);
        }

        // Log current online users after disconnect
        console.log(
          "🔑 Current online users after disconnect:",
          getOnlineUsers()
        );
      });

      // Reconnection handling
      socket.on("reconnect", async () => {
        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          socket.broadcast.emit("userOnline", { userId });
          console.log(`✅ User ${userId} reconnected`);
        } catch (e) {
          console.error(
            "❌ Error updating user online status on reconnect:",
            e
          );
        }
      });
    });
  });
};

module.exports = { handleSocketConnection };
