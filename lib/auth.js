const log = require('./log');
const jwt = require('jsonwebtoken');
// const refreshTokenSecret = process.env.JWT_SECRET_REFRESH;

const authMiddleware = (req, res, next) => {
  let token;
  // log.wtf('JWT COOKIE', req.cookies.jwt);
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
    // log.warn('AUTH FROM COOKIE', token);
  }

  // OLD JWT FROM BEARER
  // if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
  //     token = req.headers.authorization.split(' ')[1];
  //     log.warn('AUTH FROM BEARER TOKEN', token);
  // }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, data) => {
      if (err) {
        // log.info('error', err);
        return res.status(403).json({ error: 'forbidden' });
      }
      //   log.info('data', data);
      req.user = data;
      req.token = token;
      next();
    });
  } else {
    res.status(401).json({ error: 'not authorized' });
  }
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const authorize = (user, status, res) => {
  //   log.info('user._id', user._id);
  const token = signToken(user._id);
  const expires = new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRY * 24 * 60 * 60 * 1000
  );
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires,
    httpOnly: true,
    sameSite: 'Lax',
    domain: isProduction ? process.env.DOMAIN : '',
    secure: isProduction ? true : false,
  };

  //   log.wtf('COOKIE OPTIONS', cookieOptions);
  user.hash = undefined;
  res.status(status).cookie('jwt', token, cookieOptions).json({
    user,
    token,
  });
};

const getAppCookies = (req) => {
  // extract the raw cookies from the request headers
  const rawCookies = req.headers.cookie.split('; ');
  const parsedCookies = {};
  rawCookies.forEach((rawCookie) => {
    const parsedCookie = rawCookie.split('=');
    parsedCookies[parsedCookie[0]] = parsedCookie[1];
  });
  return parsedCookies;
};

module.exports = {
  authMiddleware,
  authorize,
  getAppCookies,
};
