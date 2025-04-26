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
  return onlineUsers;
};

const getSocketIdByUserId = (userId) => {
  return onlineUsers[userId];
};

module.exports = {
  addUser,
  removeUser,
  getOnlineUsers,
  getSocketIdByUserId,
};
