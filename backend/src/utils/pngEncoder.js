const zlib = require('zlib');

// Module 13.3 — minimal PNG encoder with no new dependencies.
// Converts pdfjs-dist decoded image data ({ width, height, kind, data })
// into a PNG buffer. Dimensions and aspect ratio are preserved exactly.
//
// Supported pdfjs-dist image kinds:
//   1 = GRAYSCALE_1BPP (packed MSB-first bits; 1 = white, 0 = black,
//       matching pdf.js convertBlackAndWhiteToRGBA defaults)
//   2 = RGB_24BPP  (width * height * 3 bytes)
//   3 = RGBA_32BPP (width * height * 4 bytes)

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);

    for (let n = 0; n < 256; n++) {
        let c = n;

        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }

        table[n] = c >>> 0;
    }

    return table;
})();

function crc32(buffer) {
    let crc = 0xffffffff;

    for (let i = 0; i < buffer.length; i++) {
        crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

    return Buffer.concat([length, typeBuffer, data, crc]);
}

// Expands 1-bit packed rows (MSB first, stride = ceil(width / 8)) to RGB.
function expandGrayscale1Bpp(width, height, data) {
    const stride = Math.ceil(width / 8);
    const expected = stride * height;

    if (data.length < expected) {
        throw new Error(
            `Truncated 1-bit image data (need ${expected} bytes, got ${data.length}).`
        );
    }

    const rgb = Buffer.alloc(width * height * 3);
    let out = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const byte = data[y * stride + (x >> 3)];
            const bit = (byte >> (7 - (x & 7))) & 1;
            const value = bit ? 255 : 0;
            rgb[out++] = value;
            rgb[out++] = value;
            rgb[out++] = value;
        }
    }

    return rgb;
}

function encodePng(image) {
    const width = image && image.width;
    const height = image && image.height;
    const kind = image && image.kind;
    const data = image && image.data;

    if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width <= 0 ||
        height <= 0
    ) {
        throw new Error('Invalid image dimensions.');
    }

    if (!data || typeof data.length !== 'number') {
        throw new Error('Missing image pixel data.');
    }

    // colorType 2 = truecolor RGB, 6 = truecolor with alpha. 8 bits/channel.
    let colorType;
    let bytesPerPixel;
    let pixels;

    if (kind === 3) {
        if (data.length < width * height * 4) {
            throw new Error('Truncated RGBA image data.');
        }

        colorType = 6;
        bytesPerPixel = 4;
        pixels = data;
    } else if (kind === 2) {
        if (data.length < width * height * 3) {
            throw new Error('Truncated RGB image data.');
        }

        colorType = 2;
        bytesPerPixel = 3;
        pixels = data;
    } else if (kind === 1) {
        colorType = 2;
        bytesPerPixel = 3;
        pixels = expandGrayscale1Bpp(width, height, data);
    } else {
        throw new Error(`Unsupported image kind: ${kind}.`);
    }

    // One filter byte (0 = none) per scanline, rows copied directly so the
    // decoded pixels are never held twice longer than necessary.
    const stride = width * bytesPerPixel;
    const raw = Buffer.alloc((stride + 1) * height);

    for (let y = 0; y < height; y++) {
        const dest = y * (stride + 1);
        raw[dest] = 0;
        raw.set(pixels.subarray(y * stride, (y + 1) * stride), dest + 1);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = colorType;
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    return Buffer.concat([
        PNG_SIGNATURE,
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', zlib.deflateSync(raw)),
        pngChunk('IEND', Buffer.alloc(0)),
    ]);
}

module.exports = { encodePng };
