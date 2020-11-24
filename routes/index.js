const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../lib/db');
const { authMiddleware, authorize } = require('../lib/auth');
const { getAccessTokenFromCode, getFacebookUserData } = require('../lib/fb');
const router = express.Router();
const { sendMail } = require('../lib/email');
const log = require('../lib/log');
const upload = require('../lib/upload');

const generatePin = () => {
  return Math.random().toString().substr(2, 6);
};

//REGISTER
router.post('/signup', async (req, res) => {
  const { nick, email, pic, password } = req.body;
  const user = await db.getUser(email);
  if (user) {
    return res.status(200).json({ error: 'Email address already exists' });
  } else {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    const pin = generatePin();
    const newUser = {
      nick,
      email,
      pic,
      hash,
      pin,
    };
    // log.info('newUser', newUser);
    //CREATE USER
    const result = await db.addUser(newUser);
    // log.important('addUser', result);
    if (!result) {
      return res.status(500).json({ error: 'Error adding user' });
    }

    //SEND MAIL
    try {
      await sendMail(email, pin);
    } catch (error) {
      log.error(error);
    }
    // return authorize(result, 200, res);
    return res.status(200).json({ message: 'ok' });
  }
});

router.post('/verify', async (req, res) => {
  const { data } = req.body;
  const { code, email } = data;
  const user = await db.getUser(email);
  // log.info('USER', user);
  if (!user) {
    return res.status(200).json({ error: 'Invalid email or code' });
  } else {
    try {
      let verifyedUser;
      // CHECK PIN
      if (code === user.pin) {
        // log.info('PIN MATCH');
        user.verifyed = true;
        verifyedUser = await user.save();
        // log.inverse(verifyedUser);
      } else {
        // log.error('PIN DONT MATCH');
        //CHANGE PIN
        const pin = generatePin();
        user.pin = pin;
        const updatePin = await user.save();
        log.inverse(updatePin);
        //SEND MAIL
        try {
          await sendMail(email, pin);
        } catch (error) {
          log.error(error);
        }
      }
      if (!verifyedUser) {
        // log.assert('no verifyed user');
        return res.status(500).json({ error: 'Invalid email or code' });
      }
      // log.success('USER Verifyed !');
      return authorize(verifyedUser, 200, res);
    } catch (error) {
      log.error(error);
      return res.status(500).json({ error });
    }
  }
});

//LOGIN
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.getUser(email);
    if (!user) {
      return res.status(401).json({ error: 'email or password incorrect' });
    } else if (!user.verifyed) {
      try {
        //CHANGE PIN
        const pin = generatePin();
        user.pin = pin;
        await user.save();
        //SEND MAIL
        await sendMail(email, pin);
      } catch (error) {
        log.error(error);
      }
      return res.status(200).json({
        error: 'Please confirm your email to continue, check your mailbox',
        verifyed: false,
      });
    }
    const result = await bcrypt.compare(password, user.hash);
    if (!result) {
      return res.status(401).json({ error: 'email or password incorrect' });
    }
    if (user && result) {
      return authorize(user, 200, res);
    }
  } catch (err) {
    console.log('ERROR', err);
    res.status(500).json({ error: 'generic error' });
  }
});

router.post('/signout', (req, res) => {
  res.clearCookie('jwt').json({ message: 'ok' });
});

router.post('/authenticate/facebook', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ message: 'no code ' });
  }
  const access_token = await getAccessTokenFromCode(code);
  if (access_token) {
    let fbUser;
    try {
      fbUser = await getFacebookUserData(access_token);
    } catch (error) {
      console.error('error', error);
    }

    const { id, email, first_name, last_name, pic } = fbUser;
    const exists = await db.getUser(email);
    if (exists) {
      return authorize(exists, 200, res);
    } else {
      const saltRounds = 10;
      const hash = await bcrypt.hash(id, saltRounds);
      const newUser = {
        nick: first_name,
        first_name,
        last_name,
        email,
        pic,
        hash,
        verifyed: true,
      };
      const result = await db.addUser(newUser);
      if (!result) {
        return res.status(500).json({ error: 'Error adding user' });
      }
      return authorize(result, 200, res);
    }
  }
  res.status(400).json({ message: 'no token ' });
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    let { user, token } = req;
    if (!user) {
      return res.status(401).json({ error: 'not authorized' });
    }
    const profile = await db.getUserById(user.id);
    // log.assert('profile', profile);
    res.json({ user: profile, token });
  } catch (error) {
    res.clearCookie('jwt').status(401).json({ error: 'not authorized' });
  }
});

// CHAT
const rooms = ['welcome', 'random', 'general'];
router.get('/rooms', authMiddleware, async (req, res) => {
  let all = await db.getRooms();
  if (!all || all.length == 0) {
    all = await db.initRooms(rooms);
  }
  res.json(all);
});

router.post('/addRoom', authMiddleware, async (req, res) => {
  const { data } = req.body;
  const exists = await db.findRoomByName(data);
  if (exists) {
    return res.json({ error: 'Room name already exists' });
  }
  const room = await db.addRoom(data);
  res.json(room);
});

router.get('/players/:roomId', authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const roomDetail = await db.getRoomDetail(roomId);
  res.json(roomDetail);
});

function emitProgress(message, procent) {
  log.verbose(message, procent);
}
router.post('/upload', authMiddleware, (req, res) => {
  upload(req, res, emitProgress);
});

// ROUTES USED DURING DEVELOPMENT
/*
router.get('/reset', async (req, res) => {
  db.reset();
  await db.initRooms(rooms);
  res.json({ reset: true });
});

router.get('/users', async (req, res) => {
  let all = await db.getUsers();
  res.json(all);
});

router.post('/addUser', async (req, res) => {
  const { userData } = req.body;
  console.log('userData', userData);
  const user = await db.addUser(userData);
  res.json(user);
});

router.get('/join/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.query;
  const room = await db.joinRoom(roomId, userId);
  res.json(room);
});

router.get('/leave/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.query;
  const room = await db.leaveRoom(roomId, userId);
  res.json(room);
});

router.get('/addMessage/:room', async (req, res) => {
  const { room } = req.params;
  const { user, text } = req.query;
  const message = await db.saveMessage({
    text,
    room,
    user,
  });
  res.json(message);
});

router.get('/messages/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const data = await db.getLastMessages(roomId);
  res.json(data);
});

router.get('/allMessages', async (req, res) => {
  const data = await db.getMessages();
  res.json(data);
});
*/

module.exports = router;
