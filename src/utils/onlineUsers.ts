// src/utils/onlineUsers.ts
type UserId = string;
type SocketId = string;

// A simple in-memory store for online users
// Format: Map<UserId, SocketId[]>
const onlineUsers = new Map<UserId, SocketId[]>();

/**
 * Add a user with a socket ID.
 * Supports multiple socket connections per user.
 */
export const addUser = (userId: UserId, socketId: SocketId): void => {
  const sockets = onlineUsers.get(userId) || [];
  if (!sockets.includes(socketId)) {
    sockets.push(socketId);
  }
  onlineUsers.set(userId, sockets);
  console.info(`🟢 User added: ${userId} | Socket: ${socketId}`);
};

/**
 * Remove a socket ID for a user. Removes user entirely if no sockets left.
 */
export const removeUser = (userId: UserId, socketId: SocketId): void => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  const filtered = sockets.filter(sid => sid !== socketId);
  if (filtered.length > 0) {
    onlineUsers.set(userId, filtered);
  } else {
    onlineUsers.delete(userId);
  }
  console.info(`🔴 Socket removed: ${userId} | Socket: ${socketId}`);
};

/**
 * Get all online users.
 */
export const getOnlineUsers = (): Record<UserId, SocketId[]> => {
  const users = Object.fromEntries(onlineUsers);
  console.info('🔑 Online users snapshot:', users);
  return users;
};

/**
 * Get all socket IDs associated with a user.
 */
export const getSocketIdByUserId = (userId: UserId): SocketId[] => {
  return onlineUsers.get(userId) || [];
};
