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

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function exportCertificatePdf(options: CertPdfOptions): Promise<void> {
  const { title, recipientName, description, courseName, date, certNumber, appName, design, isAr } = options;
  const ds = designStyles[design];
  const dir = isAr ? 'rtl' : 'ltr';

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  printWindow.document.write(`
    <html dir="${dir}"><head>
    <title>${esc(certNumber)} - PDF</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size: landscape; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: 'Inter', 'Cairo', sans-serif; 
        background: ${ds.bg}; 
        display: flex; align-items: center; justify-content: center;
        width: 100vw; height: 100vh; padding: 30px;
      }
      .cert { 
        border: 4px double ${ds.border}; padding: 50px; text-align: center;
        background: ${ds.bg}; border-radius: 8px; width: 100%; max-width: 750px;
        box-shadow: inset 0 0 60px ${ds.accentLight};
      }
      .label { font-size: 13px; letter-spacing: 4px; color: ${ds.accent}; text-transform: uppercase; margin-bottom: 8px; }
      h1 { color: ${ds.accent}; font-size: 28px; font-weight: 700; margin-bottom: 4px; }
      .sub { color: #888; font-size: 15px; margin-bottom: 24px; }
      .divider { border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 28px 20px; }
      .title { font-size: 20px; font-weight: 600; color: #333; margin-bottom: 12px; }
      .presented { font-size: 14px; color: #888; margin-bottom: 6px; }
      .name { font-size: 26px; font-weight: 700; color: ${ds.accent}; margin-bottom: 12px; }
      .desc { font-size: 13px; color: #666; margin-bottom: 8px; }
      .course { font-size: 13px; color: #888; }
      .footer { display: flex; justify-content: space-between; color: #999; font-size: 11px; margin-top: 28px; padding: 0 10px; }
    </style>
    </head><body>
    <div class="cert">
      <div class="label">${isAr ? '✦ شهادة ✦' : '✦ Certificate ✦'}</div>
      <h1>${esc(appName)}</h1>
      <p class="sub">${isAr ? 'شهادة تقدير' : 'Certificate of Achievement'}</p>
      <div class="divider">
        <p class="title">${esc(title)}</p>
        <p class="presented">${isAr ? 'مقدمة إلى' : 'Presented to'}</p>
        <p class="name">${esc(recipientName)}</p>
        ${description ? `<p class="desc">${esc(description)}</p>` : ''}
        ${courseName ? `<p class="course">${isAr ? 'الدورة:' : 'Course:'} ${esc(courseName)}</p>` : ''}
      </div>
      <div class="footer">
        <span>${isAr ? 'التاريخ:' : 'Date:'} ${date}</span>
        <span>${certNumber}</span>
      </div>
    </div>
    <script>
      // Use browser's "Save as PDF" via print dialog
      window.onload = function() {
        setTimeout(function() { window.print(); }, 400);
      };
    </script>
    </body></html>
  `);
  printWindow.document.close();
}
