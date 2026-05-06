// /api/pedidos.js — Lê pedidos do Google Sheets via CSV export (mais confiável que gviz)
// A planilha precisa estar compartilhada como "Qualquer pessoa com o link"

const SHEET_ID = '11wQp3QNDbRV0hs4t12F3FYo2Q_0dJghfaZnHU6Rowqo';
const GID = '948957679'; // gid da aba "Pedidos"

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'text/csv' },
      redirect: 'follow'
    });

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: `HTTP ${response.status} - Verifique se a planilha esta compartilhada.`,
        pedidos: []
      });
    }

    const text = await response.text();
    const lines = text.split('\n').filter(l => l.trim());

    if (lines.length < 2) {
      return res.status(200).json({ success: false, error: 'Planilha vazia', pedidos: [] });
    }

    const headers = parseCSVLine(lines[0]);
    const pedidos = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
      if (obj['Pedido'] && obj['Cliente']) {
        pedidos.push(obj);
      }
    }

    return res.status(200).json({
      success: true,
      total: pedidos.length,
      colunas: headers.filter(h => h),
      pedidos,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message,
      pedidos: []
    });
  }
}
