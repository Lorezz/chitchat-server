const queryString = require('query-string');
const axios = require('axios');
const HOST = process.env.HOST;
const version = 'v8.0';

function getLoginUrl() {
  const stringifiedParams = queryString.stringify({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: `${HOST}/authenticate/facebook/`,
    scope: 'email,name,profile_picture', // comma seperated string
    response_type: 'code',
    auth_type: 'rerequest',
    display: 'popup',
  });
  const facebookLoginUrl = `https://www.facebook.com/${version}/dialog/oauth?${stringifiedParams}`;
  return facebookLoginUrl;
}
async function getAccessTokenFromCode(code) {
  const { data } = await axios({
    url: `https://graph.facebook.com/${version}/oauth/access_token`,
    method: 'get',
    params: {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET_KEY,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
      code,
    },
  });
  // console.log(data); // { access_token, token_type, expires_in }
  return data.access_token;
}

async function getFacebookUserData(access_token) {
  const { data } = await axios({
    url: `https://graph.facebook.com/${version}/me`,
    method: 'get',
    params: {
      fields: [
        'id',
        'email',
        'first_name',
        'last_name',
        'profile_picture',
      ].join(','),
      access_token,
    },
  }).catch((error) => {
    console.error(error);
  });
  const { id } = data;
  const { data: pic } = await axios({
    url: `https://graph.facebook.com/${version}/${id}/picture`,
    method: 'get',
    params: {
      type: 'square',
      width: 100,
      redirect: 0,
      access_token,
    },
  }).catch((error) => {
    console.error(error);
  });
  // console.log(data, pic);
  return { ...data, pic: pic.data.url }; // { id, email, first_name, last_name }
}

module.exports = { getAccessTokenFromCode, getFacebookUserData, getLoginUrl };
