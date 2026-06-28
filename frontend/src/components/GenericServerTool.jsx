import React, { useState } from 'react';
import Dropzone from './Dropzone';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { Loader2, Send, Wand2 } from 'lucide-react';
import { API } from '../lib/api';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import ResultPanel from './ResultPanel';

const acceptMap = {
  'pdf': 'application/pdf',
  'image': 'image/*',
  '*': '*',
};
const resolveAccept = (a) => acceptMap[a] || a || '*';

const downloadName = (id) => {
  const m = { merge:'merged.pdf', split:'split.zip', compress:'compressed.pdf', rotate:'rotated.pdf', 'pdf-to-img':'images.zip',
    'img-to-pdf':'images.pdf', watermark:'watermarked.pdf', numbers:'numbered.pdf', protect:'protected.pdf', unlock:'unlocked.pdf',
    organize:'organized.pdf', 'delete-pages':'pages-deleted.pdf', 'extract-pages':'extracted.pdf', reverse:'reversed.pdf',
    'duplicate-pages':'duplicated.pdf', 'insert-blank':'with-blanks.pdf', 'remove-blank':'no-blanks.pdf', crop:'cropped.pdf',
    'resize-pdf':'resized.pdf', flatten:'flattened.pdf', repair:'repaired.pdf', 'extract-images':'images.zip',
    'extract-text':'text.txt', 'header-footer':'header-footer.pdf', bates:'bates.pdf',
    'set-metadata':'with-metadata.pdf', 'remove-metadata':'stripped.pdf',
    'pdf-to-txt':'extracted.txt', 'txt-to-pdf':'from-text.pdf', 'pdf-to-html':'converted.html', 'html-to-pdf':'from-html.pdf',
    'pdf-to-csv':'out.csv', 'csv-to-pdf':'from-csv.pdf', 'pdf-to-svg':'svg-pages.zip',
    'pdf-to-word':'converted.docx', 'word-to-pdf':'from-word.pdf', 'pdf-to-excel':'converted.xlsx', 'excel-to-pdf':'from-excel.pdf',
    'ppt-to-pdf':'from-ppt.pdf', 'img-compress':'compressed.jpg', 'img-resize':'resized.png', 'img-convert':'converted',
    'img-crop':'cropped.png','img-rotate':'rotated.png','img-flip':'flipped.png','img-border':'bordered.png',
    'img-round':'rounded.png','img-dpi':'dpi-image','img-remove-meta':'no-metadata',
    'contact-sheet':'contact-sheet.jpg','favicon':'favicons.zip',
    'zip-create':'archive.zip','zip-extract':'zip-info.json','tar-create':'archive.tar','gzip-comp':'file.gz','gzip-decomp':'file',
    qr:'qr.png','barcode':'barcode.png',
  };
  return m[id] || 'output';
};

const jsonTools = ['extract-fonts', 'search-pdf', 'compare', 'pdf-info', 'img-metadata', 'zip-extract', 'ocr-pdf', 'ocr-image'];

