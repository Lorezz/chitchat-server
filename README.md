# CHIT-CHAT Server

This is the server part of a chat web app.

ChitChat is a mobile-first, full-stack web application demo done for a dev challenge. It's a multi-room chat that has the ability to send images and voice messages, in addition to normal text messages. Developed for fun by [Lorezz](https://github.com/Lorezz).

## Install

This project is an Node.js app using Express.

To install you have to :

- clone the repository
- rename sample.env to .env
- fill the variables with your keys / paths

```javascript
yarn install
yarn dev
```

## Stack and libs

- Node.js, Express.js
- Socket.Io
- Mongoose, MongoDb
- Jwt
- Http Only cookies for auth
- Mjml
- Sendgrid
- AWS sdk
- BusBoy
- Helmet
- Qrcode
- Others... see package.json
