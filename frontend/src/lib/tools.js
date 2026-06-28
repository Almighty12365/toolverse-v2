import {
  FilePlus2, Scissors, Archive, RotateCw, FileImage, ImagePlus,
  Stamp, Hash, Lock, Unlock, ListOrdered, Sparkles, MessageCircle,
  QrCode, ImageDown, Maximize2, FileType2, FileSearch,
  Trash2, FileOutput, ArrowLeftRight, Copy as CopyIcon, PlusSquare, Eraser,
  Crop, Layers, Wrench, Image as ImageIcon, FileText, Type, Search,
  GitCompare, Tag, FileSpreadsheet, FileCode2, Presentation as PresIcon,
  ScanText, FlipHorizontal2, Square, Aperture, Camera, Grid3x3,
  Barcode, FileArchive, Package, KeyRound, Database,
  Calculator, AlignLeft, ListChecks, ArrowDownUp, ArrowUpDown,
  CaseSensitive, Replace, Code2, Braces, FileJson2, Palette,
  Fingerprint, Key, Binary, Smile, Globe
} from 'lucide-react';

const EraserIcon = Eraser;

export const TOOL_CATEGORIES = [
  { id: 'organize', label: 'Organize PDF' },
  { id: 'optimize', label: 'Optimize PDF' },
  { id: 'convert', label: 'Convert PDF' },
  { id: 'edit',     label: 'Edit PDF' },
  { id: 'security', label: 'PDF Security' },
  { id: 'ai',       label: 'AI & OCR' },
  { id: 'image',    label: 'Image Tools' },
  { id: 'office',   label: 'Office' },
  { id: 'archive',  label: 'Archive' },
  { id: 'text',     label: 'Text Tools' },
  { id: 'dev',      label: 'Web Dev' },
  { id: 'utility',  label: 'Utilities' },
];

