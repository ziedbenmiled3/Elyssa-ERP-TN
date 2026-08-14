/**
 * Generateur dynamique de pieces justificative GED simulées pour Elyssa S.A.
 * Remplace les placeholders "Simulation" en texte brut par de veritables fichiers valides (PDF / PNG).
 */

export function generateMockPdfBase64(doc: {
  name: string;
  type: string;
  linkedToName?: string;
  uploadDate?: string;
  uploadedBy?: string;
}): string {
  const title = doc.name.replace(/_/g, ' ');
  const subtitle = "SOCIETE COMMERCIALE TUNISIENNE ELYSSA S.A.";
  const currentDate = doc.uploadDate || '2026-06-01';
  const author = doc.uploadedBy || 'contact@elyssa.pro';

  const metadata = [
    `Date d'archivage : ${currentDate}`,
    `Type de piece : ${doc.type === 'Invoice' ? 'Facture commerciale / Piece de comptabilite' : doc.type === 'Contract' ? 'Contrat de travail / Engagement commercial' : doc.type === 'Report' ? 'Rapport logistique / Compte-rendu' : 'Autre document justificatif'}`,
    `Liaison Dossier : ${doc.linkedToName || 'Piece libre d\'association'}`,
    `Agent Responsable : ${author}`,
    `Statut GED : Piece de demonstration certifiee conforme par Elyssa S.A.`,
    `Numero de version archiviste : v1.0`
  ];

  // PDF drawing stream (72 points/inch, standard page height 842 points)
  let streamLines = [
    'BT',
    '/F2 16 Tf',
    '40 800 Td',
    '(SOCIETE TUNISIENNE ELYSSA S.A. - DOSSIER NUMERIQUE GED) Tj',
    '/F1 11 Tf',
    '0 -25 Td',
    `(${subtitle}) Tj`,
    '0 -35 Td',
    '(------------------------------------------------------------------------------------------------------------------------------------------) Tj',
    '0 -30 Td',
    '/F2 13 Tf',
    `(${title}) Tj`,
    '/F1 10 Tf',
    '0 -30 Td',
  ];

  metadata.forEach(line => {
    streamLines.push(`(${line}) Tj`, '0 -22 Td');
  });

  streamLines.push(
    '0 -20 Td',
    '(------------------------------------------------------------------------------------------------------------------------------------------) Tj',
    '0 -30 Td',
    '/F2 11 Tf',
    '(NOTICE TECHNIQUE ET CONFIRMATION D\'INTEGRITE) Tj',
    '/F1 9.5 Tf',
    '0 -20 Td',
    '(Le present document a ete simule avec succes et injecte par le moteur GED.) Tj',
    '0 -15 Td',
    '(Toutes les signatures numeriques associees s\'affichent conformes.) Tj',
    '0 -15 Td',
    '(Pour remplacer ou mettre a jour ce fichier, vous pouvez le supprimer de l\'onglet active) Tj',
    '0 -15 Td',
    '(et recharger votre propre justificatif reel au format PDF, PNG, Excel ou texte.) Tj',
    '0 -40 Td',
    '/F2 9 Tf',
    '(Elyssa S.A. GED Core Services - contact@elyssa.pro - Port 3000 Container) Tj',
    'ET'
  );

  const streamContent = streamLines.join('\n');
  
  // Assemble the simple PDF objects representation
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n';
  
  const obj4Header = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n`;
  const obj4Footer = '\nendstream\nendobj\n';
  const obj4 = obj4Header + streamContent + obj4Footer;

  const header = '%PDF-1.4\n';
  
  // Calculate offsets for strict compatibility
  const offset1 = header.length;
  const offset2 = offset1 + obj1.length;
  const offset3 = offset2 + obj2.length;
  const offset4 = offset3 + obj3.length;
  const offsetStartXref = offset4 + obj4.length;

  const xref = `xref\n0 5\n0000000000 65535 f \n${String(offset1).padStart(10, '0')} 00000 n \n${String(offset2).padStart(10, '0')} 00000 n \n${String(offset3).padStart(10, '0')} 00000 n \n${String(offset4).padStart(10, '0')} 00000 n \n`;
  const trailer = `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${offsetStartXref}\n%%EOF`;

  const pdfString = header + obj1 + obj2 + obj3 + obj4 + xref + trailer;

  // Protect against non-latin1 characters
  const safeString = unescape(encodeURIComponent(pdfString));
  const encoded = btoa(safeString);
  return `data:application/pdf;base64,${encoded}`;
}

export function generateMockImageBase64(doc: {
  name: string;
  linkedToName?: string;
}): string {
  if (typeof document === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }

  const canvas = document.createElement('canvas');
  canvas.width = 650;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }

  // Draw modern dark card background
  const grad = ctx.createLinearGradient(0, 0, 650, 420);
  grad.addColorStop(0, '#0f172a'); // slate 900
  grad.addColorStop(1, '#1e293b'); // slate 800
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 650, 420);

  // Card outline
  ctx.strokeStyle = '#6366f1'; // Indigo border
  ctx.lineWidth = 4;
  ctx.strokeRect(15, 15, 620, 390);

  // Top header panel
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(17, 17, 616, 65);

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('REPUBLIQUE TUNISIENNE - DOSSIER NUMERIQUE', 35, 45);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px monospace';
  ctx.fillText('ELYSSA S.A. GED PROTOCOL', 440, 45);

  // Subtitle bar
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10px sans-serif';
  ctx.fillText('IDENTITE NUMERIQUE DU COLLABORATEUR DANS LE SYSTEME D\'ARCHIVAGE', 35, 68);

  // Left card divider
  ctx.fillStyle = '#334155';
  ctx.fillRect(40, 105, 145, 185);
  ctx.strokeStyle = '#475569';
  ctx.strokeRect(40, 105, 145, 185);

  // Draw avatar silhouette inside card photo frame
  ctx.fillStyle = '#64748b';
  // Head
  ctx.beginPath();
  ctx.arc(112, 165, 28, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders
  ctx.beginPath();
  ctx.arc(112, 245, 45, Math.PI, 0);
  ctx.fill();

  // Draw security seal
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; // translucent amber
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(112, 195, 65, 0, Math.PI * 2);
  ctx.stroke();

  // Details fields on the right
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(doc.linkedToName || 'COLLABORATEUR S.A.', 205, 135);

  ctx.fillStyle = '#818cf8'; // text accent
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`FICHIER : ${doc.name.replace(/_/g, ' ')}`, 205, 170);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Type archive : Justificatif GED / Image numerise`, 205, 200);
  ctx.fillText(`Structure : Societe Tunisienne Elyssa S.A.`, 205, 225);
  ctx.fillText(`Certification : Integrité numérique approuvée`, 205, 250);

  // Microchip symbol simulation
  ctx.fillStyle = '#f59e0b'; // Gold chip
  ctx.fillRect(530, 110, 50, 42);
  ctx.strokeStyle = '#d97706';
  ctx.strokeRect(530, 110, 50, 42);
  // draw chip lines
  ctx.fillStyle = '#000000';
  ctx.fillRect(545, 110, 2, 42);
  ctx.fillRect(560, 110, 2, 42);
  ctx.fillRect(530, 124, 50, 2);
  ctx.fillRect(530, 138, 50, 2);

  // Bottom section: barcode
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(205, 305, 385, 45);

  // draw barcode stripe
  ctx.fillStyle = '#000000';
  for (let x = 215; x < 580; x += 3.5) {
    if (Math.random() > 0.25) {
      const width = Math.random() > 0.6 ? 2.5 : 1;
      ctx.fillRect(x, 305, width, 45);
    }
  }

  // Footer label
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px monospace';
  ctx.fillText(`GED-SECURITY-CODE: 1A94X59B8 • REF_${Date.now().toString().slice(-4)}`, 205, 375);

  return canvas.toDataURL('image/png');
}

/**
 * Returns a valid base64 data URL according to document type
 */
export function getValidMockBase64(doc: {
  name: string;
  type: string;
  fileType?: string;
  linkedToName?: string;
  uploadDate?: string;
  uploadedBy?: string;
}): string {
  const fType = doc.fileType || '';
  if (fType.includes('png') || fType.includes('jpg') || fType.includes('jpeg') || fType.includes('image')) {
    return generateMockImageBase64(doc);
  }
  // Default to standard PDF
  return generateMockPdfBase64(doc);
}
