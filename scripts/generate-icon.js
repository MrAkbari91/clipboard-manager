const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPng(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    const body = Buffer.concat([typeBuf, data]);
    let c = 0xffffffff;
    for (let i = 0; i < body.length; i++) {
      c ^= body[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    crcBuf.writeInt32BE((c ^ 0xffffffff) | 0, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Generate a 32x32 crisp clipboard icon
// Beautiful high-visibility clipboard: deep blue-purple backing, clean paper, high-contrast lines
const pngBuf = createPng(32, 32, (x, y) => {
  // Top clip ring / bracket
  if (x >= 11 && x <= 20 && y >= 2 && y <= 6) {
    if (x === 11 || x === 20 || y === 2 || y === 6) {
      return [220, 230, 245, 255]; // Light silver border
    }
    if (x >= 13 && x <= 18 && y >= 3 && y <= 4) {
      return [51, 65, 85, 255]; // Clip hole
    }
    return [241, 245, 249, 255]; // Silver fill
  }

  // Clipboard board
  if (x >= 4 && x <= 27 && y >= 5 && y <= 29) {
    // Board rounded corners
    if ((x === 4 || x === 27) && (y === 5 || y === 29)) {
      return [0, 0, 0, 0];
    }
    if ((x === 5 || x === 26) && (y === 5 || y === 29)) {
      return [0, 0, 0, 0];
    }

    // Inner paper
    if (x >= 8 && x <= 23 && y >= 10 && y <= 25) {
      // Paper lines
      if (y === 13 && x >= 11 && x <= 20) return [79, 70, 229, 255]; // Indigo line
      if (y === 17 && x >= 11 && x <= 20) return [100, 116, 139, 255]; // Slate line
      if (y === 21 && x >= 11 && x <= 17) return [100, 116, 139, 255]; // Slate line
      return [255, 255, 255, 255]; // Crisp white sheet
    }

    // Board body: vivid indigo/violet
    return [79, 70, 229, 255];
  }

  return [0, 0, 0, 0]; // Transparent
});

const outDir = path.join(__dirname, "../assets");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, "tray-icon.png");
fs.writeFileSync(outPath, pngBuf);
console.log("Successfully wrote:", outPath, "Size:", pngBuf.length);
console.log("Base64 representation:");
console.log("data:image/png;base64," + pngBuf.toString("base64"));
