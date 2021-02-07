const md5 = require('md5');

const getGravatarUrl = (email) => {
  if (!email) return;
  const hash = md5(email);
  const picUrl = `https://www.gravatar.com/avatar/${hash}?s=80&d=retro`;
  return picUrl;
};
module.exports = getGravatarUrl;
