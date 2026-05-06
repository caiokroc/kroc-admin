// /api/nova-venda.js — Webhook que recebe vendas do site kroc-granola.vercel.app
// O site da Kroc faz POST aqui quando uma venda é registrada
// Os dados ficam no Google Sheets como source of truth, mas esse endpoint
// permite que o admin receba notificações em tempo real

export default async function handler(req, res) {
  // CORS — permite o site da Kroc chamar
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const venda = req.body;

      // Valida campos mínimos
      if (!venda || !venda.nome) {
        return res.status(400).json({ success: false, error: 'Dados incompletos' });
      }

      // Loga a venda recebida (em produção, poderia salvar em Vercel KV/DB)
      console.log('[NOVA VENDA]', JSON.stringify(venda));

      // Responde com sucesso — o admin vai pegar via sync do Sheets
      return res.status(200).json({
        success: true,
        message: 'Venda registrada no admin',
        timestamp: new Date().toISOString(),
        venda: {
          nome: venda.nome,
          telefone: venda.telefone,
          produtos: venda.produtos || venda.itens,
          total: venda.total,
        }
      });

    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET — retorna status
  return res.status(200).json({
    status: 'online',
    endpoint: '/api/nova-venda',
    metodo: 'POST',
    descricao: 'Webhook para receber vendas do site kroc-granola.vercel.app',
    campos: ['nome', 'telefone', 'email', 'endereco', 'numero', 'complemento', 'bairro', 'cep', 'itens', 'frete', 'total', 'pagamento'],
  });
}
