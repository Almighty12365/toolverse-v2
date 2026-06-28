/**
 * Client-side tool implementations - pure JS, no backend.
 * Each tool: (input, opts) => string | { output, type, blob }
 */

/* ---------- TEXT ---------- */
export const wordCount = (t) => {
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  const chars = t.length;
  const charsNoSpace = t.replace(/\s/g, '').length;
  const lines = t ? t.split(/\n/).length : 0;
  const sentences = t ? (t.match(/[.!?]+/g) || []).length : 0;
  const paragraphs = t ? t.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
  return `Words: ${words}\nCharacters: ${chars}\nCharacters (no spaces): ${charsNoSpace}\nLines: ${lines}\nSentences: ${sentences}\nParagraphs: ${paragraphs}`;
};

export const removeDuplicates = (t) => [...new Set(t.split('\n'))].join('\n');
export const removeEmptyLines = (t) => t.split('\n').filter(l => l.trim()).join('\n');
export const sortLines = (t, opts={}) => {
  const arr = t.split('\n');
  arr.sort();
  if (opts.desc) arr.reverse();
  return arr.join('\n');
};
export const reverseLines = (t) => t.split('\n').reverse().join('\n');

export const caseConvert = (t, opts={}) => {
  switch (opts.mode) {
    case 'upper': return t.toUpperCase();
    case 'lower': return t.toLowerCase();
    case 'title': return t.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
    case 'sentence': return t.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (m,p,c)=>p+c.toUpperCase());
    case 'camel': return t.replace(/[-_\s]+(.)?/g, (_,c)=>c?c.toUpperCase():'').replace(/^./, s=>s.toLowerCase());
    case 'snake': return t.trim().replace(/\s+/g, '_').toLowerCase();
    case 'kebab': return t.trim().replace(/\s+/g, '-').toLowerCase();
    default: return t;
  }
};

export const findReplace = (t, opts={}) => {
  if (!opts.find) return t;
  try {
    const flags = (opts.caseInsensitive ? 'i' : '') + 'g';
    const re = opts.regex ? new RegExp(opts.find, flags) : new RegExp(opts.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    return t.replace(re, opts.replace || '');
  } catch (e) { return `Error: ${e.message}`; }
};

/* ---------- ENCODERS ---------- */
export const base64Encode = (t) => {
  try { return btoa(unescape(encodeURIComponent(t))); } catch { return 'Error'; }
};
export const base64Decode = (t) => {
  try { return decodeURIComponent(escape(atob(t))); } catch { return 'Invalid Base64'; }
};
export const urlEncode = (t) => encodeURIComponent(t);
export const urlDecode = (t) => { try { return decodeURIComponent(t); } catch { return 'Invalid'; } };
export const htmlEncode = (t) => t.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export const htmlDecode = (t) => {
  const d = document.createElement('div'); d.innerHTML = t; return d.textContent || '';
};

/* ---------- FORMATTERS ---------- */
export const jsonFormat = (t) => {
  try { return JSON.stringify(JSON.parse(t), null, 2); } catch (e) { return `Invalid JSON: ${e.message}`; }
};
export const jsonMinify = (t) => {
  try { return JSON.stringify(JSON.parse(t)); } catch (e) { return `Invalid JSON: ${e.message}`; }
};
export const jsonValidate = (t) => {
  try { JSON.parse(t); return '✓ Valid JSON'; } catch (e) { return `✗ Invalid: ${e.message}`; }
};

export const xmlFormat = (t) => {
  let formatted = ''; let indent = '';
  t.split(/>\s*</).forEach(node => {
    if (node.match(/^\/\w/)) indent = indent.substring(2);
    formatted += indent + '<' + node + '>\n';
    if (node.match(/^<?\w[^>]*[^/]$/) && !node.startsWith('?')) indent += '  ';
  });
  return formatted.substring(1, formatted.length - 2);
};
export const xmlValidate = (t) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(t, 'application/xml');
  const err = doc.querySelector('parsererror');
  return err ? `✗ Invalid: ${err.textContent}` : '✓ Valid XML';
};

