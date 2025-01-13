const { Server } = require('socket.io');

// Create a map to store user IDs and their rooms
const users = new Map();

// Create a map to store typing status with timeout references
const typingUsers = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins (update for production)
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const { userId, email } = socket.handshake.query;
    console.log(`${email} connected: ${socket.id}`);

    users.set(userId, socket.id);

    socket.on('joinChannel', (channelId) => {
      socket.join(channelId);
      console.log(`User ${socket.id} joined channel: ${channelId}`);
    });

    socket.on('joinDirect', ({ userId, recipientId }) => {
      const room = [userId, recipientId].sort().join('_'); // Unique room ID
      socket.join(room);
      console.log(`User ${socket.id} joined direct room: ${room}`);
    });

    socket.on('typing', ({ channel, user }) => {
      const roomId = channel._id;
      const typingKey = `${roomId}-${user._id}`;

      // Clear existing timeout if any
      if (typingUsers.has(typingKey)) {
        clearTimeout(typingUsers.get(typingKey));
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        typingUsers.delete(typingKey);
        socket.to(roomId).emit('userStoppedTyping', { user, channel });
      }, 3000);

      typingUsers.set(typingKey, timeout);

      // Emit typing event to room
      socket.to(roomId).emit('userTyping', { user, channel });
      console.log(
        `User ${user.firstName} is typing in channel: ${channel.name}`
      );
    });

    socket.on('sendMessage', (data) => {
      const { type, room, message } = data;

      // Clear typing status when message is sent
      if (type === 'channel' && message.sender) {
        const typingKey = `${room}-${message.sender._id}`;
        if (typingUsers.has(typingKey)) {
          clearTimeout(typingUsers.get(typingKey));
          typingUsers.delete(typingKey);
        }
      }

      if (type === 'channel') {
        console.log(data);
        io.to(room).emit('newMessage', message); // Broadcast to channel
      } else if (type === 'direct') {
        io.to(room).emit('newMessage', message); // Broadcast to direct room
      }

      console.log(`Message sent to ${room}:`, message);
    });

    socket.on('notification', (data) => {
      console.log('Notification received:', data);
      //   Broadcast to socket of the user who sent the notification
      console.log(users);
      io.to(users.get(data.senderId)).emit('notificationMessage', data);
    });

    socket.on('disconnect', () => {
      // Clear any typing timeouts for the disconnected user
      const userTypingKeys = Array.from(typingUsers.keys()).filter((key) =>
        key.endsWith(`-${userId}`)
      );
      userTypingKeys.forEach((key) => {
        clearTimeout(typingUsers.get(key));
        typingUsers.delete(key);
      });

      users.delete(userId);
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

const getOnlineUsers = () => {
  // Convert map into json
  const onlineUsers = Array.from(users.keys());
  return onlineUsers;
};

module.exports = { initSocket, users, getOnlineUsers };
