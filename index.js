const http = require('http');
const https = require('https');
const imageSize = require('image-size');
const urlLib = require('url');

const HEADER_CONTENT_LENGTH = 'content-length';
const HEADER_CONTENT_TYPE = 'content-type';

// Minimum amount of image data needed to be downloaded
// before determining the image dimensions
const DEFAULT_DOWNLOAD_IMG_BYTES = 32 * 1024;

const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg',
  '.gif', '.png',
];

const genError = statusCode => new Error(`HTTP status code ${statusCode}`);

const isImageUrl = (url) => {
  const u = url.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => u.endsWith(ext));
};

const useHttp = url => url.startsWith('https:') ? https : http;

// Downloads file a few kilobytes until it is possible read
// information about the image.
const readImageInfo = (url, options) => new Promise((resolve, reject) => {
  let resolved = false;
  let downloadImgBytes = options.downloadImgBytes || DEFAULT_DOWNLOAD_IMG_BYTES;
  if (downloadImgBytes === -1) {
    // download entire file
    downloadImgBytes = Number.MAX_SAFE_INTEGER;
  }

  const reqOpts = urlLib.parse(url);
  const req = useHttp(url).get(reqOpts, (res) => {
    let chunks = [];
    let fileSize;

    if (res.statusCode === 200) {
      if (res.headers[HEADER_CONTENT_LENGTH]) {
        fileSize = parseInt(res.headers[HEADER_CONTENT_LENGTH]);
      }

      res
        .on('data', (chunk) => {
          chunks.push(chunk);
          const buffer = Buffer.concat(chunks);

          if (!resolved && buffer.length >= downloadImgBytes) {
            // read image size from first few kilobytes of image data
            const info = imageSize(buffer);
            info.fileSize = fileSize;
            info.mediaType = res.headers[HEADER_CONTENT_TYPE];
            resolve(info);
            resolved = true;

            // stop downloading
            res.destroy();
          }
        })
        .on('end', () => {
          // entire file was downloaded
          if (!resolved) {
            // might get here when file size is small enough
            const buffer = Buffer.concat(chunks);
            const info = imageSize(buffer);
            info.fileSize = buffer.length;
            info.mediaType = res.headers[HEADER_CONTENT_TYPE];
            resolve(info);
            resolved = true;
          }
        });
    } else {
      // http status code was not 200
      reject(genError(res.statusCode));
    }
  });

  req.on('error', e => reject(e));
});

// Makes HEAD request to get information about the file.
const readHeaders = (url, options) => new Promise((resolve, reject) => {
  const reqOpts = urlLib.parse(url);

  // no need to download the content so use HEAD method
  reqOpts.method = 'HEAD';

  const req = useHttp(url).request(reqOpts, (res) => {
    if (res.statusCode === 200) {
      let fileSize;
      if (res.headers[HEADER_CONTENT_LENGTH] !== undefined) {
        fileSize = parseInt(res.headers[HEADER_CONTENT_LENGTH]);
      }
      resolve({
        fileSize,
        mediaType: res.headers[HEADER_CONTENT_TYPE],
      });
    } else {
      // http status code was not 200
      reject(genError(res.statusCode));
    }
  });

  req.on('error', e => reject(e));

  // send the request
  req.end();
});

function fetchInfo(url, options = {}) {
  if (options.isImage || isImageUrl(url)) {
    return readImageInfo(url, options);
  } else {
    return readHeaders(url, options);
  }
}

module.exports = fetchInfo;
