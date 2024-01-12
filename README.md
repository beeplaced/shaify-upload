# shaify-upload
multer | node express file upload | grab as buffer, delete and give sha-256 as filename | (storage in mongoDB)

# common mime-types
https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)

## Installation

```
$ npm i shaify-upload
```

## Features

  * Upload files based on [multer](https://www.npmjs.com/package/multer) 
  * Grab file as buffer
  * Delete file
  * Output sha-256 as option for filename
  * DB Storage later

## Usage in nodejs Express Middleware

```js
//Init class
const service = require('shaify-upload')
const _service_ = new service({
    uploadPath: './uploads',
    allowedMimeTypes = ['application/pdf'],
    mb = 8 //max filesize in mb (default 8)
    })

//Express middleware
app.post('/upload', _service.upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    try {
        const shaify = await _service.shaify(req.file)
        res.status(200).json(shaify);
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
```

shaify response to API

```js
{
  fieldname: 'file',
  originalname: 'originalname.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  destination: './uploads',
  filename: '1705058395505.pdf',
  path: 'uploads\\1705058395505.pdf',
  size: 456797,
  buffer: '<Buffer ... 456747 more bytes>',
  sha: '2b8bc6091bc03280d398304904104f274cb7eeab31fb1dfd94f37009c1edf8e7',
  deleted: true,
  sortsize: '446 KB'
}
```