export default function GenericServerTool({ tool }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultName, setResultName] = useState('');
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState('');
  const [opts, setOpts] = useState({
    ranges: '', level: 'medium', angle: 90, pages: '',
    text: 'CONFIDENTIAL', opacity: 0.3, color: '#888888',
    position: 'bottom-center', password: '', order: '',
    fmt: 'jpg', dpi: 150, quality: 70, width: 800, height: 0,
    target: 'png', qrText: '', qrSize: 10,
    count: 2, after_page: 1, top:0, bottom:0, left:0, right:0,
    size: 'A4', query: '', title:'', author:'', subject:'', keywords:'',
    header:'', footer:'', prefix:'', start:1, digits:6,
    direction:'horizontal', thickness:20, radius:40, cols:3, thumb:220,
    lang: 'eng', barcodeKind: 'code128', barcodeData: '12345678',
  });

  // AI chat states
  const [chatQ, setChatQ] = useState('');
  const [chatHist, setChatHist] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  const setOpt = (k, v) => setOpts(s => ({ ...s, [k]: v }));

  const buildForm = () => {
    const fd = new FormData();
    if (tool.multi) files.forEach(f => fd.append('files', f));
    else if (files[0]) fd.append('file', files[0]);
    // append all dynamic option params if relevant
    const o = opts;
    const addIf = (cond, key, val) => { if (cond) fd.append(key, val); };
    switch (tool.id) {
      case 'split': addIf(true, 'ranges', o.ranges); break;
      case 'compress': addIf(true, 'level', o.level); break;
      case 'rotate': addIf(true, 'angle', o.angle); addIf(true, 'pages', o.pages); break;
      case 'pdf-to-img': addIf(true, 'fmt', o.fmt); addIf(true, 'dpi', o.dpi); break;
      case 'watermark': addIf(true, 'text', o.text); addIf(true, 'opacity', o.opacity); addIf(true, 'color', o.color); addIf(true, 'angle', 0); break;
      case 'numbers': addIf(true, 'position', o.position); break;
      case 'protect': case 'unlock': addIf(true, 'password', o.password); break;
      case 'organize': addIf(true, 'order', o.order); break;
      case 'delete-pages': case 'extract-pages': addIf(true, 'pages', o.pages); break;
      case 'duplicate-pages': addIf(true, 'pages', o.pages); addIf(true, 'count', o.count); break;
      case 'insert-blank': addIf(true, 'after_page', o.after_page); addIf(true, 'count', o.count); break;
      case 'crop': ['top','bottom','left','right'].forEach(k => fd.append(k, o[k])); break;
      case 'resize-pdf': addIf(true, 'size', o.size); break;
      case 'flatten': addIf(true, 'dpi', o.dpi); break;
      case 'header-footer': addIf(true, 'header', o.header); addIf(true, 'footer', o.footer); break;
      case 'bates': addIf(true, 'prefix', o.prefix); addIf(true, 'start', o.start); addIf(true, 'digits', o.digits); break;
      case 'set-metadata': ['title','author','subject','keywords'].forEach(k => fd.append(k, o[k])); break;
      case 'search-pdf': addIf(true, 'query', o.query); break;
      case 'img-compress': addIf(true, 'quality', o.quality); break;
      case 'img-resize': addIf(true, 'width', o.width); addIf(true, 'height', o.height); break;
      case 'img-convert': addIf(true, 'target', o.target); break;
      case 'img-crop': ['left','top','right','bottom'].forEach(k => fd.append(k, o[k])); break;
      case 'img-rotate': addIf(true, 'angle', o.angle); break;
      case 'img-flip': addIf(true, 'direction', o.direction); break;
      case 'img-border': addIf(true, 'thickness', o.thickness); addIf(true, 'color', o.color); break;
      case 'img-round': addIf(true, 'radius', o.radius); break;
      case 'img-dpi': addIf(true, 'dpi', o.dpi); break;
      case 'contact-sheet': addIf(true, 'cols', o.cols); addIf(true, 'thumb', o.thumb); break;
      case 'ocr-pdf': case 'ocr-image': addIf(true, 'lang', o.lang); break;
      default: break;
    }
    return fd;
  };

  const handleRun = async () => {
    if (tool.id === 'qr' || tool.id === 'barcode') {
      // No file
    } else if (tool.id === 'compare') {
      if (files.length < 2) { toast({ title: 'Please add 2 PDFs to compare' }); return; }
    } else if (!files.length) {
      toast({ title: 'Please add a file first' });
      return;
    }
    setBusy(true); setResultBlob(null); setResult(null); setSummary('');
    try {
      let endpoint = tool.endpoint;
      let fd;

      if (tool.id === 'qr') {
        fd = new FormData(); fd.append('data', opts.qrText || 'https://toolverse.app'); fd.append('size', opts.qrSize);
      } else if (tool.id === 'barcode') {
        fd = new FormData(); fd.append('data', opts.barcodeData || '12345678'); fd.append('kind', opts.barcodeKind);
      } else if (tool.id === 'compare') {
        fd = new FormData(); fd.append('file1', files[0]); fd.append('file2', files[1]);
      } else if (tool.id === 'summarize') {
        fd = new FormData(); fd.append('file', files[0]);
      } else {
        fd = buildForm();
      }

      // JSON-returning tools
      if (jsonTools.includes(tool.id)) {
        const res = await axios.post(`${API}${endpoint}`, fd);
        setResult(res.data); setBusy(false); return;
      }
      if (tool.id === 'summarize') {
        const res = await axios.post(`${API}${endpoint}`, fd);
        setSummary(res.data.summary || ''); setBusy(false); return;
      }

      // Blob-returning tools — preview, don't auto-download
      const res = await axios.post(`${API}${endpoint}`, fd, { responseType: 'blob' });
      setResultBlob(res.data);
      setResultName(downloadName(tool.id));
      toast({ title: 'Ready!', description: 'Preview & save below.' });
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || 'Something went wrong';
      toast({ title: 'Failed', description: typeof msg === 'string' ? msg : 'Try again' });
    } finally { setBusy(false); }
  };

  const sendChat = async () => {
    if (!chatQ.trim() || !files[0]) return;
    const q = chatQ; setChatQ('');
    setChatHist(h => [...h, { role: 'user', text: q }]);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', files[0]); fd.append('question', q);
      if (sessionId) fd.append('session_id', sessionId);
      const res = await axios.post(`${API}/ai/chat-pdf`, fd);
      setSessionId(res.data.session_id);
      setChatHist(h => [...h, { role: 'ai', text: res.data.answer }]);
    } catch (e) {
      setChatHist(h => [...h, { role: 'ai', text: 'Sorry, something went wrong.' }]);
    } finally { setBusy(false); }
  };

  const renderOptions = () => {
    const o = opts;
    switch (tool.id) {
      case 'split': return <Field label="Page ranges (optional)"><Input value={o.ranges} onChange={e=>setOpt('ranges', e.target.value)} placeholder="e.g. 1-3,5,7-9" className="bg-zinc-950 border-white/10 text-white"/></Field>;
      case 'compress': return <SelectField label="Compression" value={o.level} onChange={v=>setOpt('level',v)} options={[['low','Low (best quality)'],['medium','Medium'],['high','High (smallest)']]}/>;
      case 'rotate': return <div className="grid grid-cols-2 gap-4">
        <SelectField label="Angle" value={String(o.angle)} onChange={v=>setOpt('angle',parseInt(v))} options={[['90','90°'],['180','180°'],['270','270°']]}/>
        <Field label="Pages (optional)"><Input value={o.pages} onChange={e=>setOpt('pages',e.target.value)} placeholder="e.g. 1,3-5" className="bg-zinc-950 border-white/10 text-white"/></Field>
      </div>;
      case 'pdf-to-img': return <div className="grid grid-cols-2 gap-4">
        <SelectField label="Format" value={o.fmt} onChange={v=>setOpt('fmt',v)} options={[['jpg','JPG'],['png','PNG']]}/>
        <SliderField label={`DPI: ${o.dpi}`} value={o.dpi} min={72} max={300} onChange={v=>setOpt('dpi',v)}/>
      </div>;
      case 'watermark': return <>
        <Field label="Watermark text"><Input value={o.text} onChange={e=>setOpt('text',e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        <div className="grid grid-cols-2 gap-4">
          <SliderField label={`Opacity: ${o.opacity.toFixed(2)}`} value={o.opacity} min={0.05} max={1} step={0.05} onChange={v=>setOpt('opacity',v)}/>
          <Field label="Color"><Input type="color" value={o.color} onChange={e=>setOpt('color',e.target.value)} className="bg-zinc-950 border-white/10 h-10"/></Field>
        </div>
      </>;
      case 'numbers': return <SelectField label="Position" value={o.position} onChange={v=>setOpt('position',v)} options={['top-left','top-center','top-right','bottom-left','bottom-center','bottom-right'].map(p=>[p,p.replace('-',' ')])}/>;
      case 'protect': case 'unlock': return <Field label="Password"><Input type="password" value={o.password} onChange={e=>setOpt('password',e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field>;
      case 'organize': return <Field label="Page order (e.g. 3,1,2)"><Input value={o.order} onChange={e=>setOpt('order',e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field>;
      case 'delete-pages': case 'extract-pages': return <Field label="Pages (e.g. 1,3-5)"><Input value={o.pages} onChange={e=>setOpt('pages',e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field>;
      case 'duplicate-pages': return <div className="grid grid-cols-2 gap-4">
        <Field label="Pages"><Input value={o.pages} onChange={e=>setOpt('pages',e.target.value)} placeholder="1,3" className="bg-zinc-950 border-white/10 text-white"/></Field>
        <Field label="Times"><Input type="number" min="2" value={o.count} onChange={e=>setOpt('count',parseInt(e.target.value)||2)} className="bg-zinc-950 border-white/10 text-white"/></Field>
      </div>;
      case 'insert-blank': return <div className="grid grid-cols-2 gap-4">
        <Field label="After page #"><Input type="number" min="0" value={o.after_page} onChange={e=>setOpt('after_page',parseInt(e.target.value)||0)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        <Field label="How many"><Input type="number" min="1" value={o.count} onChange={e=>setOpt('count',parseInt(e.target.value)||1)} className="bg-zinc-950 border-white/10 text-white"/></Field>
      </div>;
      case 'crop': return <div className="grid grid-cols-4 gap-3">
        {['top','bottom','left','right'].map(k=>(
          <Field key={k} label={`${k} (pt)`}><Input type="number" value={o[k]} onChange={e=>setOpt(k,parseFloat(e.target.value)||0)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        ))}
      </div>;
      case 'resize-pdf': return <SelectField label="Page size" value={o.size} onChange={v=>setOpt('size',v)} options={[['A4','A4'],['A3','A3'],['A5','A5'],['Letter','Letter'],['Legal','Legal']]}/>;
      case 'flatten': return <SliderField label={`DPI: ${o.dpi}`} value={o.dpi} min={72} max={300} onChange={v=>setOpt('dpi',v)}/>;
      case 'header-footer': return <><Field label="Header text"><Input value={o.header} onChange={e=>setOpt('header',e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        <Field label="Footer text"><Input value={o.footer} onChange={e=>setOpt('footer',e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field></>;
      case 'bates': return <div className="grid grid-cols-3 gap-3">
        <Field label="Prefix"><Input value={o.prefix} onChange={e=>setOpt('prefix',e.target.value)} placeholder="DOC-" className="bg-zinc-950 border-white/10 text-white"/></Field>
        <Field label="Start"><Input type="number" value={o.start} onChange={e=>setOpt('start',parseInt(e.target.value)||1)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        <Field label="Digits"><Input type="number" value={o.digits} onChange={e=>setOpt('digits',parseInt(e.target.value)||6)} className="bg-zinc-950 border-white/10 text-white"/></Field>
      </div>;
      case 'set-metadata': return <div className="grid grid-cols-2 gap-3">
        {[['title','Title'],['author','Author'],['subject','Subject'],['keywords','Keywords']].map(([k,l])=>(
          <Field key={k} label={l}><Input value={o[k]} onChange={e=>setOpt(k,e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        ))}
      </div>;
      case 'search-pdf': return <Field label="Search query"><Input value={o.query} onChange={e=>setOpt('query',e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field>;
      case 'img-compress': return <SliderField label={`Quality: ${o.quality}`} value={o.quality} min={10} max={95} onChange={v=>setOpt('quality',v)}/>;
      case 'img-resize': return <div className="grid grid-cols-2 gap-4">
        <Field label="Width (px)"><Input type="number" value={o.width} onChange={e=>setOpt('width',parseInt(e.target.value)||0)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        <Field label="Height (0=auto)"><Input type="number" value={o.height} onChange={e=>setOpt('height',parseInt(e.target.value)||0)} className="bg-zinc-950 border-white/10 text-white"/></Field>
      </div>;
      case 'img-convert': return <SelectField label="Format" value={o.target} onChange={v=>setOpt('target',v)} options={['png','jpg','webp','bmp'].map(f=>[f,f.toUpperCase()])}/>;
      case 'img-crop': return <div className="grid grid-cols-4 gap-3">
        {['left','top','right','bottom'].map(k=>(
          <Field key={k} label={`${k} (px)`}><Input type="number" value={o[k]} onChange={e=>setOpt(k,parseInt(e.target.value)||0)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        ))}
      </div>;
      case 'img-rotate': return <Field label="Angle (°)"><Input type="number" value={o.angle} onChange={e=>setOpt('angle',parseFloat(e.target.value)||0)} className="bg-zinc-950 border-white/10 text-white"/></Field>;
      case 'img-flip': return <SelectField label="Direction" value={o.direction} onChange={v=>setOpt('direction',v)} options={[['horizontal','Horizontal'],['vertical','Vertical']]}/>;
      case 'img-border': return <div className="grid grid-cols-2 gap-4">
        <Field label="Thickness"><Input type="number" value={o.thickness} onChange={e=>setOpt('thickness',parseInt(e.target.value)||0)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        <Field label="Color"><Input type="color" value={o.color} onChange={e=>setOpt('color',e.target.value)} className="bg-zinc-950 border-white/10 h-10"/></Field>
      </div>;
      case 'img-round': return <SliderField label={`Radius: ${o.radius}`} value={o.radius} min={0} max={200} onChange={v=>setOpt('radius',v)}/>;
      case 'img-dpi': return <Field label="DPI"><Input type="number" value={o.dpi} onChange={e=>setOpt('dpi',parseInt(e.target.value)||300)} className="bg-zinc-950 border-white/10 text-white"/></Field>;
      case 'contact-sheet': return <div className="grid grid-cols-2 gap-4">
        <Field label="Columns"><Input type="number" value={o.cols} onChange={e=>setOpt('cols',parseInt(e.target.value)||3)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        <Field label="Thumb size"><Input type="number" value={o.thumb} onChange={e=>setOpt('thumb',parseInt(e.target.value)||220)} className="bg-zinc-950 border-white/10 text-white"/></Field>
      </div>;
      case 'ocr-pdf': case 'ocr-image': return <SelectField label="Language" value={o.lang} onChange={v=>setOpt('lang',v)} options={[['eng','English'],['fra','French'],['deu','German'],['spa','Spanish']]}/>;
      case 'qr': return <>
        <Field label="Content (URL/text)"><Input value={o.qrText} onChange={e=>setOpt('qrText',e.target.value)} placeholder="https://example.com" className="bg-zinc-950 border-white/10 text-white"/></Field>
        <SliderField label={`Size: ${o.qrSize}`} value={o.qrSize} min={4} max={20} onChange={v=>setOpt('qrSize',v)}/>
      </>;
      case 'barcode': return <>
        <Field label="Data"><Input value={o.barcodeData} onChange={e=>setOpt('barcodeData',e.target.value)} className="bg-zinc-950 border-white/10 text-white"/></Field>
        <SelectField label="Type" value={o.barcodeKind} onChange={v=>setOpt('barcodeKind',v)} options={[['code128','CODE128'],['code39','CODE39'],['ean13','EAN-13'],['ean8','EAN-8'],['upca','UPC-A'],['isbn13','ISBN-13']]}/>
      </>;
      case 'compare': return <p className="text-xs text-zinc-500">Upload exactly two PDFs above.</p>;
      default: return null;
    }
  };

  // Special chat UI
  if (tool.id === 'chat-pdf') {
    return (
      <Section>
        <Dropzone files={files} setFiles={setFiles} multiple={false} accept="application/pdf" label="Upload your PDF to chat with it" />
        {files[0] && (
          <>
            <div className="border border-white/5 rounded-xl bg-zinc-950/60 p-4 max-h-[420px] overflow-y-auto space-y-3">
              {chatHist.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-8">Ask anything about your PDF — summary, key points, specific data…</p>
              )}
              {chatHist.map((m, i) => (
                <div key={i} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role==='user' ? 'bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white' : 'bg-zinc-800 text-zinc-100'}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={chatQ} onChange={e=>setChatQ(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && sendChat()} placeholder="Ask a question about your PDF…" className="bg-zinc-950 border-white/10 text-white"/>
              <Button onClick={sendChat} disabled={busy} className="bg-white text-zinc-900 hover:bg-zinc-100">{busy ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}</Button>
            </div>
          </>
        )}
      </Section>
    );
  }

  // Compare: two files
  if (tool.id === 'compare') {
    return (
      <Section>
        <Dropzone files={files} setFiles={setFiles} multiple={true} accept="application/pdf" label="Upload 2 PDFs to compare" />
        <Button onClick={handleRun} disabled={busy || files.length < 2} className="bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white border-0 h-11 px-6">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Compare
        </Button>
        {result && <pre className="mt-3 bg-zinc-950 border border-white/10 rounded-xl p-4 text-zinc-200 text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>}
      </Section>
    );
  }

  const showDropzone = !tool.noFile;

  return (
    <Section>
      {showDropzone && (
        <Dropzone files={files} setFiles={setFiles} multiple={!!tool.multi} accept={resolveAccept(tool.accept)} label={tool.multi ? 'Drop files or click to upload' : 'Drop file or click to upload'} />
      )}
      {renderOptions()}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleRun} disabled={busy} className="bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white h-11 px-6 border-0">
          {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Processing…</> : <><Wand2 className="w-4 h-4 mr-2"/> {tool.noFile ? 'Generate' : 'Process'}</>}
        </Button>
      </div>

      {summary && (
        <div className="mt-4 border border-white/10 bg-zinc-950/70 rounded-xl p-5">
          <h3 className="text-white font-medium mb-2">AI Summary</h3>
          <pre className="whitespace-pre-wrap text-zinc-200 text-sm font-sans">{summary}</pre>
        </div>
      )}

      {result && (
        <div className="mt-3 bg-zinc-950 border border-white/10 rounded-xl p-4 text-zinc-200 text-sm">
          {result.text ? (
            <Textarea readOnly value={result.text} className="min-h-[220px] bg-transparent border-0 text-white font-mono text-sm"/>
          ) : (
            <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}

      {resultBlob && (
        <ResultPanel blob={resultBlob} filename={resultName} onClose={()=>setResultBlob(null)} />
      )}
    </Section>
  );
}

const Section = ({ children }) => (
  <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-5">{children}</div>
);
const Field = ({ label, children }) => (
  <div><Label className="text-zinc-300 text-sm">{label}</Label><div className="mt-1.5">{children}</div></div>
);
const SelectField = ({ label, value, onChange, options }) => (
  <Field label={label}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-zinc-950 border-white/10 text-white"><SelectValue/></SelectTrigger>
      <SelectContent className="bg-zinc-900 border-white/10 text-white">
        {options.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  </Field>
);
const SliderField = ({ label, value, min, max, step=1, onChange }) => (
  <div><Label className="text-zinc-300 text-sm">{label}</Label>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v)=>onChange(v[0])} className="mt-3"/>
  </div>
);
