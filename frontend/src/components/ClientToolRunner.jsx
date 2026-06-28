import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Copy, Loader2, Wand2, Download, ExternalLink, Share2 } from 'lucide-react';
import * as Tools from '../lib/clientTools';
import { toast } from '../hooks/use-toast';

const COPY = (text) => {
  navigator.clipboard.writeText(text);
  toast({ title: 'Copied to clipboard' });
};

const isMobile = () => /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const saveAsTxt = (text, name='output.txt') => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  return URL.createObjectURL(blob);
};
const blobUrlForText = (text) => URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
const shareText = async (text, title='Toolverse result') => {
  try {
    const file = new File([text], 'output.txt', { type: 'text/plain' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title }); return; }
      catch (e) { if (e?.name === 'AbortError') return; }
    }
    if (navigator.share) {
      try { await navigator.share({ text, title }); return; }
      catch (e) { if (e?.name === 'AbortError') return; }
    }
    toast({ title: 'Sharing not supported on this device' });
  } catch (e) { /* user cancelled */ }
};

export default function ClientToolRunner({ tool }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [opts, setOpts] = useState({});
  const [busy, setBusy] = useState(false);

  const setOpt = (k, v) => setOpts(s => ({ ...s, [k]: v }));

  const run = async () => {
    setBusy(true);
    try {
      let result = '';
      switch (tool.client) {
        case 'wordCount': result = Tools.wordCount(input); break;
        case 'removeDuplicates': result = Tools.removeDuplicates(input); break;
        case 'removeEmptyLines': result = Tools.removeEmptyLines(input); break;
        case 'sortLines': result = Tools.sortLines(input, { desc: opts.desc }); break;
        case 'reverseLines': result = Tools.reverseLines(input); break;
        case 'caseConvert': result = Tools.caseConvert(input, { mode: opts.mode || 'upper' }); break;
        case 'findReplace': result = Tools.findReplace(input, { find: opts.find, replace: opts.replace, regex: opts.regex, caseInsensitive: opts.ci }); break;
        case 'base64Encode': result = Tools.base64Encode(input); break;
        case 'base64Decode': result = Tools.base64Decode(input); break;
        case 'urlEncode': result = Tools.urlEncode(input); break;
        case 'urlDecode': result = Tools.urlDecode(input); break;
        case 'htmlEncode': result = Tools.htmlEncode(input); break;
        case 'htmlDecode': result = Tools.htmlDecode(input); break;
        case 'jsonFormat': result = Tools.jsonFormat(input); break;
        case 'jsonMinify': result = Tools.jsonMinify(input); break;
        case 'jsonValidate': result = Tools.jsonValidate(input); break;
        case 'xmlFormat': result = Tools.xmlFormat(input); break;
        case 'xmlValidate': result = Tools.xmlValidate(input); break;
        case 'yamlFormat': result = Tools.yamlFormat(input); break;
        case 'htmlMinify': result = Tools.htmlMinify(input); break;
        case 'htmlBeautify': result = Tools.htmlBeautify(input); break;
        case 'cssMinify': result = Tools.cssMinify(input); break;
        case 'cssBeautify': result = Tools.cssBeautify(input); break;
        case 'jsMinify': result = Tools.jsMinify(input); break;
        case 'jsBeautify': result = Tools.jsBeautify(input); break;
        case 'hexToRgb':
          result = input.startsWith('#') ? Tools.hexToRgb(input) : Tools.rgbToHex(input);
          break;
        case 'passwordGen':
          result = Tools.passwordGen({ length: opts.length || 16, lower: opts.lower !== false, upper: opts.upper !== false, digits: opts.digits !== false, symbols: opts.symbols });
          break;
        case 'uuidGen': result = Tools.uuidGen(opts.count || 1); break;
        case 'loremGen': result = Tools.loremGen(opts.paras || 3); break;
        case 'md5': result = Tools.md5(input); break;
        case 'hashSha1': result = await Tools.hash(input, 'SHA-1'); break;
        case 'hashSha256': result = await Tools.hash(input, 'SHA-256'); break;
        case 'hashSha512': result = await Tools.hash(input, 'SHA-512'); break;
        default: result = 'Unsupported tool';
      }
      setOutput(result);
    } catch (e) {
      setOutput('Error: ' + e.message);
    } finally { setBusy(false); }
  };

  const needsInput = !['passwordGen', 'uuidGen', 'loremGen'].includes(tool.client);

  const renderOpts = () => {
    switch (tool.client) {
      case 'sortLines':
        return (
          <div className="flex items-center gap-3">
            <Switch checked={!!opts.desc} onCheckedChange={(v)=>setOpt('desc', v)} />
            <Label className="text-zinc-300 text-sm">Descending</Label>
          </div>
        );
      case 'caseConvert':
        return (
          <div>
            <Label className="text-zinc-300 text-sm">Mode</Label>
            <Select value={opts.mode || 'upper'} onValueChange={v=>setOpt('mode', v)}>
              <SelectTrigger className="mt-1.5 bg-zinc-950 border-white/10 text-white"><SelectValue/></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                {[['upper','UPPERCASE'],['lower','lowercase'],['title','Title Case'],['sentence','Sentence case'],['camel','camelCase'],['snake','snake_case'],['kebab','kebab-case']].map(([k,l])=>(
                  <SelectItem key={k} value={k}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'findReplace':
        return (
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Find" value={opts.find||''} onChange={e=>setOpt('find', e.target.value)} className="bg-zinc-950 border-white/10 text-white"/>
            <Input placeholder="Replace with" value={opts.replace||''} onChange={e=>setOpt('replace', e.target.value)} className="bg-zinc-950 border-white/10 text-white"/>
            <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={!!opts.regex} onChange={e=>setOpt('regex', e.target.checked)}/> Regex</label>
            <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={!!opts.ci} onChange={e=>setOpt('ci', e.target.checked)}/> Case-insensitive</label>
          </div>
        );
      case 'passwordGen':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-300 text-sm">Length: {opts.length || 16}</Label>
              <Slider value={[opts.length || 16]} min={4} max={64} step={1} onValueChange={v=>setOpt('length', v[0])} className="mt-3"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[['lower','lowercase'],['upper','UPPERCASE'],['digits','digits 0-9'],['symbols','symbols !@#']].map(([k,l])=>(
                <label key={k} className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={opts[k] !== false && (k==='symbols' ? !!opts[k] : true)} onChange={e=>setOpt(k, e.target.checked)}/> {l}</label>
              ))}
            </div>
          </div>
        );
      case 'uuidGen':
        return (
          <div>
            <Label className="text-zinc-300 text-sm">How many?</Label>
            <Input type="number" min={1} max={500} value={opts.count || 1} onChange={e=>setOpt('count', parseInt(e.target.value)||1)} className="mt-1.5 bg-zinc-950 border-white/10 text-white"/>
          </div>
        );
      case 'loremGen':
        return (
          <div>
            <Label className="text-zinc-300 text-sm">Paragraphs</Label>
            <Input type="number" min={1} max={50} value={opts.paras || 3} onChange={e=>setOpt('paras', parseInt(e.target.value)||3)} className="mt-1.5 bg-zinc-950 border-white/10 text-white"/>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-6 space-y-5">
      {needsInput && (
        <div>
          <Label className="text-zinc-300 text-sm mb-1.5 block">Input</Label>
          <Textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={tool.client.includes('hash') || tool.client === 'md5' ? 'Enter text to hash…' : 'Paste your text here…'} className="min-h-[180px] bg-zinc-950 border-white/10 text-white font-mono text-sm"/>
        </div>
      )}

      {renderOpts()}

      <Button onClick={run} disabled={busy} className="bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white h-11 px-6 border-0">
        {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Working…</> : <><Wand2 className="w-4 h-4 mr-2"/> Run</>}
      </Button>

      {output !== '' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-zinc-300 text-sm">Output</Label>
            <button onClick={()=>COPY(output)} className="text-zinc-400 hover:text-white text-xs inline-flex items-center gap-1"><Copy className="w-3.5 h-3.5"/> Copy</button>
          </div>
          <Textarea value={output} readOnly className="min-h-[180px] bg-zinc-950 border-white/10 text-white font-mono text-sm"/>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <a
              href={blobUrlForText(output)}
              download={`${tool.id}.txt`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white text-zinc-900 hover:bg-zinc-100 h-10 px-4 text-sm font-medium transition-colors"
              onClick={()=>toast({ title: 'Saving…' })}
            >
              <Download className="w-4 h-4"/> Download .txt
            </a>
            <a
              href={blobUrlForText(output)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 h-10 px-4 text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4"/> {isIOS() ? 'Open in Safari' : 'Open in tab'}
            </a>
            {(typeof navigator !== 'undefined' && typeof navigator.share === 'function') && (
              <button onClick={()=>shareText(output)} className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 h-10 px-4 text-sm font-medium transition-colors">
                <Share2 className="w-4 h-4"/> Share / Save
              </button>
            )}
            <button onClick={()=>COPY(output)} className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 h-10 px-4 text-sm font-medium transition-colors">
              <Copy className="w-4 h-4"/> Copy
            </button>
          </div>

          {isIOS() && (
            <p className="text-xs text-blue-200/80 mt-3 leading-relaxed">
              📱 <span className="font-medium text-blue-100">On iPhone/iPad</span>: tap <span className="text-white font-medium">Share / Save</span> → <span className="text-white font-medium">Save to Files</span>, or use <span className="text-white font-medium">Open in tab</span> then Safari's Share menu.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
