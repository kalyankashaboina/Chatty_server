// src/utils/onlineUsers.ts
type UserId = string;
type SocketId = string;

const onlineUsers = new Map<UserId, SocketId[]>();

export const addUser = (userId: UserId, socketId: SocketId): void => {
  const sockets = onlineUsers.get(userId) || [];
  if (!sockets.includes(socketId)) {
    sockets.push(socketId);
  }
  onlineUsers.set(userId, sockets);
  console.info(`🟢 User added: ${userId} | Socket: ${socketId}`);
};

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

export const getOnlineUsers = (): Record<UserId, SocketId[]> => {
  const users = Object.fromEntries(onlineUsers);
  console.info('🔑 Online users snapshot:', users);
  return users;
};

export const getSocketIdByUserId = (userId: UserId): SocketId[] => {
  return onlineUsers.get(userId) || [];
};
