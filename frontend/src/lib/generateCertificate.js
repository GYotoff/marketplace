/**
 * generateCertificate(data)
 * Opens a printable A4-landscape Certificate of Participation in a new browser tab.
 */
export function generateCertificate(data) {
  const {
    volunteerName  = '',
    eventTitle     = '',
    eventTitleBg   = '',
    eventDate      = '',
    eventDateBg    = '',
    eventLocation  = '',
    eventLocationBg = '',
    orgName        = '',
    orgNameBg      = '',
    orgLogoUrl     = '',
    contactPerson  = '',
    hoursLogged    = 0,
    lang           = 'en',
  } = data

  const issueDate = new Date().toLocaleDateString('bg-BG', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, '.')

  // ── Both-language labels ───────────────────────────────────────────────────
  const EN = {
    cert_title:   'CERTIFICATE OF PARTICIPATION',
    certifies:    'This is to certify that',
    participated: 'has successfully participated in the following volunteering event:',
    event_label:  'EVENT',
    date_label:   'DATE',
    location:     'LOCATION',
    hours_label:  'HOURS',
    hours_unit:   'h',
    issued_by:    'ISSUED BY',
    contact:      'CONTACT PERSON',
    issue_date:   'ISSUE DATE',
    signature:    'SIGNATURE & STAMP',
    online:       'Online',
    appreciation: 'Your dedication, time, and contribution were essential to the success of this event. We sincerely appreciate your commitment and support.',
  }
  const BG = {
    cert_title:   'СЕРТИФИКАТ ЗА УЧАСТИЕ',
    certifies:    'Настоящото удостоверява, че',
    participated: 'успешно участва в следното доброволческо събитие:',
    event_label:  'СЪБИТИЕ',
    date_label:   'ДАТА',
    location:     'МЯСТО',
    hours_label:  'ЧАСОВЕ',
    hours_unit:   'ч.',
    issued_by:    'ИЗДАДЕНО ОТ',
    contact:      'ОТГОВОРНО ЛИЦЕ',
    issue_date:   'ДАТА НА ИЗДАВАНЕ',
    signature:    'ПОДПИС И ПЕЧАТ',
    online:       'Онлайн',
    appreciation: 'Вашата отдаденост, време и принос бяха от съществено значение за успеха на това събитие. Искрено оценяваме ангажираността и подкрепата ви.',
  }

  // Show both languages on the certificate — primary first, secondary below
  const P = lang === 'bg' ? BG : EN   // primary (user's language)
  const S = lang === 'bg' ? EN : BG   // secondary

  const orgInitial = (orgName || '?')[0].toUpperCase()

  const logoHtml = orgLogoUrl
    ? `<img id="org-logo" src="${escHtml(orgLogoUrl)}" alt="" crossorigin="anonymous"
         style="height:68px;max-width:180px;object-fit:contain;display:block;" />`
    : `<div style="width:68px;height:68px;border-radius:10px;background:#E1F5EE;display:flex;
         align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#1D9E75;">
         ${orgInitial}</div>`

  const detailCols = hoursLogged > 0 ? '1fr 1fr 1fr 0.7fr' : '1fr 1fr 1fr'

  const hoursCell = hoursLogged > 0 ? `
    <div class="dc">
      <div class="dl">${P.hours_label} / ${S.hours_label}</div>
      <div class="dv">${hoursLogged} ${P.hours_unit}</div>
    </div>` : ''

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${P.cert_title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&display=swap');

    @page { size: A4 landscape; margin: 0; }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 297mm; height: 210mm;
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      background: #fff; color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 297mm; height: 210mm;
      padding: 14mm 20mm 13mm;
      display: flex; flex-direction: column;
      position: relative; overflow: hidden; background: #fff;
    }

    /* Outer border */
    .page::before {
      content: ''; position: absolute; inset: 7mm;
      border: 2px solid #1D9E75; border-radius: 5px; pointer-events: none;
    }
    /* Inner hairline */
    .page::after {
      content: ''; position: absolute; inset: 9.5mm;
      border: 0.75px solid #9FE1CB; border-radius: 3px; pointer-events: none;
    }

    /* Corner brackets */
    .corner { position: absolute; width: 16px; height: 16px; border-color: #1D9E75; border-style: solid; }
    .tl { top: 5.5mm; left: 5.5mm; border-width: 2px 0 0 2px; }
    .tr { top: 5.5mm; right: 5.5mm; border-width: 2px 2px 0 0; }
    .bl { bottom: 5.5mm; left: 5.5mm; border-width: 0 0 2px 2px; }
    .br { bottom: 5.5mm; right: 5.5mm; border-width: 0 2px 2px 0; }

    /* Left accent strip */
    .strip {
      position: absolute; left: 0; top: 0; width: 4.5mm; height: 100%;
      background: linear-gradient(180deg, #1D9E75 0%, #0F6E56 100%);
    }

    /* Watermark */
    .wm {
      position: absolute; right: 13mm; bottom: 13mm;
      font-size: 110px; font-weight: 900; color: #1D9E75;
      opacity: 0.03; pointer-events: none; user-select: none; line-height: 1;
    }

    /* ── Header ── */
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5mm; }
    .org-block { display: flex; align-items: center; gap: 11px; }
    .org-name  { font-size: 13px; font-weight: 600; color: #1D9E75; max-width: 160px; line-height: 1.3; }

    /* ── Title ── */
    .title-block { text-align: center; margin-bottom: 5mm; }
    .title-primary {
      font-size: 22px; font-weight: 700; letter-spacing: 0.22em;
      color: #0F6E56; text-transform: uppercase; margin-bottom: 2px;
    }
    .title-secondary {
      font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
      color: #9FE1CB; text-transform: uppercase; margin-bottom: 6px;
    }
    .divider {
      width: 80px; height: 2px;
      background: linear-gradient(90deg, transparent, #1D9E75, transparent);
      margin: 0 auto;
    }

    /* ── Body ── */
    .certifies-block { text-align: center; margin-bottom: 5mm; }
    .certifies-p  { font-size: 11px; color: #6b7280; margin-bottom: 3px; letter-spacing: 0.03em; }
    .certifies-s  { font-size: 9px; color: #9ca3af; margin-bottom: 5px; letter-spacing: 0.02em; font-style: italic; }
    .vol-name     { font-size: 28px; font-weight: 700; font-style: italic; color: #111827; letter-spacing: 0.03em; margin-bottom: 4px; }
    .participated-p { font-size: 11px; color: #6b7280; letter-spacing: 0.02em; }
    .participated-s { font-size: 9px; color: #9ca3af; font-style: italic; }

    /* ── Details grid ── */
    .details {
      display: grid; grid-template-columns: ${detailCols};
      background: #f0fdf4; border: 0.75px solid #9FE1CB;
      border-radius: 7px; overflow: hidden; margin-bottom: 4mm; flex-shrink: 0;
    }
    .dc { padding: 4mm 5mm; border-right: 0.75px solid #9FE1CB; }
    .dc:last-child { border-right: none; }
    .dl  { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #1D9E75; margin-bottom: 3px; }
    .dv  { font-size: 12px; font-weight: 600; color: #111827; line-height: 1.35; }

    /* ── Appreciation quote ── */
    .appreciation {
      text-align: center; margin-bottom: 5mm; padding: 0 8mm;
    }
    .appr-p { font-size: 9.5px; font-style: italic; color: #4b5563; line-height: 1.6; margin-bottom: 2px; }
    .appr-s { font-size: 8px; font-style: italic; color: #9ca3af; line-height: 1.5; }

    /* ── Footer ── */
    .footer {
      margin-top: auto; display: grid; grid-template-columns: 1fr 1fr 1fr;
      padding-top: 4mm; border-top: 0.75px solid #e5e7eb; align-items: end;
    }
    .fc { }
    .fc.mid  { text-align: center; }
    .fc.right{ text-align: right; }
    .fl  { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; margin-bottom: 2px; }
    .fv  { font-size: 10px; font-weight: 600; color: #374151; line-height: 1.4; }
    .fvs { font-size: 8px; color: #9ca3af; font-style: italic; line-height: 1.3; }
    .sig-line { width: 52mm; height: 0.75px; background: #d1d5db; display: inline-block; margin-bottom: 4px; }

    @media print {
      html, body { width: 297mm; height: 210mm; }
      .page { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="strip"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="wm">&#10003;</div>

  <!-- Header: org logo + name (no platform badge) -->
  <div class="header">
    <div class="org-block">
      ${logoHtml}
      <div class="org-name">${escHtml(orgName)}${orgNameBg && orgNameBg !== orgName ? '<br><span style="font-size:0.85em;color:#555">' + escHtml(orgNameBg) + '</span>' : ''}</div>
    </div>
  </div>

  <!-- Title — both languages -->
  <div class="title-block">
    <div class="title-primary">${P.cert_title}</div>
    <div class="title-secondary">${S.cert_title}</div>
    <div class="divider"></div>
  </div>

  <!-- Certifies + name + participated — both languages -->
  <div class="certifies-block">
    <p class="certifies-p">${P.certifies}</p>
    <p class="certifies-s">${S.certifies}</p>
    <p class="vol-name">${escHtml(volunteerName)}</p>
    <p class="participated-p">${P.participated}</p>
    <p class="participated-s">${S.participated}</p>
  </div>

  <!-- Event details grid — bilingual labels -->
  <div class="details">
    <div class="dc">
      <div class="dl">${P.event_label} / ${S.event_label}</div>
      <div class="dv">${escHtml(eventTitle)}${eventTitleBg && eventTitleBg !== eventTitle ? '<br><span style="color:#555;font-size:0.85em">' + escHtml(eventTitleBg) + '</span>' : ''}</div>
    </div>
    <div class="dc">
      <div class="dl">${P.date_label} / ${S.date_label}</div>
      <div class="dv">${escHtml(eventDate)}${eventDateBg && eventDateBg !== eventDate ? '<br><span style="color:#555;font-size:0.85em">' + escHtml(eventDateBg) + '</span>' : ''}</div>
    </div>
    <div class="dc">
      <div class="dl">${P.location} / ${S.location}</div>
      <div class="dv">${escHtml(eventLocation || P.online)}${(eventLocationBg && eventLocationBg !== eventLocation) ? '<br><span style="color:#555;font-size:0.85em">' + escHtml(eventLocationBg) + '</span>' : ''}</div>
    </div>
    ${hoursCell}
  </div>

  <!-- Appreciation text — both languages -->
  <div class="appreciation">
    <p class="appr-p">${P.appreciation}</p>
    <p class="appr-s">${S.appreciation}</p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="fc">
      <div class="fl">${P.issued_by}</div>
      <div class="fv">${escHtml(orgName)}</div>
      ${contactPerson ? `<div class="fl" style="margin-top:4px;">${P.contact}</div><div class="fv">${escHtml(contactPerson)}</div><div class="fvs">${escHtml(contactPerson)}</div>` : ''}
    </div>
    <div class="fc mid">
      <div style="display:block;"><div class="sig-line"></div></div>
      <div class="fl">${P.signature}</div>
    </div>
    <div class="fc right">
      <div class="fl">${P.issue_date}</div>
      <div class="fv">${issueDate}</div>
    </div>
  </div>

</div>
<script>
  function triggerPrint() { window.focus(); window.print(); }
  var imgs = document.querySelectorAll('img');
  if (!imgs.length) { window.onload = triggerPrint; }
  else {
    var done = 0;
    imgs.forEach(function(img) {
      function cb() { if (++done >= imgs.length) triggerPrint(); }
      if (img.complete) cb(); else { img.onload = cb; img.onerror = cb; }
    });
    setTimeout(triggerPrint, 2500);
  }
</script>
</body>
</html>`

  // Open blank tab (no size args = no popup block), then write HTML
  const win = window.open('', '_blank')
  if (!win) {
    // Fallback: Blob URL
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    return
  }
  win.document.write(html)
  win.document.close()
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
