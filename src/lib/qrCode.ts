import QRCode from 'qrcode';

const QUIET_ZONE = 4;
const LOGO_RATIO = 0.24;
const FOREGROUND = '#0F2A21';
const BACKGROUND = '#FCFAF5';

export async function loadImageAsDataUrl(src: string): Promise<string> {
  const response = await fetch(src);
  if (!response.ok) throw new Error('بارگذاری تصویر انجام نشد.');
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function buildLunaQrSvg(text: string, logoDataUrl: string | null): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const modules = qr.modules.size;
  const total = modules + QUIET_ZONE * 2;

  const withLogo = logoDataUrl !== null;
  const logoSize = withLogo ? Math.round(modules * LOGO_RATIO) : 0;
  const logoStart = Math.floor((modules - logoSize) / 2);
  const insideLogo = (row: number, col: number) =>
    withLogo &&
    row >= logoStart &&
    row < logoStart + logoSize &&
    col >= logoStart &&
    col < logoStart + logoSize;

  let path = '';
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (qr.modules.get(row, col) && !insideLogo(row, col)) {
        path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
  }

  const x = logoStart + QUIET_ZONE;
  const radius = logoSize / 2;
  const badge = logoDataUrl
    ? `<circle cx="${x + radius}" cy="${x + radius}" r="${radius + 0.5}" fill="${BACKGROUND}"/>` +
      `<clipPath id="luna-logo-clip"><circle cx="${x + radius}" cy="${x + radius}" r="${radius}"/></clipPath>` +
      `<image href="${logoDataUrl}" x="${x}" y="${x}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#luna-logo-clip)"/>`
    : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${total * 20}" height="${total * 20}" viewBox="0 0 ${total} ${total}">` +
    `<rect width="${total}" height="${total}" fill="${BACKGROUND}"/>` +
    `<path d="${path}" fill="${FOREGROUND}"/>` +
    badge +
    `</svg>`
  );
}

export async function svgToPngBlob(svg: string, size: number): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('تبدیل فایل انجام نشد.'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('تبدیل فایل انجام نشد.');
  context.drawImage(image, 0, 0, size, size);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('تبدیل فایل انجام نشد.'))), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
