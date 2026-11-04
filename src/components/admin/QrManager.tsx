import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Printer, Share2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LUNA_LOGO_SRC } from '@/lib/brand';
import { buildLunaQrSvg, downloadBlob, loadImageAsDataUrl, svgToPngBlob } from '@/lib/qrCode';

const PNG_SIZE = 1400;
const SHARE_TITLE = 'منوی آنلاین LUNA CAFÉ';

export default function QrManager() {
  const menuUrl = `${window.location.origin}/`;
  const [withLogo, setWithLogo] = useState(true);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadImageAsDataUrl(LUNA_LOGO_SRC)
      .then((url) => {
        if (!cancelled) setLogoDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setLogoDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const svg = useMemo(
    () => buildLunaQrSvg(menuUrl, withLogo ? logoDataUrl : null),
    [menuUrl, withLogo, logoDataUrl],
  );
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const flash = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 2200);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      flash('لینک کپی شد');
    } catch {
      flash('کپی انجام نشد. لینک را دستی کپی کنید.');
    }
  };

  const shareLink = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title: SHARE_TITLE, url: menuUrl });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      flash('اشتراک‌گذاری انجام نشد.');
    }
  };

  const downloadPng = async () => {
    setBusy(true);
    try {
      downloadBlob(await svgToPngBlob(svg, PNG_SIZE), 'luna-cafe-menu-qr.png');
    } catch {
      flash('دانلود PNG انجام نشد.');
    } finally {
      setBusy(false);
    }
  };

  const downloadSvg = () => {
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'luna-cafe-menu-qr.svg');
  };

  const printQr = () => {
    const win = window.open('', '_blank');
    if (!win) {
      flash('پنجره چاپ باز نشد. اجازه باز شدن پنجره را بدهید.');
      return;
    }
    win.document.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>QR منوی LUNA CAFÉ</title><style>@page{margin:16mm}body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;color:#0F2A21}img{width:110mm;height:110mm}p{margin:10px 0 0;font-size:14px;direction:ltr}</style></head><body></body></html>`);
    win.document.close();

    const img = win.document.createElement('img');
    img.alt = 'QR code منوی آنلاین';
    img.onload = () => {
      win.focus();
      win.print();
    };
    img.src = svgDataUrl;
    win.document.body.appendChild(img);

    const caption = win.document.createElement('p');
    caption.textContent = menuUrl;
    win.document.body.appendChild(caption);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col items-center rounded-3xl bg-cream-50 p-8 shadow-sm ring-1 ring-forest-900/5">
        <div className="relative w-full max-w-[320px] overflow-hidden rounded-2xl bg-cream-50 p-3 ring-1 ring-forest-900/10">
          <img src={svgDataUrl} alt="QR code منوی آنلاین LUNA CAFÉ" className="h-auto w-full" />
        </div>
        <p dir="ltr" className="mt-6 break-all text-center text-sm text-stone-600">
          {menuUrl}
        </p>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-forest-900">کد QR منوی آنلاین</h2>
          <p className="mt-1 text-sm leading-[1.7] text-stone-600">
            مشتریان با اسکن این کد، مستقیماً وارد منوی کافه می‌شوند. آن را چاپ کنید یا روی میز و ویترین قرار دهید.
          </p>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-2xl bg-cream-50 px-5 py-4 ring-1 ring-forest-900/10">
          <span>
            <span className="block font-bold text-forest-900">لوگوی LUNA در مرکز کد</span>
            <span className="text-xs text-stone-600">برای چاپ و نمایش، لوگو را در مرکز کد قرار دهید.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={withLogo}
            onClick={() => setWithLogo((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition duration-300 ${withLogo ? 'bg-forest-700' : 'bg-stone-300'}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-cream-50 shadow transition-all duration-300 ${
                withLogo ? 'start-[22px]' : 'start-0.5'
              }`}
            />
          </button>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <ActionButton onClick={() => void copyLink()} Icon={Copy} label="کپی لینک" />
          <ActionButton onClick={() => void shareLink()} Icon={Share2} label="اشتراک‌گذاری" />
          <ActionButton onClick={() => void downloadPng()} Icon={Download} label="دانلود PNG" disabled={busy} />
          <ActionButton onClick={downloadSvg} Icon={Download} label="دانلود SVG" />
          <ActionButton onClick={printQr} Icon={Printer} label="چاپ کد QR" className="col-span-2" />
        </div>

        {feedback && (
          <p role="status" className="flex animate-fade-in items-center gap-2 text-sm font-medium text-forest-800">
            <Check className="h-4 w-4" aria-hidden="true" />
            {feedback}
          </p>
        )}
      </section>
    </div>
  );
}

type ActionButtonProps = {
  onClick: () => void;
  Icon: LucideIcon;
  label: string;
  disabled?: boolean;
  className?: string;
};

function ActionButton({ onClick, Icon, label, disabled, className = '' }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-xl bg-cream-50 px-4 py-3.5 text-sm font-bold text-forest-900 shadow-sm ring-1 ring-forest-900/10 transition duration-300 hover:-translate-y-0.5 hover:bg-forest-900 hover:text-cream-50 hover:shadow-lg disabled:opacity-50 ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
