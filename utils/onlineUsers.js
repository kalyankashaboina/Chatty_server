// A simple in-memory store for online users
// Format: Map<userId, socketId[]>

const onlineUsers = new Map();

// Add a user with a socket ID (supports multiple socket IDs per user)
const addUser = (userId, socketId) => {
  if (onlineUsers.has(userId)) {
    // If the user already exists, add the new socket ID to the array
    onlineUsers.get(userId).push(socketId);
  } else {
    // Otherwise, create a new entry with the socket ID in an array
    onlineUsers.set(userId, [socketId]);
  }
};

// Remove a user by userId and socketId
const removeUser = (userId, socketId) => {
  if (onlineUsers.has(userId)) {
    const sockets = onlineUsers.get(userId);
    // Remove the socket ID from the array
    const index = sockets.indexOf(socketId);
    if (index !== -1) {
      sockets.splice(index, 1);
    }
    // If no more sockets are associated with the user, remove the user
    if (sockets.length === 0) {
      onlineUsers.delete(userId);
    }
  }
};

// Get the list of all online users
const getOnlineUsers = () => {
  const users = Object.fromEntries(onlineUsers);
  console.log('🔑 Online users:', users);
  return users;
};

// Get all socket IDs associated with a user (always returns an array)
const getSocketIdByUserId = userId => {
  console.log('🔑 Getting socket for:', userId);
  return onlineUsers.get(userId) || []; // Return an empty array if no socket found
};

module.exports = {
  addUser,
  removeUser,
  getOnlineUsers,
  getSocketIdByUserId,
};
