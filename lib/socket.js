const jwt = require('jsonwebtoken');
const db = require('./db');
const log = require('./log');

module.exports = function (io) {
  const socketMap = {};
  io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      const { token } = socket.handshake.query;
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, data) => {
        if (err) {
          log.info('error', err);
          next(new Error('Authentication error'));
        }
        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  }).on('connection', (socket) => {
    let socketRoom;

    socket.on('disconnect', async (reason) => {
      // console.log(`Disconnected: ${socket.id}`);
      // console.log(`reason: ${reason}`);

      const userId = socketMap[socket.id];
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        // socket.connect();
      }
      // await db.disconnectUser(userId);
    });

    socket.on('error', (error) => {
      console.error('errored', error);
    });

    socket.on('join', async (data) => {
      // console.log('JOIN', data);
      const { room, user } = data;

      socketRoom = room;
      const userId = user;
      socket.join(socketRoom);
      socketMap[socket.id] = userId;

      const isFirstJoin = await db.joinRoom(socketRoom, userId);

      let previousMessages = await db.getLastMessages(socketRoom);
      if (previousMessages && previousMessages.length > 0) {
        socket.emit('joinResponse', {
          messages: previousMessages,
          // room: updatedRoom,
        });
      }

      if (isFirstJoin) {
        const userInfo = await db.getUserInfo(userId);
        if (userInfo) io.to(socketRoom).emit('newPlayer', userInfo);
      }
    });

    socket.on('switch', async (data) => {
      // console.log('SWITCH', data);
      let isFirstJoin = false;

      const { prevRoom, nextRoom } = data;
      const userId = socketMap[socket.id];
      if (prevRoom) {
        socket.leave(prevRoom);
        await db.leaveRoom(prevRoom, userId);
      }
      if (nextRoom) {
        socket.join(nextRoom);
        isFirstJoin = await db.joinRoom(nextRoom, userId);
      }
      socketRoom = nextRoom;
      if (isFirstJoin) {
        const userInfo = await db.getUserInfo(userId);
        if (userInfo) io.to(socketRoom).emit('newPlayer', userInfo);
      }

      let previousMessages = await db.getLastMessages(socketRoom);
      if (previousMessages && previousMessages.length > 0) {
        socket.emit('joinResponse', {
          messages: previousMessages,
          // room: updatedRoom,
        });
      }
    });

    socket.on('addRoom', async (newRoom) => {
      const room = await db.getRoom(newRoom);
      if (room) {
        socket.broadcast.emit('newRoom', room);
      }
    });

    socket.on('message', async (data) => {
      const { message, room } = data;
      const user = socketMap[socket.id];
      const msgData = { ...message, user, room };
      const msg = await db.saveMessage(msgData);
      io.to(room).emit('message', msg);
      // socket.broadcast.to(socketRoom).emit("message", data.message);
    });
  });
};
