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

        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                // Use fileFilter for MIME type validation
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
            const filePath = `./uploads/${filename}`
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
            const filePath = `./uploads/${filename}`
            return await new Promise((resolve, reject) => {
                fs.unlink(filePath, function (err, res) {
                    if (err) reject(err)
                    resolve(res)
                })
            })
        } catch (e) { console.log(e) }
    }

}

// Text Files:

// text / plain - Plain text
// text / html - HTML document
// text / css - Cascading Style Sheet
// text / javascript - JavaScript source code
// Image Files:

// image / jpeg - JPEG image
// image / png - PNG image
// image / gif - GIF image
// image / bmp - BMP image
// image / webp - WebP image
// image / svg + xml - SVG image
// Audio Files:

// audio / mpeg - MP3 audio
// audio / wav - WAV audio
// audio / ogg - Ogg Vorbis audio
// audio / aac - AAC audio
// Video Files:

// video / mp4 - MP4 video
// video / webm - WebM video
// video / ogg - Ogg video
// Application Files:

// application / json - JSON data
// application / xml - XML document
// application / pdf - PDF document
// application / msword - Microsoft Word document
// application / vnd.ms - excel - Microsoft Excel spreadsheet
// application / vnd.ms - powerpoint - Microsoft PowerPoint presentation
// application / zip - ZIP archive
// application / x - gzip - GZIP archive
// application / x - tar - TAR archive
// Font Files:

// font / ttf - TrueType Font
// font / otf - OpenType Font
// application / font - woff - Web Open Font Format(WOFF)
// application / font - woff2 - WOFF2 Font Format