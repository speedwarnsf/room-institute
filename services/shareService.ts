export async function captureCardAsImage(element: HTMLElement): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false,
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create image'));
    }, 'image/png', 1.0);
  });
}

/**
 * Render the ShareableCard offscreen at full 1080px width, capture it,
 * and return a high-res PNG blob. This avoids capturing the tiny on-screen card.
 */
export async function captureShareableCard(
  renderCard: (container: HTMLDivElement) => void,
  cleanup: () => void,
): Promise<Blob> {
  // Create offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1080px';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  try {
    renderCard(container);

    // Wait for images to load
    const images = container.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        img =>
          new Promise<void>(resolve => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );

    // Small delay for layout
    await new Promise(r => setTimeout(r, 100));

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true,
      logging: false,
      width: 1080,
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image'));
      }, 'image/png', 1.0);
    });
  } finally {
    cleanup();
    document.body.removeChild(container);
  }
}

export async function shareCard(blob: Blob, designName: string): Promise<void> {
  const file = new File([blob], `${designName.toLowerCase().replace(/\s+/g, '-')}-room-institute.png`, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `${designName} — Room Design`,
      text: `Check out this design concept from Room`,
      files: [file],
    });
    return;
  }

  downloadBlob(blob, designName);
}

export async function downloadCard(blob: Blob, designName: string): Promise<void> {
  const filename = `${designName.toLowerCase().replace(/\s+/g, '-')}-room-institute.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  // On mobile, use Web Share API so users get the native share sheet
  // with "Save Image" option — the <a download> trick doesn't work on mobile Safari
  if (isMobile() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err: any) {
      // User cancelled share — that's fine, fall through to download
      if (err?.name === 'AbortError') return;
    }
  }

  // Desktop fallback: standard download
  downloadBlob(blob, filename);
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
