const AWS = require('aws-sdk');
const Busboy = require('busboy');
const log = require('./log');
// const { v4 } = require('uuid');

const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const bucket = process.env.BUCKET;
const region = process.env.REGION;

const s3 = new AWS.S3({
  accessKeyId,
  secretAccessKey,
  region,
});

const fileSizeLimit = process.env.UPLOAD_SIZE_LIMIT * 1024 * 1024;

const upload = (req, res, emitProgress) => {
  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      fileSize: fileSizeLimit,
    },
  });
  let key = null;
  busboy.on('file', (fieldName, file, filename, encoding, mimetype) => {
    // console.log('fieldName', fieldName);
    // console.log('mimetype', mimetype);
    // console.log('file size', file.size);
    // console.log('fileSizeLimit', fileSizeLimit);
    if (
      mimetype != 'image/png' &&
      mimetype != 'image/jpeg' &&
      mimetype != 'image/gif' &&
      mimetype != 'audio/webm'
    ) {
      return res.status(200).json({ error: 'Sorry, unsupported format' });
    }

    file.on('limit', function () {
      return res.status(200).json({ error: 'Sorry, file to big' });
    });

    if (fieldName == 'audio' && filename == 'blob') {
      key = 'audio/' + new Date().getTime() + '.webm';
    } else {
      key = 'img/' + new Date().getTime() + filename;
    }
    // log.info('key', key);
    try {
      emitProgress('uploadProgress', 1);
    } catch (error) {
      log.info('emitProgress error', error);
    }
    // const opts = { queueSize: 1, partSize: 1024 * 1024 * 10 };
    try {
      s3.upload(
        {
          Bucket: bucket,
          Key: key,
          Body: file, //stream
        },
        // opts,
        (err, data) => {
          if (err) {
            res.status(500).json({ error: err });
          }
          //   log.info('done', data);
          //   log.info('finish ', key);
          res.status(200).json({ ...data, key });
        }
      ).on('httpUploadProgress', function (progress) {
        const uploaded = parseInt((progress.loaded * 100) / progress.total);
        log.info('uploadProgress', uploaded);

        try {
          emitProgress('uploadProgress', uploaded);
        } catch (error) {
          log.info('emitProgress error', error);
        }
      });
    } catch (ee) {
      res.status(500).json({ error: ee });
    }
  });
  req.pipe(busboy);
};

module.exports = upload;
