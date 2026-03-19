// Generates PNG icons for PWA without external deps
const fs = require("fs");
const zlib = require("zlib");

function createPNG(size) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const t = Buffer.from(type);
    const crc = crc32(Buffer.concat([t, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, t, data, crcBuf]);
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (const byte of buf) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Image data: gradient from #f97316 to #ec4899
  const rows = [];
  const r = size; // corner radius approximation
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    // Gradient: orange (#f97316) → pink (#ec4899)
    const R = Math.round(249 + (236 - 249) * t);
    const G = Math.round(115 + (72 - 115) * t);
    const B = Math.round(22 + (153 - 22) * t);

    const row = Buffer.alloc(1 + size * 3); // filter byte + RGB pixels
    row[0] = 0; // filter type None
    for (let x = 0; x < size; x++) {
      // Rounded corners mask
      const cr = Math.round(size * 0.22); // corner radius
      let alpha = 1;
      const dx = Math.min(x, size - 1 - x);
      const dy = Math.min(y, size - 1 - y);
      if (dx < cr && dy < cr) {
        const dist = Math.sqrt((cr - dx) ** 2 + (cr - dy) ** 2);
        if (dist > cr) alpha = 0;
      }

      if (alpha === 0) {
        // White background for transparent corners
        row[1 + x * 3] = 255;
        row[2 + x * 3] = 248;
        row[3 + x * 3] = 240;
      } else {
        row[1 + x * 3] = R;
        row[2 + x * 3] = G;
        row[3 + x * 3] = B;
      }
    }

    // Add ✈️ emoji area: simple white plane shape in the center
    // Draw a simple "A" shape in white as a plane silhouette
    const cx = size / 2;
    const cy = size / 2;
    const scale = size / 192;
    // Plane body: horizontal white bar
    if (y >= cy - 8 * scale && y <= cy + 8 * scale) {
      const hw = 55 * scale;
      for (let x = cx - hw; x <= cx + hw; x++) {
        if (x >= 0 && x < size) {
          row[1 + Math.round(x) * 3] = 255;
          row[2 + Math.round(x) * 3] = 255;
          row[3 + Math.round(x) * 3] = 255;
        }
      }
    }
    // Plane nose (right triangle tip)
    if (y >= cy - 12 * scale && y <= cy + 12 * scale) {
      const ext = (12 * scale - Math.abs(y - cy)) * 1.5;
      const nx = cx + 55 * scale;
      for (let x = nx; x <= nx + ext; x++) {
        if (x >= 0 && x < size) {
          row[1 + Math.round(x) * 3] = 255;
          row[2 + Math.round(x) * 3] = 255;
          row[3 + Math.round(x) * 3] = 255;
        }
      }
    }
    // Wings
    if (y >= cy - 30 * scale && y <= cy + 5 * scale) {
      const wy = (y - (cy - 30 * scale)) / (35 * scale);
      const wx = 30 * scale * wy;
      for (let x = cx - wx; x <= cx + wx; x++) {
        if (x >= 0 && x < size) {
          row[1 + Math.round(x) * 3] = 255;
          row[2 + Math.round(x) * 3] = 255;
          row[3 + Math.round(x) * 3] = 255;
        }
      }
    }
    // Tail
    if (y >= cy - 50 * scale && y <= cy - 20 * scale) {
      const ty = (y - (cy - 50 * scale)) / (30 * scale);
      const tw = 15 * scale * ty;
      const tx = cx - 40 * scale;
      for (let x = tx - tw; x <= tx + tw; x++) {
        if (x >= 0 && x < size) {
          row[1 + Math.round(x) * 3] = 255;
          row[2 + Math.round(x) * 3] = 255;
          row[3 + Math.round(x) * 3] = 255;
        }
      }
    }

    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw);
  const idat = chunk("IDAT", compressed);
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, chunk("IHDR", ihdr), idat, iend]);
}

fs.writeFileSync("public/icons/icon-192.png", createPNG(192));
fs.writeFileSync("public/icons/icon-512.png", createPNG(512));
console.log("✅ PNG icons generated: icon-192.png and icon-512.png");
