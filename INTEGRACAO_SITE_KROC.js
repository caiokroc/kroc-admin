/*
 * SNIPPET DE INTEGRAÇÃO — Adicionar no site kroc-granola.vercel.app
 * 
 * Cole este código no App.jsx do site da Kroc, DENTRO da função que é 
 * chamada quando o cliente clica "Ir para Pagamento" — no mesmo lugar
 * onde já é feito o envio para Google Sheets e EmailJS.
 * 
 * Esse código envia os dados da venda diretamente para o admin.
 */

// ─── Endereço do admin (atualizar após deploy) ───
const ADMIN_URL = "https://kroc-admin.vercel.app";

// ─── Função para notificar o admin ───
async function notificarAdmin(dadosPedido) {
  try {
    await fetch(`${ADMIN_URL}/api/nova-venda`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: dadosPedido.nome,
        telefone: dadosPedido.telefone,
        email: dadosPedido.email,
        endereco: dadosPedido.endereco,
        numero: dadosPedido.numero,
        complemento: dadosPedido.complemento,
        bairro: dadosPedido.bairro,
        cep: dadosPedido.cep,
        // Produtos — adapte conforme a estrutura do site
        itens: dadosPedido.itens || [
          dadosPedido.qtd240 && { produto: "Kroc Tradicional 240g", quantidade: dadosPedido.qtd240, preco: 44.90 },
          dadosPedido.qtd500 && { produto: "Kroc Tradicional 500g", quantidade: dadosPedido.qtd500, preco: 84.90 },
        ].filter(Boolean),
        frete: dadosPedido.frete,
        total: dadosPedido.total,
        pagamento: dadosPedido.pagamento || "Pix",
        timestamp: new Date().toISOString(),
        source: "kroc-granola.vercel.app",
      }),
    });
    console.log("[Kroc] Venda notificada ao admin");
  } catch (e) {
    // Não bloqueia o checkout se o admin estiver fora
    console.warn("[Kroc] Admin notification failed:", e.message);
  }
}

/*
 * COMO USAR:
 * 
 * No evento de "Ir para Pagamento" do App.jsx do site da Kroc,
 * adicione APÓS os envios para Google Sheets e EmailJS:
 * 
 *   // Envio para Google Sheets (já existe)
 *   fetch('/api/sheets.js', { ... });
 *   
 *   // Envio para EmailJS (já existe)  
 *   emailjs.send(...);
 *   
 *   // >>> NOVO: Notificar admin <<<
 *   notificarAdmin({
 *     nome: formData.nome,
 *     telefone: formData.telefone,
 *     email: formData.email,
 *     endereco: formData.endereco,
 *     numero: formData.numero,
 *     complemento: formData.complemento,
 *     bairro: formData.bairro,
 *     cep: formData.cep,
 *     qtd240: formData.qtd240,
 *     qtd500: formData.qtd500,
 *     frete: formData.frete,
 *     total: formData.total,
 *   });
 */