export const yamlFormat = (t) => t.split('\n').map(l => l.trimEnd()).join('\n');

/* ---------- HTML/CSS/JS ---------- */
export const htmlMinify = (t) => t.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
export const htmlBeautify = (t) => {
  let depth = 0, out = '';
  t.replace(/></g, '>\n<').split('\n').forEach(line => {
    if (line.match(/^<\//)) depth--;
    out += '  '.repeat(Math.max(0, depth)) + line + '\n';
    if (line.match(/^<[^/!?][^>]*[^/]>$/)) depth++;
  });
  return out.trim();
};
export const cssMinify = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim();
export const cssBeautify = (t) => t.replace(/\s*{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\s*}\s*/g, '\n}\n').replace(/,\s*/g, ',\n');
export const jsMinify = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim();
export const jsBeautify = (t) => t.replace(/;\s*/g, ';\n').replace(/\{\s*/g, ' {\n  ').replace(/\}\s*/g, '\n}\n');

/* ---------- GENERATORS ---------- */
export const passwordGen = (opts={}) => {
  const len = opts.length || 16;
  let chars = '';
  if (opts.lower !== false) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (opts.upper !== false) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.digits !== false) chars += '0123456789';
  if (opts.symbols) chars += '!@#$%^&*()_+-=[]{};:,.<>?';
  let pw = '';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) pw += chars[arr[i] % chars.length];
  return pw;
};

export const uuidGen = (count=1) => Array.from({length:count}, () => crypto.randomUUID()).join('\n');

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
export const loremGen = (paras=3) => Array.from({length: paras}, () => LOREM).join('\n\n');

/* ---------- HASH (using SubtleCrypto) ---------- */
export const hash = async (t, algo='SHA-256') => {
  const enc = new TextEncoder().encode(t);
  const buf = await crypto.subtle.digest(algo, enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

/* MD5 (lightweight implementation) */
export const md5 = (s) => {
  function rh(n){let j,s='';for(j=0;j<=3;j++)s+=((n>>(j*8+4))&15).toString(16)+((n>>(j*8))&15).toString(16);return s;}
  function ad(x,y){const l=(x&0xFFFF)+(y&0xFFFF);return (((x>>16)+(y>>16)+(l>>16))<<16)|(l&0xFFFF);}
  function rl(n,c){return (n<<c)|(n>>>(32-c));}
  function cm(q,a,b,x,s,t){return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
  function ff(a,b,c,d,x,s,t){return cm((b&c)|((~b)&d),a,b,x,s,t);}
  function gg(a,b,c,d,x,s,t){return cm((b&d)|(c&(~d)),a,b,x,s,t);}
  function hh(a,b,c,d,x,s,t){return cm(b^c^d,a,b,x,s,t);}
  function ii(a,b,c,d,x,s,t){return cm(c^(b|(~d)),a,b,x,s,t);}
  function c2b(str){const b=[];const n=str.length*8;for(let i=0;i<n;i+=8)b[i>>5]|=(str.charCodeAt(i/8)&255)<<(i%32);return b;}
  const x=c2b(unescape(encodeURIComponent(s)));x[s.length*8>>5]|=0x80<<((s.length*8)%32);x[(((s.length*8+64)>>>9)<<4)+14]=s.length*8;
  let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
  for(let i=0;i<x.length;i+=16){const oa=a,ob=b,oc=c,od=d;
    a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
    a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
    a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
    a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
    a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
    a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
    a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
    a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
    a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
    a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
    a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
    a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
    a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
    a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
    a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
    a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
    a=ad(a,oa);b=ad(b,ob);c=ad(c,oc);d=ad(d,od);
  }
  return rh(a)+rh(b)+rh(c)+rh(d);
};

/* ---------- COLOR ---------- */
export const hexToRgb = (hex) => {
  const m = hex.replace('#','').match(/.{1,2}/g);
  if (!m || m.length !== 3) return 'Invalid hex';
  const [r,g,b] = m.map(x => parseInt(x,16));
  return `rgb(${r}, ${g}, ${b})`;
};
export const rgbToHex = (rgb) => {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return 'Invalid RGB';
  return '#' + m.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase();
};
