const { promises: fsPromises } = require('fs');
const moment = require('moment');
const sendgrid = require('@sendgrid/mail');
const log = require('./log');
const qrcode = require('./qrcode');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const textEmailTemplate = `
      |service| - Email Confirmation.
      Email crated on |ts|
      \n
      Click the link to confirm your email, or copy paste the following url in the browser:
      \n
      |cta_url|
      \n
      Thanks for trying my demo.
      Lorezz.
      `;

const replaceAll = (text, search, replacement) => {
  return text.split(search).join(replacement);
};

const mergeParams = (text, params) => {
  return Object.keys(params).reduce((merged, k) => {
    merged = replaceAll(merged, `|${k}|`, params[k]);
    return merged;
  }, text);
};

const read = (path) => fsPromises.readFile(path, { encoding: 'utf-8' });

const sendMail = async (email, code) => {
  const template = await read(
    `${process.cwd()}/email_scripts/email_template.html`
  );
  const frontendUrl = process.env.FE_HOST;
  const ctaUrl = encodeURI(`${frontendUrl}/verify?email=${email}&code=${code}`);
  // const qrcodeImg = await qrcode.getDataUrl(ctaUrl);
  const qrcodeImg = `${process.env.HOST}/qr?text=${ctaUrl}`;
  log.wtf(qrcodeImg);
  const params = {
    service: 'ChitChat Demo',
    title: 'Email Confirmation',
    message: `Your verification code is:<p style="color:deepskyblue;font-size:36px;letter-spacing:6px">${code}</p>`,
    sub_message:
      'Insert this code on the verification page, or scan the QR code',
    cta_message:
      'Click the button to go to the verification page from your default browser',
    cta_button: 'Confirm Email',
    ts: moment().format('YYYY-MM-DD HH:mm:ss'),
    cta_url: ctaUrl,
    fe_url: frontendUrl,
    qrcode: qrcodeImg,
  };

  const text = mergeParams(textEmailTemplate, params);
  const html = mergeParams(template, params);
  // log.wtf("email", email);
  try {
    const msg = {
      to: `${email}`,
      // bcc: "",
      from: process.env.EMAIL_SENDER, // Use the email address or domain you verified above
      subject: 'Confirm Registration',
      text,
      html,
    };

    await sendgrid.send(msg);
    log.success('SUCCESS');
  } catch (error) {
    log.error(error);
  }
};

module.exports = {
  sendMail,
};
