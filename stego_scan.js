const fs = require('fs');
const path = process.argv[2] || 'C:/Users/hp/OneDrive/Pictures/challenge.jpg';

function hex(buf, n=32){
  return [...buf.slice(0,n)].map(b=>b.toString(16).padStart(2,'0')).join(' ');
}

if (!fs.existsSync(path)) {
  console.error('File not found:', path);
  process.exit(1);
}
const data = fs.readFileSync(path);
console.log('File size:', data.length, 'bytes');

// Search for ASCII flag pattern
const text = data.toString('latin1');
const m = text.match(/YTCTF\{[^}\n]{0,512}\}/);
if (m) {
  console.log('Found FLAG-like pattern:', m[0]);
}

// Parse JPEG markers and extract COM/APP1 text
function readUint16BE(buf, off){ return (buf[off]<<8) | buf[off+1]; }
if (data[0]===0xFF && data[1]===0xD8){
  let i=2;
  console.log('JPEG markers:');
  while (i+3 < data.length){
    if (data[i] !== 0xFF){ i++; continue; }
    let j=i; while (data[j]===0xFF) j++;
    const marker = data[j];
    i = j+1;
    if (marker === 0xD9 /*EOI*/){ console.log(' - EOI at', i-2); break; }
    if ((marker >= 0xD0 && marker <= 0xD7) || marker===0x01){
      console.log(` - Marker FF${marker.toString(16)} (no length)`);
      continue;
    }
    if (i+2 > data.length) break;
    const len = readUint16BE(data, i);
    const segStart = i+2;
    const segEnd = i + len;
    const name = `FF${marker.toString(16).padStart(2,'0')}`;
    console.log(` - ${name} length=${len}`);
    const seg = data.slice(segStart, Math.min(segEnd, data.length));
    // COM marker
    if (marker === 0xFE){
      const s = seg.toString('latin1');
      console.log('   COM:', s.length>120? s.slice(0,120)+'...' : s);
    }
    // APP1 EXIF
    if (marker === 0xE1){
      const head = seg.slice(0,10).toString('latin1');
      console.log('   APP1 head:', head.replace(/\n/g,'\\n'));
      const prints = seg.toString('latin1').match(/[ -~]{6,}/g);
      if (prints && prints.length){
        console.log('   APP1 printable (first 5):');
        for (const s of prints.slice(0,5)) console.log('    >', s.slice(0,120));
      }
    }
    i = segEnd;
  }
}

// Find JPEG EOI marker 0xFFD9
let eoiIndex = -1;
for (let i=0;i<data.length-1;i++){
  if (data[i]===0xFF && data[i+1]===0xD9){ eoiIndex = i+2; }
}
if (eoiIndex>0){
  console.log('Last JPEG EOI at offset', eoiIndex);
  if (eoiIndex < data.length){
    const tail = data.slice(eoiIndex);
    console.log('Appended data length:', tail.length);
    if (tail.length>0){
      // Identify common magic
      const magics = [
        {name:'ZIP', sig:Buffer.from('504b0304','hex')},
        {name:'PNG', sig:Buffer.from('89504e470d0a1a0a','hex')},
        {name:'RAR', sig:Buffer.from('526172211a0700','hex')},
        {name:'7Z',  sig:Buffer.from('377abcaf271c','hex')},
        {name:'GZIP',sig:Buffer.from('1f8b08','hex')},
        {name:'PDF', sig:Buffer.from('%PDF')},
        {name:'WAV', sig:Buffer.from('52494646','hex')},
        {name:'BMP', sig:Buffer.from('424d','hex')},
        {name:'TAR', sig:Buffer.from('7573746172','hex')},
      ];
      let found = 'UNKNOWN';
      for (const {name,sig} of magics){
        if (tail.slice(0,sig.length).equals(sig)) { found = name; break; }
      }
      console.log('Tail magic:', found, '| head:', hex(tail, 32));
      const out = path.replace(/\.[^.]+$/, '') + '_tail.bin';
      fs.writeFileSync(out, tail);
      console.log('Wrote tail to:', out);
      // Also try to extract printable strings from tail
      const printables = tail.toString('latin1').match(/[ -~]{6,}/g);
      if (printables && printables.length){
        console.log('Printable strings (first 20):');
        for (const s of printables.slice(0,20)) console.log('> '+s);
      }
    }
  }
}

// Quick scan for common steghide signature ("STEGO" sometimes used) and end markers
const hints = ['steg', 'flag', 'password', 'hint', 'key', 'secret'];
for (const h of hints){
  const idx = text.toLowerCase().indexOf(h);
  if (idx !== -1){
    console.log(`Hint '${h}' found at offset`, idx);
    console.log('Context:', text.slice(Math.max(0,idx-40), idx+40).replace(/\n/g,'\\n'));
  }
}

// Find base64-like long sequences
const b64regex = /[A-Za-z0-9/+]{40,}={0,2}/g;
const b64 = text.match(b64regex);
if (b64 && b64.length){
  console.log('Base64-like sequences found:', b64.length);
  const out = path.replace(/\.[^.]+$/, '') + '_b64.txt';
  fs.writeFileSync(out, b64.join('\n'));
  console.log('Wrote base64 candidates to:', out);
}

// Find long hex-like sequences
const hexRegex = /(?:[0-9A-Fa-f]{2}){20,}/g;
const hexes = text.match(hexRegex);
if (hexes && hexes.length){
  console.log('Hex-like sequences found:', hexes.length);
  const out = path.replace(/\.[^.]+$/, '') + '_hex.txt';
  fs.writeFileSync(out, hexes.join('\n'));
  console.log('Wrote hex candidates to:', out);
}
