// Copies the npHeroInk function from tools/heroink.js into the npHeroInk method of design/Main.dc.html.
// Usage: node tools/sync-heroink.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools', 'heroink.js'), 'utf8');
const body = src.slice(src.indexOf('{', src.indexOf('function npHeroInk')) + 1, src.lastIndexOf('}'));
const file = path.join(root, 'design', 'Main.dc.html');
let s = fs.readFileSync(file, 'utf8');
const START = '  npHeroInk(canvas, area, nav, sketchSrc, paintSrc) {', END = '  } // end npHeroInk';
const a = s.indexOf(START), b = s.indexOf(END);
if (a < 0 || b < 0) throw new Error('npHeroInk markers not found in Main.dc.html');
s = s.slice(0, a) + START + body.replace(/\s+$/, '\n') + s.slice(b);
fs.writeFileSync(file, s);
console.log('synced npHeroInk into Main.dc.html');
