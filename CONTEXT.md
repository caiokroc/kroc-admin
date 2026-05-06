# CONTEXT.md — Kroc Granola (Admin)

> Arquivo de contexto pra Claude Code. Leia inteiro antes de começar qualquer tarefa.

## O que é este projeto

Painel administrativo da **Kroc Granola** — dashboard interno usado pelos 3 sócios (Caio, Leo, Felipe) pra gerenciar vendas, estoque, clientes, custos e cupons.

- **URL produção**: https://kroc-admin.vercel.app
- **Repo**: github.com/caiokroc/kroc-admin
- **Stack**: React 18 + Vite + Vercel
- **Arquivo principal**: `src/App.jsx` (~1750 linhas, todo o admin num único arquivo)

## Login

- Usuários: caio / leo / felipe @krocgranola.com
- Senha: `kroc2025`

## Comandos essenciais

```bash
npm install        # instalar deps (uma vez)
npm run dev        # dev server em http://localhost:5174
npm run build      # build de produção
bash DEPLOY.sh     # deploy: força push main → Vercel builda em ~2min
```

**Importante**: `DEPLOY.sh` faz `rm -rf .git && git init && git push --force`. Apaga histórico.

## Arquitetura

### Abas (tabs) disponíveis

1. **📊 Dashboard** — KPIs, gráficos de receita/lucro
2. **💰 Vendas** — lista de pedidos, editar/excluir, nova venda manual
3. **🛵 Entregas** — pedidos pendentes de entrega, marcar como entregue
4. **📦 Estoque** — lotes de produção, embalagens, matéria-prima, baixas (dentro da mesma aba)
5. **👤 Clientes** — CRM auto-gerado a partir das vendas
6. **💸 Custos** — despesas variáveis + fixas recorrentes
7. **🎟️ Cupons** — gestão de cupons de desconto
8. **📈 DFs** — demonstrativos financeiros mensais
9. **⚙️ Config** — credenciais e integrações

### Sincronização com Supabase

- Sync a cada **15 segundos** (useEffect com interval)
- Carrega: pedidos, clientes, cupons, cupons_uso, lotes, ingredientes, embalagens, custos, baixas, pedido_lotes, view lotes_disponibilidade
- Após qualquer mutação (criar/editar/deletar), chama `sync()` imediatamente pra refletir no UI
- **Supabase é fonte única de verdade** — localStorage antigo foi desativado

## Integrações

Mesmo Supabase do site (`ownpsdvraqcnufjftjvk`). Credenciais embutidas no código — chave Anon é pública por design, protegida via RLS.

Todas as credenciais visíveis na aba **Configurações** com click-para-copiar.

## Modelo de dados (Supabase)

| Tabela | Propósito |
|---|---|
| `pedidos` | Vendas (P0001-P0052 históricos + novos com timestamp ex: P260417143021) |
| `clientes` | Endereços/contatos (também auto-derivado de vendas) |
| `cupons` | Cupons de desconto |
| `cupons_uso` | Histórico de uso de cupons |
| `lotes` | Lotes de produção (kg total, p40/240/500, sobra) |
| `ingredientes` | Matéria-prima (aveia, castanhas, etc) |
| `embalagens` | Pacotes e adesivos com custo médio ponderado |
| `custos` | Despesas (variáveis e recorrentes) |
| `baixas` | Amostras, marketing, cortesias, perdas — com categoria e destinatário |
| `pedido_lotes` | Alocações FIFO (1 pedido pode usar múltiplos lotes) |
| `lotes_disponibilidade` | **View** — calcula dinamicamente: produzido − vendido − baixado |

## Funcionalidades-chave implementadas

### Sistema FIFO de estoque (✅ funcionando)

- Toda venda/baixa aloca automaticamente do lote mais antigo com estoque disponível
- Trigger SQL `trg_aloca_fifo` faz isso no INSERT de `pedidos`
- Admin também aloca via JS (função `computeFIFO` + `gravarAlocacoes`) pra dar feedback visual
- Se estoque insuficiente: avisa "faltam N×240g, continuar?" em vez de bloquear
- Delete de venda/baixa libera o estoque dos lotes usados (remove de `pedido_lotes`)

### Consumo automático de embalagens (✅ funcionando)

Calculado em tempo real a partir de vendas + baixas:
- Cada venda/baixa de N×40g → N Pacote 40g + N Adesivo 40g
- Cada venda/baixa de N×240g → N Pacote 240g + N Adesivo 240g
- Cada venda/baixa de N×500g → N Pacote 500g + N Adesivo 500g
- Cada venda Online **entregue** → 1 Sacola Entrega

Admin mostra agrupados por tamanho (40g/240g/500g) com indicação de "kits disponíveis" (limitado pelo menor entre Pacote e Adesivo). Sacola Entrega fica separada. Click em qualquer card abre modal de edição manual (pro caso de ajuste).

### Compra de embalagens com preço médio ponderado (✅ funcionando)

Ao registrar compra, cada item recebe quantidade e preço unitário. O custo médio na tabela `embalagens.preco_medio` atualiza:
```
novo_medio = (qtd_atual × preco_atual + qtd_nova × preco_novo) / (qtd_atual + qtd_nova)
```

