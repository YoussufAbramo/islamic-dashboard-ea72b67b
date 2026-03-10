import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type CertDesign = 'classic' | 'modern' | 'elegant';

interface CertPdfOptions {
  title: string;
  recipientName: string;
  description?: string;
  courseName?: string;
  date: string;
  certNumber: string;
  appName: string;
  design: CertDesign;
  isAr: boolean;
}

const designStyles: Record<CertDesign, { border: string; bg: string; accent: string; accentLight: string }> = {
  classic: { border: '#c8a84e', bg: '#fffef7', accent: '#287a5e', accentLight: '#e8f5ef' },
  modern: { border: '#2563eb', bg: '#f8fafc', accent: '#2563eb', accentLight: '#eff6ff' },
  elegant: { border: '#7c3aed', bg: '#faf5ff', accent: '#7c3aed', accentLight: '#f3e8ff' },
};

export async function exportCertificatePdf(options: CertPdfOptions): Promise<void> {
  const { title, recipientName, description, courseName, date, certNumber, appName, design, isAr } = options;
  const ds = designStyles[design];

  // Create a hidden container for rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  document.body.appendChild(container);

  const dir = isAr ? 'rtl' : 'ltr';
  const fontFamily = isAr ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif";

  container.innerHTML = `
    <div id="cert-pdf-root" style="
      width: 800px; padding: 50px; box-sizing: border-box;
      font-family: ${fontFamily}; direction: ${dir};
      background: ${ds.bg};
    ">
      <div style="
        border: 4px double ${ds.border}; padding: 50px; text-align: center;
        background: ${ds.bg}; border-radius: 8px;
        box-shadow: inset 0 0 60px ${ds.accentLight};
      ">
        <div style="font-size: 14px; letter-spacing: 4px; color: ${ds.accent}; text-transform: uppercase; margin-bottom: 8px;">
          ${isAr ? '✦ شهادة ✦' : '✦ Certificate ✦'}
        </div>
        <h1 style="color: ${ds.accent}; font-size: 28px; margin: 0 0 4px; font-weight: 700;">${esc(appName)}</h1>
        <p style="color: #888; font-size: 15px; margin: 0 0 24px;">${isAr ? 'شهادة تقدير' : 'Certificate of Achievement'}</p>
        
        <div style="border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 28px 0; margin: 0 20px;">
          <p style="font-size: 20px; font-weight: 600; color: #333; margin: 0 0 12px;">${esc(title)}</p>
          <p style="font-size: 14px; color: #888; margin: 0 0 6px;">${isAr ? 'مقدمة إلى' : 'Presented to'}</p>
          <p style="font-size: 26px; font-weight: 700; color: ${ds.accent}; margin: 0 0 12px;">${esc(recipientName)}</p>
          ${description ? `<p style="font-size: 13px; color: #666; margin: 0 0 8px;">${esc(description)}</p>` : ''}
          ${courseName ? `<p style="font-size: 13px; color: #888; margin: 0;">${isAr ? 'الدورة:' : 'Course:'} ${esc(courseName)}</p>` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; color: #999; font-size: 11px; margin-top: 28px; padding: 0 10px;">
          <span>${isAr ? 'التاريخ:' : 'Date:'} ${date}</span>
          <span>${certNumber}</span>
        </div>
      </div>
    </div>
  `;

  // Load Google Fonts
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // Wait for fonts
  await new Promise(r => setTimeout(r, 500));

  const root = container.querySelector('#cert-pdf-root') as HTMLElement;

  const canvas = await html2canvas(root, {
    scale: 2,
    useCORS: true,
    backgroundColor: ds.bg,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pdfW - w) / 2;
  const y = (pdfH - h) / 2;

  pdf.addImage(imgData, 'PNG', x, y, w, h);
  pdf.save(`${certNumber}.pdf`);

  // Cleanup
  document.body.removeChild(container);
  document.head.removeChild(link);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
