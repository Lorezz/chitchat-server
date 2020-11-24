const QRCode = require('qrcode');

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

module.exports = { getDataUrl };
