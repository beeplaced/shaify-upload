const fs = require('fs');
const path = require('path');
const multer = require('multer');

const filesize = size => {
    const n = parseInt(size, 10) || 0
    const l = Math.floor(Math.log(n) / Math.log(1024))
    const unit = (l === 0) ? 'bytes' : (l === 1) ? 'KB' : (l === 2) ? 'MB' : (l === 3) ? 'GB' : 'TB'
    return (n / Math.pow(1024, l)).toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + unit
}

module.exports = class {

    constructor(meta) {
        const {
            uploadPath,
            allowedMimeTypes = ['application/pdf'],
            mb = 8
        } = meta;

        this.fileLimit = mb * 1024 * 1024
        this.uploadPath = uploadPath

        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                cb(null, Date.now() + path.extname(file.originalname));
            },
        });

        this.upload = multer({
            storage,
            limits: {
                fileSize: this.fileLimit
            },
            fileFilter: (req, file, cb) => {
                if (allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Invalid file type. Allowed types: ' + allowedMimeTypes.join(', ')));
                }
            },
        });
    }

    shaify = async (filemeta) => {
        filemeta.buffer = await this.readfile(filemeta)
        filemeta.sha = await this.calculateSHA256(filemeta.buffer)
        const res = await this.deletefile(filemeta)
        filemeta.deleted = true
        filemeta.sortsize = filesize(filemeta.size)
        return filemeta
    }

    calculateSHA256 = async (buffer) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(buffer);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    readfile = async (requestInput) => {
        const { filename } = requestInput
        try {
            const filePath = `${this.uploadPath}/${filename}`
            return await new Promise((resolve, reject) => {
                fs.readFile(filePath, function (err, res) {
                    if (err) {
                        reject(err)
                    }
                    resolve(res)
                })
            })
        } catch (e) { console.log(e) }
    }

    deletefile = async (requestInput) => {
        const { filename } = requestInput
        try {
            const filePath = `${this.uploadPath}/${filename}`
            return await new Promise((resolve, reject) => {
                fs.unlink(filePath, function (err, res) {
                    if (err) reject(err)
                    resolve(res)
                })
            })
        } catch (e) { console.log(e) }
    }

    uploadFileChunk = async (req, res) => {//upload as binary
        const body = [];
        req.on('data', chunk => {
            for (let offset = 0; offset < chunk.byteLength; offset += fileLimit) {
                const chunkEnd = Math.min(offset + fileLimit, chunk.byteLength);
                const newChunk = chunk.slice(offset, chunkEnd);
                body.push(newChunk);
            }
            body.push(chunk)
        });

        req.on('end', async () => {
            try {
                const filemeta = {}
                filemeta.buffer = Buffer.concat(body);
                if (req.headers['file-name']) filemeta.originalname = req.headers['file-name']
                filemeta.size = filemeta.buffer.length
                filemeta.sortsize = filesize(filemeta.size)
                filemeta.sha = await this.calculateSHA256(filemeta.buffer)
                res.status(200).json(filemeta);
            } catch (error) {
                console.log(error)
                res.status(500).json({ data: { status: 500, error: 'An error occurred during file storage.' } });
            }
        });

        req.on('error', err => {
            res.status(500).json({ data: { status: 500, error: 'An error occurred while uploading files.' } });
        });
    }

}

