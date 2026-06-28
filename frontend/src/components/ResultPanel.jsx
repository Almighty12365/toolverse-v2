import React, { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Share2, Copy, FileText, Image as ImageIcon, FileArchive, Apple, X, Loader2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';

/**
 * Cross-platform result viewer with iOS-friendly save options.
 * Critical fixes:
 *  - Download & Open-in-new-tab rendered as <a> tags (not buttons) — iOS Safari requires direct
 *    anchor with target/download attributes; window.open() is unreliable.
 *  - Share button uses navigator.share with File first; falls back to URL share; logs errors.
 *  - Blob URLs are kept alive while panel is mounted.
 */

const isIOS = () => typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);
const isMobile = () => typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);

const mimeFromName = (name = '') => {
  const n = name.toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.zip': 'application/zip', '.tar': 'application/x-tar', '.gz': 'application/gzip',
    '.txt': 'text/plain', '.csv': 'text/csv', '.html': 'text/html', '.htm': 'text/html',
    '.xml': 'application/xml', '.json': 'application/json',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  for (const ext of Object.keys(map)) if (n.endsWith(ext)) return map[ext];
  return 'application/octet-stream';
};

const kindFromName = (name = '') => {
  const n = name.toLowerCase();
  if (n.match(/\.(png|jpg|jpeg|webp|gif|bmp|svg|ico)$/)) return 'image';
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.match(/\.(zip|tar|gz|7z)$/)) return 'archive';
  if (n.match(/\.(txt|csv|html|htm|xml|json|svg|md)$/)) return 'text';
  if (n.match(/\.(docx|xlsx|pptx)$/)) return 'office';
  return 'binary';
};

// Base button classes (so anchors can look like buttons)
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-md bg-white text-zinc-900 hover:bg-zinc-100 h-10 px-4 text-sm font-medium transition-colors';
const btnOutline = 'inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 h-10 px-4 text-sm font-medium transition-colors';

