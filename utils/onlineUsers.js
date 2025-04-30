// A simple in-memory store for online users
// Format: { userId: socketId }

const onlineUsers = {};

const addUser = (userId, socketId) => {
  onlineUsers[userId] = socketId;
};

const removeUser = (userId) => {
  delete onlineUsers[userId];
};

const getOnlineUsers = () => {
  console.log("🔑 Online users:", onlineUsers);
  return onlineUsers;
};

const getSocketIdByUserId = (userId) => {
  console.log("🔑 Online users:", onlineUsers);
  return onlineUsers[userId];
};

module.exports = {
  addUser,
  removeUser,
  getOnlineUsers,
  getSocketIdByUserId,
};
