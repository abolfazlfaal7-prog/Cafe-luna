const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.85;

export async function prepareImageForUpload(file: File): Promise<{ base64: string; contentType: string }> {
  if (!file.type.startsWith('image/')) throw new Error('فقط فایل تصویر انتخاب کنید.');

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('این تصویر خوانده نشد.'));
      img.src = url;
    });

    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const context = canvas.getContext('2d');
    if (!context) throw new Error('پردازش تصویر ممکن نیست.');
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), contentType: 'image/jpeg' };
  } finally {
    URL.revokeObjectURL(url);
  }
}