### Custos fixos recorrentes (✅ funcionando)

- Campo `recorrente BOOLEAN` na tabela `custos`
- Modal de Nova Despesa tem checkbox "🔁 Custo Fixo Recorrente (mensal)"
- Aba Custos mostra painel dourado no topo com os recorrentes somados
- `CUSTOS_FIXOS_MES` é calculado dinamicamente via useMemo
- Reembolsos somam: custos variáveis + (recorrentes × nº de meses ativos)

## Produtos

- **GRN-040** — Kroc Tradicional 40g (Mini) — R$ 9,90 — custo unitário R$ 4,34 (approx)
- **GRN-240** — Kroc Tradicional 240g (Pequeno) — R$ 44,90 — custo unitário R$ 16,64
- **GRN-500** — Kroc Tradicional 500g (Médio) — R$ 84,90 — custo unitário R$ 34,41

## Cupons — modelo completo

### Tabela `cupons`

```sql
code TEXT          -- "KROC10", "MARCOS100", etc
tipo TEXT          -- 'percentual' ou 'fixo'
valor NUMERIC      -- 10 (10%) ou 20 (R$20)
validade DATE      -- nullable, se null nunca expira
uso_maximo INTEGER -- nullable, sem limite global se null
uso_atual INTEGER  -- incrementa a cada uso
escopo TEXT        -- "240g,500g,frete" (onde aplica o desconto)
ativo BOOLEAN

-- Novas colunas (próxima feature):
limite_40 INTEGER              -- máx unidades de 40g com desconto
limite_240 INTEGER             -- máx unidades de 240g
limite_500 INTEGER             -- máx unidades de 500g
restricao_emails TEXT          -- lista "a@x.com,b@y.com"
restricao_telefones TEXT       -- lista "11999998888,11988887777"
uso_unico_por_cliente BOOLEAN
```

### Tabela `cupons_uso`

```sql
cupom_code TEXT
cliente TEXT (nome)
desconto_valor NUMERIC
created_at TIMESTAMPTZ
cliente_email TEXT      -- novo
cliente_telefone TEXT   -- novo
```

## Convenções

- Não criar arquivos novos desnecessariamente — tudo cabe no `App.jsx`
- Estilos inline com objetos JS
- Paleta de cores em objeto `X` no topo (X.acc, X.mut, X.txt, etc); fonte `mo` = monospace
- Componentes reutilizáveis: `<Inp>`, `<Sel>`, `<Btn>`, `<Modal>`, `<Badge>`, `<ProdChips>`
- Handlers assíncronos: sempre try/catch + feedback via `show()` (toast)
- Após mutação, sempre chamar `sync()` pra refletir no UI
- Toda mudança persiste no Supabase — não depender de estado local

## Estado atual e próxima tarefa

### ✅ Pronto

- FIFO, baixas dentro de Estoque, custos recorrentes, aba Config completa, edição inline de embalagens, compra com preço médio.

### 🚧 Próxima feature: Cupons com restrições avançadas

Adicionar na UI de **criar/editar cupom** 3 novas seções:

#### 1. "📏 Limite de unidades com desconto"
- 3 inputs pequenos: 40g, 240g, 500g
- Placeholder: "sem limite"
- Texto ajuda: "Apenas as N primeiras unidades recebem desconto. Deixe vazio para aplicar em todas."
- Gravar em `limite_40`, `limite_240`, `limite_500`

#### 2. "👤 Restrição por cliente"
- 2 textareas: Emails autorizados, Telefones autorizados
- Placeholder: "um por linha ou separados por vírgula"
- Texto ajuda: "Deixe vazio para permitir qualquer cliente."
- **Normalizar antes de salvar**:
  - Emails: lowercase + trim, join com vírgula
  - Telefones: só dígitos, join com vírgula
- Gravar em `restricao_emails`, `restricao_telefones`

#### 3. "🔒 Uso único por cliente"
- Checkbox "Cada cliente autorizado pode usar apenas 1 vez"
- Gravar em `uso_unico_por_cliente`

#### Mudanças na listagem de cupons

Adicionar badges quando houver restrições:
- Se tem limite de unidades: badge "máx X un"
- Se tem restrição de cliente: badge "👤 restrito"
- Se uso único: badge "1x por cliente"

#### Aba "Uso recente"

Mostrar também `cliente_email` e `cliente_telefone` da tabela `cupons_uso`.

### SQL que pode ser necessário

```sql
-- Pra cupons_uso (se ainda não tem):
ALTER TABLE cupons_uso ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE cupons_uso ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
```

As colunas em `cupons` já foram criadas (limite_40/240/500, restricao_emails, restricao_telefones, uso_unico_por_cliente).

## Projeto irmão

**kroc-granola** (o site público) em `github.com/caiokroc/kroc-granola` lê a mesma tabela `cupons`. Qualquer mudança no admin precisa ser acompanhada no site pra que a validação no checkout funcione. Ver CONTEXT.md do site pra detalhes.

## Sobre o desenvolvedor

Caio não é dev de formação. Prefere **explicações de root cause** sobre tentativa-e-erro. Valoriza soluções que preservam dados/histórico. Quando algo quebra, prefere diagnóstico antes de "tentar coisas".
