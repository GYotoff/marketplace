/**
 * generateCertificate(data)
 * Opens a printable/saveable A4-landscape certificate in a new browser window.
 *
 * data: {
 *   volunteerName, eventTitle, eventDate, eventLocation,
 *   orgName, orgLogoUrl, contactPerson,
 *   hoursLogged,   // optional – number
 *   lang           // 'en' | 'bg'
 * }
 */
export function generateCertificate(data) {
  const {
    volunteerName  = '',
    eventTitle     = '',
    eventDate      = '',
    eventLocation  = '',
    orgName        = '',
    orgLogoUrl     = '',
    contactPerson  = '',
    hoursLogged    = 0,
    lang           = 'en',
  } = data

  const issueDate = new Date().toLocaleDateString('bg-BG', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, '.')

  const L = {
    cert_title:    lang === 'bg' ? 'СЕРТИФИКАТ ЗА ДОБРОВОЛЧЕСТВО'           : 'VOLUNTEER CERTIFICATE',
    certifies:     lang === 'bg' ? 'Настоящото удостоверява, че'             : 'This is to certify that',
    participated:  lang === 'bg' ? 'успешно участва в следното доброволческо събитие:' : 'has successfully participated in the following volunteering event:',
    event_label:   lang === 'bg' ? 'СЪБИТИЕ'                                 : 'EVENT',
    date_label:    lang === 'bg' ? 'ДАТА'                                    : 'DATE',
    location:      lang === 'bg' ? 'МЯСТО'                                   : 'LOCATION',
    hours_label:   lang === 'bg' ? 'ЧАСОВЕ'                                  : 'HOURS',
    issued_by:     lang === 'bg' ? 'ИЗДАДЕНО ОТ'                             : 'ISSUED BY',
    contact:       lang === 'bg' ? 'ОТГОВОРНО ЛИЦЕ'                          : 'CONTACT PERSON',
    issue_date:    lang === 'bg' ? 'ДАТА НА ИЗДАВАНЕ'                        : 'ISSUE DATE',
    online:        lang === 'bg' ? 'Онлайн'                                  : 'Online',
    signature:     lang === 'bg' ? 'ПОДПИС И ПЕЧАТ'                          : 'SIGNATURE & STAMP',
    platform:      'GiveForward',
    hours_unit:    lang === 'bg' ? 'ч.'                                      : 'h',
  }

  const orgInitial = (orgName || '?')[0].toUpperCase()

  // Logo: image or initial monogram — use data URL to avoid CORS/timing issues
  const logoHtml = orgLogoUrl
    ? `<img id="org-logo" src="${escHtml(orgLogoUrl)}" alt="" style="height:64px;max-width:180px;object-fit:contain;display:block;" crossorigin="anonymous" />`
    : `<div style="width:64px;height:64px;border-radius:10px;background:#E1F5EE;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#1D9E75;font-family:Inter,sans-serif;">${orgInitial}</div>`

  // Hours detail cell — only if > 0
  const hoursCell = hoursLogged > 0
    ? `<div class="detail-cell">
        <div class="detail-label">${L.hours_label}</div>
        <div class="detail-value">${hoursLogged} ${L.hours_unit}</div>
      </div>`
    : ''

  const detailsCols = hoursLogged > 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr'

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${L.cert_title} — ${escHtml(volunteerName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

    @page {
      size: A4 landscape;
      margin: 0;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 297mm;
      height: 210mm;
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      background: #ffffff;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 297mm;
      height: 210mm;
      padding: 16mm 20mm 14mm;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      background: #ffffff;
    }

    /* Outer decorative border */
    .page::before {
      content: '';
      position: absolute;
      inset: 7mm;
      border: 2px solid #1D9E75;
      border-radius: 5px;
      pointer-events: none;
    }
    /* Inner hairline border */
    .page::after {
      content: '';
      position: absolute;
      inset: 9.5mm;
      border: 0.75px solid #9FE1CB;
      border-radius: 3px;
      pointer-events: none;
    }

    /* Corner brackets */
    .corner { position: absolute; width: 16px; height: 16px; border-color: #1D9E75; border-style: solid; }
    .tl { top: 5.5mm; left: 5.5mm; border-width: 2px 0 0 2px; }
    .tr { top: 5.5mm; right: 5.5mm; border-width: 2px 2px 0 0; }
    .bl { bottom: 5.5mm; left: 5.5mm; border-width: 0 0 2px 2px; }
    .br { bottom: 5.5mm; right: 5.5mm; border-width: 0 2px 2px 0; }

    /* Watermark */
    .watermark {
      position: absolute;
      right: 14mm;
      bottom: 14mm;
      font-size: 100px;
      font-weight: 900;
      color: #1D9E75;
      opacity: 0.035;
      pointer-events: none;
      user-select: none;
      line-height: 1;
    }

    /* Green accent strip — left edge */
    .accent-strip {
      position: absolute;
      left: 0;
      top: 0;
      width: 4mm;
      height: 100%;
      background: linear-gradient(180deg, #1D9E75 0%, #0F6E56 100%);
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6mm;
    }
    .org-block { display: flex; align-items: center; gap: 10px; }
    .org-name  { font-size: 12px; font-weight: 600; color: #1D9E75; max-width: 150px; line-height: 1.3; }
    .platform-badge {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #ffffff;
      background: linear-gradient(135deg, #1D9E75 0%, #085041 100%);
      padding: 5px 16px;
      border-radius: 20px;
    }

    /* ── Title ── */
    .title-block { text-align: center; margin-bottom: 4mm; }
    .cert-title  {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.22em;
      color: #0F6E56;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .title-divider {
      width: 72px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #1D9E75, transparent);
      margin: 0 auto;
    }

    /* ── Body copy ── */
    .certifies-text   { text-align: center; font-size: 10px; color: #6b7280; margin-bottom: 3px; letter-spacing: 0.04em; }
    .volunteer-name   {
      text-align: center;
      font-size: 26px;
      font-weight: 700;
      color: #111827;
      letter-spacing: 0.03em;
      margin-bottom: 3px;
      font-style: italic;
    }
    .participated-text { text-align: center; font-size: 10px; color: #6b7280; margin-bottom: 5mm; letter-spacing: 0.02em; }

    /* ── Details grid ── */
    .details {
      display: grid;
      grid-template-columns: ${detailsCols};
      background: #f0fdf4;
      border: 0.75px solid #9FE1CB;
      border-radius: 7px;
      overflow: hidden;
      margin-bottom: 6mm;
      flex-shrink: 0;
    }
    .detail-cell {
      padding: 4mm 5mm;
      border-right: 0.75px solid #9FE1CB;
    }
    .detail-cell:last-child { border-right: none; }
    .detail-label {
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #1D9E75;
      margin-bottom: 3px;
    }
    .detail-value {
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      line-height: 1.35;
    }

    /* ── Footer ── */
    .footer {
      margin-top: auto;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding-top: 4mm;
      border-top: 0.75px solid #e5e7eb;
      align-items: end;
    }
    .footer-cell { }
    .footer-cell.mid { text-align: center; }
    .footer-cell.right { text-align: right; }
    .footer-label {
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #9ca3af;
      margin-bottom: 2px;
    }
    .footer-value {
      font-size: 10px;
      font-weight: 600;
      color: #374151;
      line-height: 1.4;
    }
    .sig-line {
      width: 52mm;
      height: 0.75px;
      background: #d1d5db;
      display: inline-block;
      margin-bottom: 3px;
    }

    @media print {
      html, body { width: 297mm; height: 210mm; }
      .page { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="accent-strip"></div>
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>
  <div class="watermark">&#10003;</div>

  <!-- Header: org logo + name | platform badge -->
  <div class="header">
    <div class="org-block">
      ${logoHtml}
      <div class="org-name">${escHtml(orgName)}</div>
    </div>
    <div class="platform-badge">${escHtml(L.platform)}</div>
  </div>

  <!-- Title -->
  <div class="title-block">
    <div class="cert-title">${L.cert_title}</div>
    <div class="title-divider"></div>
  </div>

  <!-- Body -->
  <p class="certifies-text">${L.certifies}</p>
  <p class="volunteer-name">${escHtml(volunteerName)}</p>
  <p class="participated-text">${L.participated}</p>

  <!-- Event details -->
  <div class="details">
    <div class="detail-cell">
      <div class="detail-label">${L.event_label}</div>
      <div class="detail-value">${escHtml(eventTitle)}</div>
    </div>
    <div class="detail-cell">
      <div class="detail-label">${L.date_label}</div>
      <div class="detail-value">${escHtml(eventDate)}</div>
    </div>
    <div class="detail-cell">
      <div class="detail-label">${L.location}</div>
      <div class="detail-value">${escHtml(eventLocation || L.online)}</div>
    </div>
    ${hoursCell}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-cell">
      <div class="footer-label">${L.issued_by}</div>
      <div class="footer-value">${escHtml(orgName)}</div>
      ${contactPerson ? `<div class="footer-label" style="margin-top:4px;">${L.contact}</div><div class="footer-value">${escHtml(contactPerson)}</div>` : ''}
    </div>
    <div class="footer-cell mid">
      <div style="display:block;"><div class="sig-line"></div></div>
      <div class="footer-label">${L.signature}</div>
    </div>
    <div class="footer-cell right">
      <div class="footer-label">${L.issue_date}</div>
      <div class="footer-value">${issueDate}</div>
    </div>
  </div>

</div>
<script>
  // Wait for all images to load before printing so the logo appears in the PDF
  function triggerPrint() {
    window.focus();
    window.print();
  }
  var images = document.querySelectorAll('img');
  if (images.length === 0) {
    window.onload = triggerPrint;
  } else {
    var loaded = 0;
    var total = images.length;
    function onLoad() {
      loaded++;
      if (loaded >= total) triggerPrint();
    }
    images.forEach(function(img) {
      if (img.complete) { onLoad(); }
      else { img.onload = onLoad; img.onerror = onLoad; }
    });
    // Fallback: print after 2.5s even if images fail
    setTimeout(triggerPrint, 2500);
  }
</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1240,height=900')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
