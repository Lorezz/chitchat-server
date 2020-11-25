const QRCode = require('qrcode');
const { PassThrough } = require('stream');

const getDataUrl = async (text) => {
  // console.log('text', text);
  let img = null;
  try {
    img = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 4,
      width: 120,
      color: {
        dark: '#111111ff',
        light: '#f4f4f4ff',
      },
    });
  } catch (err) {
    console.error(err);
  }
  return img;
};

const getImage = async (text, res) => {
  // console.log('text', text);
  try {
    const content = decodeURI(text);
    res.set({ 'Content-Type': 'image/png' });
    const qrStream = new PassThrough();
    await QRCode.toFileStream(qrStream, content, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 4,
      width: 120,
      color: {
        dark: '#111111ff',
        light: '#f4f4f4ff',
      },
    });
    qrStream.pipe(res);
  } catch (err) {
    console.error(err);
  }
};

module.exports = { getDataUrl, getImage };
