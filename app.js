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
                fileSize: mb * 1024 * 1024
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

}

