# remote-file-info
A node module for fetching information about remote file

Fetches information about remote file without downloading the entire file. If given URL
is pointing to an image, the image dimensions are determined by the first few kilobytes.

## Installation

```
npm install remote-file-info
```

## Usage

```javascript
const fetchInfo = require('remote-file-info');

async function run() {
  try {
    // EXAMPLE 1
    //
    // Get information from a remote image
    const pngInfo = await fetchInfo('https://www.kernel.org/theme/images/logos/tux.png');
    console.log(pngInfo);

    // {
    //   height: 120,
    //   width: 104,
    //   type: 'png',
    //   fileSize: 7666,
    //   mediaType: 'image/png'
    // }

    // EXAMPLE 2
    //
    // Get information from a remote file without downloading it
    const fileInfo = await fetchInfo('https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.5.3.tar.xz');
    console.log(fileInfo);

    // { fileSize: 110706004, mediaType: 'application/x-xz' }

    // EXAMPLE 3
    //
    // Provide helpful options
    const kittenInfo = await fetchInfo('https://placekitten.com/640/480', {
      // Download entire file to know file size,
      // because server does not provide Content-Length header.
      downloadImgBytes: -1,

      // Tell that this URL is pointing to an image.
      isImage: true,
    });
    console.log(kittenInfo);

    // {
    //   height: 480,
    //   width: 640,
    //   type: 'jpg',
    //   fileSize: 27172,
    //   mediaType: 'image/jpeg'
    // }
  } catch (err) {
    console.error(err);
  }
}

run();
```
