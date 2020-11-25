const mongoose = require('mongoose');

const Message = require('../models/message');
const Room = require('../models/room');
const User = require('../models/user');

// CONNECT TO DB
const connect = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log(`db connected.`);
  } catch (error) {
    console.error('error connecting db', error);
  }
};

//RESET DB
const reset = async () => {
  await Room.deleteMany({});
  await Message.deleteMany({});
  await User.deleteMany({});
};

//INIT DEFAULT ROOMS
const initRooms = async (rooms) => {
  await Room.deleteMany({});
  try {
    const promises = rooms.map((r) => {
      const room = new Room({ name: r, connected: [], people: [] });
      return room.save();
    });
    const results = await Promise.all(promises);
    all = await Room.find({});
    return all;
  } catch (error) {
    console.error('error creating rooms', error);
  }
};

// ROOMS
const addRoom = async (data) => {
  const newData = {
    ...data,
    connected: [],
    people: [],
  };
  let room = await Room.findOneAndUpdate({ name: data.name }, newData, {
    upsert: true,
    new: true,
  });
  if (!room._id) {
    room = findRoomByName({ name: data.name });
  }
  return room;
};

const findRoomByName = async (data) => {
  const room = await Room.findOne({ name: data.name });
  return room;
};

const getRoom = (id) => Room.findById(id);
const getRooms = () => Room.find({});
const getRoomDetail = (id) =>
  Room.findById(id).populate({
    path: 'people',
    select: ['_id', 'nick', 'pic'],
  });

const joinRoom = async (roomId, userId) => {
  const room = await Room.findById(roomId);
  let isFirstJoin = false;
  if (room.connected.indexOf(userId) < 0) {
    room.connected.push(userId);
  }
  if (room.people.indexOf(userId) < 0) {
    room.people.push(userId);
    isFirstJoin = true;
  }
  await room.save();
  return isFirstJoin;
};

const leaveRoom = async (roomId, userId) => {
  const room = await Room.findById(roomId);
  const index = room.connected.indexOf(userId);
  if (index > -1) {
    room.connected.splice(index, 1);
  }
  return await room.save();
};

// USERS

const disconnectUser = async (userId) => {
  const rooms = await Room.find({}).populate({
    path: 'user',
    match: { _id: userId },
  });
  try {
    const promises = rooms.map((r) => {
      const idx = r.connected.findIndex((u) => u._id === userId);
      r.connected.splice(idx, 1);
      return r.save();
    });
    await Promise.all(promises);
  } catch (error) {
    console.log('error removing connected user');
  }
};

const getUserById = async (id) => {
  let user = await User.findById(id);
  delete user.hash;
  return user;
};

const getUserInfo = async (id) => {
  const user = await User.findById(id);
  let info = null;
  if (user) {
    const { _id, nick, pic } = user;
    info = { _id, nick, pic };
  }
  return info;
};

const getUser = async (email) => {
  let user = await User.findOne({ email });
  return user;
};

const getUsers = async () => {
  let user = await User.find();
  return user;
};

const addUser = async (data) => {
  let user = await User.findOneAndUpdate({ email: data.email }, data, {
    upsert: true,
    new: true,
  });
  if (!user._id) {
    user = await User.findOne({ email });
  }
  return user;
};

// MESSAGES

const saveMessage = async (data) => {
  const message = new Message(data);
  const msg = await message.save();
  const newMsg = await Message.findById(msg._id).populate({
    path: 'user',
    select: ['_id', 'nick', 'pic'],
  });
  return newMsg;
};

const getLastMessages = async (roomId) => {
  const messages = await Message.find({ room: roomId })
    .populate({ path: 'user', select: ['_id', 'nick', 'pic'] })
    .sort({ createdAt: -1 })
    .limit(100);
  return messages;
};

const getMessages = async () => {
  const messages = await Message.find({})
    .populate(['user', 'room'])
    .sort({ createdAt: -1 })
    .limit(100);
  // .sort({ createdAt: -1 });
  return messages;
};

module.exports = {
  reset,
  disconnectUser,
  connect,
  addRoom,
  initRooms,
  getRooms,
  getRoom,
  getRoomDetail,
  getUsers,
  getUser,
  getUserById,
  addUser,
  getUserInfo,
  saveMessage,
  joinRoom,
  leaveRoom,
  getLastMessages,
  getMessages,
  findRoomByName,
};
