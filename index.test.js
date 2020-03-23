const fetchInfo = require('./index');

test('info about tux logo is fetched', async () => {
  const url = 'https://www.kernel.org/theme/images/logos/tux.png';
  const info = await fetchInfo(url);
  expect(info).toMatchObject({
    height: 120,
    width: 104,
    type: 'png',
    fileSize: 7666,
    mediaType: 'image/png',
  });
});

test('info about linux kernel file is fetched', async () => {
  const url = 'https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.5.3.tar.xz';
  const info = await fetchInfo(url);
  expect(info).toMatchObject({
    fileSize: 110706004,
    mediaType: 'application/x-xz',
  });
});

test('options work when fetching', async () => {
  const url = 'https://placekitten.com/640/480';
  const info = await fetchInfo(url, {
    // server does not provide Content-Length header
    // so we need to download entire image to know
    // file size
    downloadImgBytes: -1,
    isImage: true,
  });
  expect(info.fileSize).not.toBeUndefined();
  expect(info.mediaType).toBe('image/jpeg');
});

test('works with big image with default options', async () => {
  // A big JPG picture
  const url = 'https://www.nasa.gov/sites/default/files/thumbnails/image/milkyway.jpg';
  let error;
  let info = {};
  try {
    info = await fetchInfo(url);
  } catch (e) {
    error = e;
  }
  expect(error).toBeUndefined();
  expect(info).toMatchObject({
    fileSize: 6516177,
    height: 3403,
    width: 10800,
  });
});

test('downloading too little data throws Corrupt JPG exception', async () => {
  // A big JPG picture
  const url = 'https://www.nasa.gov/sites/default/files/thumbnails/image/milkyway.jpg';
  let error;
  try {
    await fetchInfo(url, {
      // download as little data as possible
      downloadImgBytes: 8,
      isImage: true,
    });
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeUndefined();
});

test('the fetch fails with 404', async () => {
  await expect(fetchInfo('https://google.com/this/does/not/exist_'))
    .rejects.toThrow('HTTP status code 404');
});

test('the fetch fails with getaddrinfo', async () => {
  await expect(fetchInfo('https://this.does.not.exist'))
    .rejects.toThrow('getaddrinfo ENOTFOUND this.does.not.exist');
});
