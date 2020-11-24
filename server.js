require('dotenv').config();

const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const db = require('./lib/db');
const routes = require('./routes');

// Body Limit (unused)
const bodyLimitSize = process.env.BODY_LIMIT_SIZE;
// Cors conf
const whitelist = process.env.DOMAINS.split(',');
// Limiter conf
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
});
// Connect to DB
db.connect();
// BodyParser
app.use(bodyParser.json());
// Cors
app.use(cors({ origin: whitelist, credentials: true }));
// Prevent parameter pollution
app.use(hpp());
// Helmet
app.use(helmet());
// Rate Limiter
app.use(limiter);
// Sanitize mongo data
app.use(mongoSanitize());
// XSS Attacls
app.use(xss());
// // Parse cookies
app.use(cookieParser());
// Socket
require('./lib/socket')(io);
// Routes
app.use('/', routes);
// Fallback
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `${req.originalUrl} was not found on this server`,
  });
});
// Listen
http.listen(process.env.PORT, () => {
  console.log(`server is running`);
});
//Export
module.exports = app;