export const TOOLS = [
  // ----- Organize PDF -----
  { id:'merge',        name:'Merge PDF',        desc:'Combine multiple PDFs into one file.',          icon:FilePlus2,  category:'organize', color:'from-fuchsia-500 to-rose-500',  endpoint:'/pdf/merge', multi:true, accept:'pdf' },
  { id:'split',        name:'Split PDF',        desc:'Extract pages or split by range.',              icon:Scissors,   category:'organize', color:'from-violet-500 to-indigo-500', endpoint:'/pdf/split', accept:'pdf' },
  { id:'organize',     name:'Organize Pages',   desc:'Reorder pages by custom sequence.',             icon:ListOrdered,category:'organize', color:'from-cyan-500 to-sky-500',      endpoint:'/pdf/organize', accept:'pdf' },
  { id:'rotate',       name:'Rotate PDF',       desc:'Rotate selected or all pages.',                 icon:RotateCw,   category:'organize', color:'from-amber-400 to-orange-500',  endpoint:'/pdf/rotate', accept:'pdf' },
  { id:'delete-pages', name:'Delete Pages',     desc:'Remove specific pages from a PDF.',             icon:Trash2,     category:'organize', color:'from-red-500 to-rose-500',      endpoint:'/pdf/delete-pages', accept:'pdf' },
  { id:'extract-pages',name:'Extract Pages',    desc:'Pull selected pages into a new PDF.',           icon:FileOutput, category:'organize', color:'from-emerald-400 to-cyan-500',  endpoint:'/pdf/extract-pages', accept:'pdf' },
  { id:'reverse',      name:'Reverse PDF',      desc:'Reverse the order of pages.',                   icon:ArrowLeftRight, category:'organize', color:'from-pink-500 to-purple-500',endpoint:'/pdf/reverse', accept:'pdf' },
  { id:'duplicate-pages',name:'Duplicate Pages',desc:'Duplicate selected pages.',                     icon:CopyIcon,   category:'organize', color:'from-teal-400 to-cyan-500',     endpoint:'/pdf/duplicate-pages', accept:'pdf' },
  { id:'insert-blank', name:'Insert Blank',     desc:'Insert blank pages after a position.',          icon:PlusSquare, category:'organize', color:'from-blue-400 to-indigo-500',   endpoint:'/pdf/insert-blank', accept:'pdf' },
  { id:'remove-blank', name:'Remove Blank',     desc:'Strip blank pages automatically.',              icon:EraserIcon, category:'organize', color:'from-orange-400 to-red-500',    endpoint:'/pdf/remove-blank', accept:'pdf' },
  { id:'crop',         name:'Crop PDF',         desc:'Crop margins from pages.',                      icon:Crop,       category:'organize', color:'from-lime-400 to-emerald-500',  endpoint:'/pdf/crop', accept:'pdf' },
  { id:'resize-pdf',   name:'Resize PDF',       desc:'Change page size (A4, Letter…).',               icon:Maximize2,  category:'organize', color:'from-sky-400 to-blue-500',      endpoint:'/pdf/resize', accept:'pdf' },

  // ----- Optimize -----
  { id:'compress',     name:'Compress PDF',     desc:'Reduce file size while keeping quality.',       icon:Archive,    category:'optimize', color:'from-emerald-400 to-teal-500',  endpoint:'/pdf/compress', accept:'pdf' },
  { id:'flatten',      name:'Flatten PDF',      desc:'Rasterize pages — no more text edits.',         icon:Layers,     category:'optimize', color:'from-stone-400 to-zinc-500',    endpoint:'/pdf/flatten', accept:'pdf' },
  { id:'repair',       name:'Repair PDF',       desc:'Fix broken or corrupted PDFs.',                 icon:Wrench,     category:'optimize', color:'from-amber-400 to-rose-500',    endpoint:'/pdf/repair', accept:'pdf' },

  // ----- Convert -----
  { id:'pdf-to-img',   name:'PDF → JPG/PNG',    desc:'Convert pages to JPG or PNG.',                  icon:FileImage,  category:'convert',  color:'from-rose-400 to-pink-500',     endpoint:'/pdf/to-images', accept:'pdf' },
  { id:'img-to-pdf',   name:'Image → PDF',      desc:'Turn JPG / PNG into a single PDF.',             icon:ImagePlus,  category:'convert',  color:'from-blue-400 to-indigo-500',   endpoint:'/pdf/from-images', multi:true, accept:'image' },
  { id:'pdf-to-txt',   name:'PDF → Text',       desc:'Extract all text into a TXT file.',             icon:FileText,   category:'convert',  color:'from-zinc-400 to-stone-500',    endpoint:'/pdf/to-txt', accept:'pdf' },
  { id:'txt-to-pdf',   name:'Text → PDF',       desc:'Turn a TXT file into a clean PDF.',             icon:Type,       category:'convert',  color:'from-cyan-400 to-blue-500',     endpoint:'/txt/to-pdf', accept:'.txt' },
  { id:'pdf-to-html',  name:'PDF → HTML',       desc:'Convert pages to HTML markup.',                 icon:FileCode2,  category:'convert',  color:'from-orange-400 to-amber-500',  endpoint:'/pdf/to-html', accept:'pdf' },
  { id:'html-to-pdf',  name:'HTML → PDF',       desc:'Render HTML/CSS into a PDF.',                   icon:Globe,      category:'convert',  color:'from-pink-400 to-rose-500',     endpoint:'/html/to-pdf', accept:'.html,.htm' },
  { id:'pdf-to-csv',   name:'PDF → CSV',        desc:'Extract lines to CSV rows.',                    icon:FileSpreadsheet,category:'convert',color:'from-green-400 to-emerald-500',endpoint:'/pdf/to-csv', accept:'pdf' },
  { id:'csv-to-pdf',   name:'CSV → PDF',        desc:'Render CSV to a simple PDF table.',             icon:FileSpreadsheet,category:'convert',color:'from-emerald-400 to-teal-500', endpoint:'/csv/to-pdf', accept:'.csv' },
  { id:'pdf-to-svg',   name:'PDF → SVG',        desc:'Convert each page to vector SVG.',              icon:Code2,      category:'convert',  color:'from-purple-400 to-fuchsia-500',endpoint:'/pdf/to-svg', accept:'pdf' },
  { id:'pdf-to-word',  name:'PDF → Word',       desc:'Extract text into a DOCX file.',                icon:FileText,   category:'convert',  color:'from-blue-500 to-cyan-500',     endpoint:'/pdf/to-word', accept:'pdf' },
  { id:'word-to-pdf',  name:'Word → PDF',       desc:'Convert DOCX to a clean PDF.',                  icon:FileText,   category:'convert',  color:'from-indigo-400 to-blue-500',   endpoint:'/word/to-pdf', accept:'.docx' },
  { id:'pdf-to-excel', name:'PDF → Excel',      desc:'Extract text into XLSX worksheets.',            icon:FileSpreadsheet,category:'convert',color:'from-emerald-500 to-green-500',endpoint:'/pdf/to-excel', accept:'pdf' },
  { id:'excel-to-pdf', name:'Excel → PDF',      desc:'Convert XLSX into a PDF.',                      icon:FileSpreadsheet,category:'convert',color:'from-green-500 to-emerald-500',endpoint:'/excel/to-pdf', accept:'.xlsx' },
  { id:'ppt-to-pdf',   name:'PowerPoint → PDF', desc:'Convert PPTX slides to PDF.',                   icon:PresIcon,   category:'convert',  color:'from-orange-500 to-red-500',    endpoint:'/ppt/to-pdf', accept:'.pptx' },

  // ----- Edit -----
  { id:'watermark',    name:'Watermark',        desc:'Add a text watermark to every page.',           icon:Stamp,      category:'edit',     color:'from-purple-400 to-fuchsia-500',endpoint:'/pdf/watermark', accept:'pdf' },
  { id:'numbers',      name:'Page Numbers',     desc:'Add page numbers in any position.',             icon:Hash,       category:'edit',     color:'from-yellow-400 to-orange-500', endpoint:'/pdf/page-numbers', accept:'pdf' },
  { id:'header-footer',name:'Header & Footer',  desc:'Add header and footer text.',                   icon:AlignLeft,  category:'edit',     color:'from-cyan-400 to-blue-500',     endpoint:'/pdf/header-footer', accept:'pdf' },
  { id:'bates',        name:'Bates Numbering',  desc:'Add legal-style sequential numbers.',           icon:Tag,        category:'edit',     color:'from-amber-400 to-yellow-500',  endpoint:'/pdf/bates', accept:'pdf' },
  { id:'set-metadata', name:'Edit Metadata',    desc:'Set title, author, subject, keywords.',         icon:Database,   category:'edit',     color:'from-violet-400 to-purple-500', endpoint:'/pdf/set-metadata', accept:'pdf' },
  { id:'remove-metadata',name:'Remove Metadata',desc:'Strip PDF metadata completely.',                icon:EraserIcon,    category:'edit',     color:'from-rose-400 to-pink-500',     endpoint:'/pdf/remove-metadata', accept:'pdf' },

  // ----- Security -----
  { id:'protect',      name:'Protect PDF',      desc:'Encrypt with a strong password.',               icon:Lock,       category:'security', color:'from-red-400 to-rose-500',      endpoint:'/pdf/protect', accept:'pdf' },
  { id:'unlock',       name:'Unlock PDF',       desc:'Remove password protection.',                   icon:Unlock,     category:'security', color:'from-lime-400 to-emerald-500',  endpoint:'/pdf/unlock', accept:'pdf' },

  // ----- AI / OCR -----
  { id:'summarize',    name:'AI Summarize',     desc:'Get an instant smart summary of any PDF.',      icon:Sparkles,   category:'ai',       color:'from-fuchsia-500 to-cyan-400',  endpoint:'/ai/summarize', accept:'pdf' },
  { id:'chat-pdf',     name:'Chat with PDF',    desc:'Ask questions and chat with your document.',    icon:MessageCircle,category:'ai',     color:'from-indigo-400 to-purple-500', endpoint:'/ai/chat-pdf', accept:'pdf' },
  { id:'ocr-pdf',      name:'OCR PDF',          desc:'Extract text from scanned PDFs (Tesseract).',   icon:ScanText,   category:'ai',       color:'from-emerald-400 to-teal-500',  endpoint:'/ocr/pdf', accept:'pdf' },
  { id:'ocr-image',    name:'OCR Image',        desc:'Read text from any image.',                     icon:ScanText,   category:'ai',       color:'from-teal-400 to-cyan-500',     endpoint:'/ocr/image', accept:'image' },
  { id:'pdf-info',     name:'Inspect PDF',      desc:'See metadata, pages and properties.',           icon:FileSearch, category:'ai',       color:'from-sky-400 to-blue-500',      endpoint:'/pdf/info', accept:'pdf' },
  { id:'extract-images',name:'Extract Images',  desc:'Pull every image out of a PDF.',                icon:ImageIcon,  category:'ai',       color:'from-pink-400 to-rose-500',     endpoint:'/pdf/extract-images', accept:'pdf' },
  { id:'extract-text', name:'Extract Text',     desc:'Save full text content as .txt.',               icon:FileText,   category:'ai',       color:'from-zinc-400 to-stone-500',    endpoint:'/pdf/extract-text', accept:'pdf' },
  { id:'extract-fonts',name:'List Fonts',       desc:'Get a list of fonts used in a PDF.',            icon:CaseSensitive,category:'ai',     color:'from-amber-400 to-orange-500',  endpoint:'/pdf/extract-fonts', accept:'pdf' },
  { id:'search-pdf',   name:'Search in PDF',    desc:'Find a string and see matches.',                icon:Search,     category:'ai',       color:'from-cyan-400 to-blue-500',     endpoint:'/pdf/search', accept:'pdf' },
  { id:'compare',      name:'Compare PDFs',     desc:'Spot differences between two PDFs.',            icon:GitCompare, category:'ai',       color:'from-purple-400 to-indigo-500', endpoint:'/pdf/compare', accept:'pdf' },

  // ----- Image -----
  { id:'img-compress', name:'Compress Image',   desc:'Shrink JPG/PNG without losing quality.',        icon:ImageDown,  category:'image',    color:'from-teal-400 to-cyan-500',     endpoint:'/image/compress', accept:'image' },
  { id:'img-resize',   name:'Resize Image',     desc:'Resize images to any dimension.',               icon:Maximize2,  category:'image',    color:'from-pink-400 to-rose-500',     endpoint:'/image/resize', accept:'image' },
  { id:'img-convert',  name:'Convert Image',    desc:'PNG / JPG / WEBP / BMP / TIFF / GIF.',          icon:FileType2,  category:'image',    color:'from-orange-400 to-red-500',    endpoint:'/image/convert', accept:'image' },
  { id:'img-crop',     name:'Crop Image',       desc:'Crop pixels from any side.',                    icon:Crop,       category:'image',    color:'from-emerald-400 to-green-500', endpoint:'/image/crop', accept:'image' },
  { id:'img-rotate',   name:'Rotate Image',     desc:'Rotate by any angle.',                          icon:RotateCw,   category:'image',    color:'from-amber-400 to-orange-500',  endpoint:'/image/rotate', accept:'image' },
  { id:'img-flip',     name:'Flip Image',       desc:'Flip horizontally or vertically.',              icon:FlipHorizontal2,category:'image',color:'from-purple-400 to-fuchsia-500',endpoint:'/image/flip', accept:'image' },
  { id:'img-border',   name:'Add Border',       desc:'Add a colored border to images.',               icon:Square,     category:'image',    color:'from-sky-400 to-blue-500',      endpoint:'/image/border', accept:'image' },
  { id:'img-round',    name:'Round Corners',    desc:'Apply rounded-corner mask.',                    icon:Aperture,   category:'image',    color:'from-rose-400 to-pink-500',     endpoint:'/image/round-corners', accept:'image' },
  { id:'img-dpi',      name:'Change DPI',       desc:'Set image DPI (e.g. 72 → 300).',                icon:Camera,     category:'image',    color:'from-cyan-400 to-teal-500',     endpoint:'/image/dpi', accept:'image' },
  { id:'img-metadata', name:'Image Metadata',   desc:'View EXIF and image properties.',               icon:FileSearch, category:'image',    color:'from-slate-400 to-zinc-500',    endpoint:'/image/metadata', accept:'image' },
  { id:'img-remove-meta',name:'Strip Metadata', desc:'Remove EXIF & metadata from images.',           icon:EraserIcon, category:'image',    color:'from-zinc-400 to-stone-500',    endpoint:'/image/remove-metadata', accept:'image' },
  { id:'contact-sheet',name:'Contact Sheet',    desc:'Create a thumbnail grid from images.',          icon:Grid3x3,    category:'image',    color:'from-fuchsia-400 to-purple-500',endpoint:'/image/contact-sheet', multi:true, accept:'image' },
  { id:'favicon',      name:'Favicon Pack',     desc:'Generate full favicon set + .ico.',             icon:Smile,      category:'image',    color:'from-yellow-400 to-amber-500',  endpoint:'/image/favicon', accept:'image' },

  // ----- Archive -----
  { id:'zip-create',   name:'ZIP Create',       desc:'Bundle multiple files into a ZIP.',             icon:FileArchive,category:'archive',  color:'from-amber-400 to-orange-500',  endpoint:'/zip/create', multi:true, accept:'*' },
  { id:'zip-extract',  name:'ZIP Inspector',    desc:'List files inside a ZIP archive.',              icon:Package,    category:'archive',  color:'from-cyan-400 to-blue-500',     endpoint:'/zip/extract', accept:'.zip' },
  { id:'tar-create',   name:'TAR Create',       desc:'Bundle files as TAR archive.',                  icon:FileArchive,category:'archive',  color:'from-emerald-400 to-teal-500',  endpoint:'/tar/create', multi:true, accept:'*' },
  { id:'gzip-comp',    name:'GZIP Compress',    desc:'Compress any file with gzip.',                  icon:Archive,    category:'archive',  color:'from-pink-400 to-rose-500',     endpoint:'/gzip/compress', accept:'*' },
  { id:'gzip-decomp',  name:'GZIP Decompress',  desc:'Decompress a .gz file.',                        icon:Archive,    category:'archive',  color:'from-purple-400 to-fuchsia-500',endpoint:'/gzip/decompress', accept:'.gz' },

  // ----- TEXT (client-side) -----
  { id:'word-count',   name:'Word Counter',     desc:'Count words, characters, lines.',               icon:Calculator, category:'text',     color:'from-emerald-400 to-teal-500',  client:'wordCount' },
  { id:'remove-dup',   name:'Remove Duplicates',desc:'Remove duplicate lines from text.',             icon:ListChecks, category:'text',     color:'from-rose-400 to-pink-500',     client:'removeDuplicates' },
  { id:'remove-empty', name:'Remove Empty Lines',desc:'Strip empty lines.',                           icon:AlignLeft,  category:'text',     color:'from-violet-400 to-purple-500', client:'removeEmptyLines' },
  { id:'sort-lines',   name:'Sort Lines',       desc:'Sort lines alphabetically.',                    icon:ArrowDownUp,category:'text',     color:'from-cyan-400 to-blue-500',     client:'sortLines' },
  { id:'reverse-lines',name:'Reverse Lines',    desc:'Reverse line order.',                           icon:ArrowUpDown,category:'text',     color:'from-amber-400 to-orange-500',  client:'reverseLines' },
  { id:'case-convert', name:'Case Converter',   desc:'UPPER, lower, Title, camelCase, kebab…',        icon:CaseSensitive,category:'text',   color:'from-pink-400 to-rose-500',     client:'caseConvert' },
  { id:'find-replace', name:'Find & Replace',   desc:'Replace text with optional regex.',             icon:Replace,    category:'text',     color:'from-fuchsia-400 to-purple-500',client:'findReplace' },

  // ----- DEV -----
  { id:'b64-encode',   name:'Base64 Encode',    desc:'Encode text into Base64.',                      icon:Binary,     category:'dev',      color:'from-emerald-400 to-cyan-500',  client:'base64Encode' },
  { id:'b64-decode',   name:'Base64 Decode',    desc:'Decode Base64 to text.',                        icon:Binary,     category:'dev',      color:'from-cyan-400 to-blue-500',     client:'base64Decode' },
  { id:'url-encode',   name:'URL Encode',       desc:'Percent-encode URL strings.',                   icon:Globe,      category:'dev',      color:'from-amber-400 to-orange-500',  client:'urlEncode' },
  { id:'url-decode',   name:'URL Decode',       desc:'Decode percent-encoded URL.',                   icon:Globe,      category:'dev',      color:'from-orange-400 to-red-500',    client:'urlDecode' },
  { id:'html-encode',  name:'HTML Encode',      desc:'Escape special HTML characters.',               icon:Code2,      category:'dev',      color:'from-violet-400 to-purple-500', client:'htmlEncode' },
  { id:'html-decode',  name:'HTML Decode',      desc:'Unescape HTML entities.',                       icon:Code2,      category:'dev',      color:'from-purple-400 to-fuchsia-500',client:'htmlDecode' },
  { id:'json-format',  name:'JSON Formatter',   desc:'Pretty-print JSON.',                            icon:FileJson2,  category:'dev',      color:'from-amber-400 to-yellow-500',  client:'jsonFormat' },
  { id:'json-min',     name:'JSON Minifier',    desc:'Minify JSON to one line.',                      icon:FileJson2,  category:'dev',      color:'from-emerald-400 to-green-500', client:'jsonMinify' },
  { id:'json-valid',   name:'JSON Validator',   desc:'Validate JSON syntax.',                         icon:FileJson2,  category:'dev',      color:'from-teal-400 to-cyan-500',     client:'jsonValidate' },
  { id:'xml-format',   name:'XML Formatter',    desc:'Pretty-print XML.',                             icon:Code2,      category:'dev',      color:'from-pink-400 to-rose-500',     client:'xmlFormat' },
  { id:'xml-valid',    name:'XML Validator',    desc:'Validate XML structure.',                       icon:Code2,      category:'dev',      color:'from-rose-400 to-red-500',      client:'xmlValidate' },
  { id:'yaml-format',  name:'YAML Cleaner',     desc:'Normalise YAML whitespace.',                    icon:Braces,     category:'dev',      color:'from-orange-400 to-amber-500',  client:'yamlFormat' },
  { id:'html-min',     name:'HTML Minifier',    desc:'Minify HTML markup.',                           icon:Code2,      category:'dev',      color:'from-blue-400 to-indigo-500',   client:'htmlMinify' },
  { id:'html-beauty',  name:'HTML Beautifier',  desc:'Indent HTML nicely.',                           icon:Code2,      category:'dev',      color:'from-indigo-400 to-violet-500', client:'htmlBeautify' },
  { id:'css-min',      name:'CSS Minifier',     desc:'Minify CSS.',                                   icon:Code2,      category:'dev',      color:'from-cyan-400 to-sky-500',      client:'cssMinify' },
  { id:'css-beauty',   name:'CSS Beautifier',   desc:'Format CSS.',                                   icon:Code2,      category:'dev',      color:'from-sky-400 to-blue-500',      client:'cssBeautify' },
  { id:'js-min',       name:'JS Minifier',      desc:'Strip comments & whitespace.',                  icon:Code2,      category:'dev',      color:'from-yellow-400 to-amber-500',  client:'jsMinify' },
  { id:'js-beauty',    name:'JS Beautifier',    desc:'Beautify JavaScript.',                          icon:Code2,      category:'dev',      color:'from-amber-400 to-orange-500',  client:'jsBeautify' },
  { id:'hex-rgb',      name:'HEX ↔ RGB',        desc:'Convert color HEX to/from RGB.',                icon:Palette,    category:'dev',      color:'from-fuchsia-400 to-pink-500',  client:'hexToRgb' },
  { id:'qr',           name:'QR Generator',     desc:'Generate beautiful QR codes instantly.',        icon:QrCode,     category:'dev',      color:'from-amber-300 to-pink-500',    endpoint:'/qr/generate', noFile:true },
  { id:'barcode',      name:'Barcode Generator',desc:'EAN/CODE128/UPC barcodes.',                     icon:Barcode,    category:'dev',      color:'from-zinc-400 to-stone-500',    endpoint:'/barcode/generate', noFile:true },

  // ----- UTILITY -----
  { id:'password-gen', name:'Password Generator',desc:'Strong random passwords.',                     icon:KeyRound,   category:'utility',  color:'from-red-400 to-rose-500',      client:'passwordGen' },
  { id:'uuid-gen',     name:'UUID Generator',   desc:'Generate v4 UUIDs.',                            icon:Fingerprint,category:'utility',  color:'from-violet-400 to-purple-500', client:'uuidGen' },
  { id:'lorem',        name:'Lorem Ipsum',      desc:'Generate placeholder text.',                    icon:Type,       category:'utility',  color:'from-amber-400 to-orange-500',  client:'loremGen' },
  { id:'md5',          name:'MD5 Hash',         desc:'Compute MD5 hash of text.',                     icon:Key,        category:'utility',  color:'from-pink-400 to-fuchsia-500',  client:'md5' },
  { id:'sha1',         name:'SHA-1 Hash',       desc:'Compute SHA-1 hash.',                           icon:Key,        category:'utility',  color:'from-indigo-400 to-violet-500', client:'hashSha1' },
  { id:'sha256',       name:'SHA-256 Hash',     desc:'Compute SHA-256 hash.',                         icon:Key,        category:'utility',  color:'from-blue-400 to-indigo-500',   client:'hashSha256' },
  { id:'sha512',       name:'SHA-512 Hash',     desc:'Compute SHA-512 hash.',                         icon:Key,        category:'utility',  color:'from-cyan-400 to-blue-500',     client:'hashSha512' },
];

// Lucide doesn't export Eraser2 — handled via Eraser import above

export const findTool = (id) => TOOLS.find(t => t.id === id);
