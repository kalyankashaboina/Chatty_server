/**
 * A more robust in-memory store for online users and their state.
 *
 * This module manages not only which users are online and their associated
 * socket connections, but also their real-time state, such as whether they
 * are currently in a call.
 *
 * Data Structure:
 * The main store is a Map where:
 * - Key: `userId` (String)
 * - Value: An object representing the user's state:
 *   {
 *     sockets: Set<socketId>,      // A Set of all active socket IDs for this user
 *     isInCall: boolean,           // True if the user is in a call, false otherwise
 *     callId: string | null,       // The unique ID of the call they are in
 *     username: string             // <-- NEW: Caching the username for readable logging
 *   }
 */

const onlineUsers = new Map();

/**
 * Adds a user's socket and username to the online list.
 * If the user is connecting for the first time, a new state object is created.
 * @param {string} userId - The ID of the user.
 * @param {string} socketId - The new socket ID for the user.
 * @param {string} username - The user's username, fetched from the database.
 */
const addUser = (userId, socketId, username) => {
  if (!onlineUsers.has(userId)) {
    // If user is not in the map, create a new state object for them.
    onlineUsers.set(userId, {
      sockets: new Set(),
      isInCall: false,
      callId: null,
      username: username, // Store the username on first connect
    });
  }
  // Add the new socket ID to the user's set of sockets.
  onlineUsers.get(userId).sockets.add(socketId);
  console.log(`[OnlineUsers] Added socket ${socketId} for user: ${username} (${userId})`);
};

/**
 * Removes a specific socket ID from a user's state.
 * If it's the user's last socket, the user is removed from the online list entirely.
 * @param {string} userId - The ID of the user.
 * @param {string} socketId - The socket ID to remove.
 */
const removeUser = (userId, socketId) => {
  if (onlineUsers.has(userId)) {
    const userState = onlineUsers.get(userId);
    userState.sockets.delete(socketId);
    if (userState.sockets.size === 0) {
      const username = userState.username || userId;
      onlineUsers.delete(userId);
      console.log(`[OnlineUsers] User ${username} (${userId}) is now fully offline.`);
    }
  }
};

/**
 * Retrieves all socket IDs for a given user.
 * @param {string} userId
 * @returns {string[]} An array of socket IDs, or an empty array.
 */
const getSocketIdByUserId = userId => {
  return onlineUsers.has(userId) ? Array.from(onlineUsers.get(userId).sockets) : [];
};

/**
 * Retrieves the complete state object for a user from the cache.
 * @param {string} userId
 * @returns {{...}|null} The user's state object or null.
 */
const getUserState = userId => {
  return onlineUsers.get(userId) || null;
};

/**
 * NEW: A helper function to get a username from our cache.
 * Falls back to the userId if the user is not found in the cache.
 * @param {string} userId
 * @returns {string} The username or the userId if not found.
 */
const getUsernameById = userId => {
  return onlineUsers.get(userId)?.username || userId;
};

/**
 * Updates the call status for a given user.
 * @param {string} userId
 * @param {boolean} status - The new call status.
 * @param {string | null} callId - The unique ID of the call.
 */
const setUserInCall = (userId, status, callId = null) => {
  if (onlineUsers.has(userId)) {
    const userState = onlineUsers.get(userId);
    userState.isInCall = status;
    userState.callId = status ? callId : null;
    const username = getUsernameById(userId);
    console.log(
      `[OnlineUsers] Call status for ${username} -> isInCall: ${status}, callId: ${userState.callId}`
    );
  }
};

/**
 * Checks if a user is currently in a call.
 * @param {string} userId
 * @returns {boolean}
 */
const isUserInCall = userId => {
  return onlineUsers.has(userId) ? onlineUsers.get(userId).isInCall : false;
};

/**
 * Gets a list of all online user IDs.
 * @returns {string[]}
 */
const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  addUser,
  removeUser,
  getSocketIdByUserId,
  getUserState,
  setUserInCall,
  isUserInCall,
  getOnlineUserIds,
  getUsernameById, // Export the new function
};