export default function ResultPanel({ blob, filename, onClose }) {
  const [url, setUrl] = useState('');
  const [textPreview, setTextPreview] = useState('');
  const [sharing, setSharing] = useState(false);
  const kind = useMemo(() => kindFromName(filename), [filename]);

  // Make a properly-typed blob so iOS knows what to do
  const typedBlob = useMemo(() => {
    if (!blob) return null;
    if (blob.type && blob.type !== 'application/octet-stream') return blob;
    return new Blob([blob], { type: mimeFromName(filename) });
  }, [blob, filename]);

  useEffect(() => {
    if (!typedBlob) return;
    const u = URL.createObjectURL(typedBlob);
    setUrl(u);
    if (kind === 'text' && typedBlob.size < 200_000) {
      typedBlob.text().then(t => setTextPreview(t.slice(0, 100_000))).catch(()=>{});
    }
    return () => {
      // Delay revocation slightly so that any in-flight click on anchors completes
      setTimeout(() => URL.revokeObjectURL(u), 60_000);
    };
  }, [typedBlob, kind]);

  const handleCopyText = async () => {
    if (textPreview) {
      try {
        await navigator.clipboard.writeText(textPreview);
        toast({ title: 'Text copied' });
      } catch {
        toast({ title: 'Copy failed' });
      }
    }
  };

  const handleShare = async () => {
    if (!typedBlob) return;
    setSharing(true);
    try {
      const file = new File([typedBlob], filename, { type: typedBlob.type });
      // Best path: share file (iOS Share Sheet → Save to Files)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filename });
          return;
        } catch (err) {
          if (err && err.name === 'AbortError') return;
          // continue to fallback
        }
      }
      // Fallback 1: share without files (URL share)
      if (navigator.share) {
        try {
          await navigator.share({ title: filename, text: filename, url });
          return;
        } catch (err) {
          if (err && err.name === 'AbortError') return;
        }
      }
      // Fallback 2: no share — open the file inline so the user can use Safari's Share menu
      window.location.assign(url);
    } catch (e) {
      toast({ title: 'Share failed', description: e?.message || 'Try Download instead' });
    } finally {
      setSharing(false);
    }
  };

  if (!typedBlob || !url) return null;
  const sizeKB = (typedBlob.size / 1024).toFixed(1);
  const showShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            {kind === 'image' ? <ImageIcon className="w-5 h-5 text-white"/> :
             kind === 'pdf' ? <FileText className="w-5 h-5 text-white"/> :
             kind === 'archive' ? <FileArchive className="w-5 h-5 text-white"/> :
             <FileText className="w-5 h-5 text-white"/>}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{filename}</p>
            <p className="text-zinc-400 text-xs">{sizeKB} KB · ready</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1" aria-label="Close result"><X className="w-4 h-4"/></button>
        )}
      </div>

      {/* Preview */}
      <div className="rounded-xl bg-zinc-950/70 border border-white/10 overflow-hidden mb-4">
        {kind === 'image' && (
          <img src={url} alt={filename} className="max-h-[480px] w-full object-contain bg-[repeating-conic-gradient(#0a0a0a_0%_25%,#111_0%_50%)_50%/16px_16px]" />
        )}
        {kind === 'pdf' && !isIOS() && (
          <iframe src={url} title="PDF preview" className="w-full h-[520px] bg-zinc-900" />
        )}
        {kind === 'pdf' && isIOS() && (
          <div className="p-8 text-center bg-zinc-900">
            <FileText className="w-12 h-12 text-fuchsia-300 mx-auto mb-3"/>
            <p className="text-white text-sm font-medium">PDF ready</p>
            <p className="text-zinc-400 text-xs mt-1">Tap <span className="text-white">Open</span> below to view in Safari, then use the Share menu to Save to Files.</p>
          </div>
        )}
        {kind === 'text' && (
          <pre className="text-zinc-200 text-xs whitespace-pre-wrap p-4 max-h-[440px] overflow-auto font-mono">{textPreview || 'Loading preview…'}</pre>
        )}
        {(kind === 'archive' || kind === 'office' || kind === 'binary') && (
          <div className="p-8 text-center">
            <FileArchive className="w-12 h-12 text-zinc-500 mx-auto mb-2"/>
            <p className="text-zinc-400 text-sm">Preview not available for this file type.</p>
            <p className="text-zinc-500 text-xs mt-1">Use Download, Open or Share below.</p>
          </div>
        )}
      </div>

      {/* Action buttons — using <a> tags for max iOS compatibility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Download — anchor with download attribute is most reliable */}
        <a
          href={url}
          download={filename}
          className={btnPrimary}
          onClick={() => toast({ title: 'Saving…' })}
        >
          <Download className="w-4 h-4"/> Download
        </a>

        {/* Open in new tab — anchor with target=_blank is more reliable than window.open on iOS */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={btnOutline}
        >
          <ExternalLink className="w-4 h-4"/> {isIOS() ? 'Open in Safari' : 'Open in new tab'}
        </a>

        {/* Share / Save — only when Web Share API is available */}
        {showShare && (
          <button onClick={handleShare} disabled={sharing} className={btnOutline}>
            {sharing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Share2 className="w-4 h-4"/>}
            {sharing ? 'Sharing…' : 'Share / Save'}
          </button>
        )}

        {/* Copy text — only for text outputs */}
        {kind === 'text' && (
          <button onClick={handleCopyText} className={btnOutline}>
            <Copy className="w-4 h-4"/> Copy text
          </button>
        )}
      </div>

      {/* iOS guidance — always show on iOS so users know exactly how to save */}
      {isIOS() && (
        <div className="mt-4 rounded-xl bg-blue-500/10 border border-blue-400/20 p-3.5 flex items-start gap-3">
          <Apple className="w-4 h-4 text-blue-300 mt-0.5 shrink-0"/>
          <div className="text-xs text-blue-100 leading-relaxed space-y-1">
            <p className="font-medium text-white">Saving on iPhone / iPad</p>
            <p className="text-blue-200/90">
              <span className="text-white font-medium">Easiest:</span> tap <span className="text-white font-medium">Share / Save</span> above, then choose <span className="text-white font-medium">"Save to Files"</span>.
            </p>
            <p className="text-blue-200/90">
              <span className="text-white font-medium">Alternative:</span> tap <span className="text-white font-medium">Open in Safari</span> → tap the <span className="text-white font-medium">Share</span> icon (square with up-arrow) → <span className="text-white font-medium">Save to Files</span> / <span className="text-white font-medium">Save Image</span>.
            </p>
            {kind === 'image' && (
              <p className="text-blue-200/90">
                <span className="text-white font-medium">Image tip:</span> long-press the preview above → <span className="text-white font-medium">Add to Photos</span> / <span className="text-white font-medium">Save to Files</span>.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
