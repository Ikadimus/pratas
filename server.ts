import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const SYSTEM_INSTRUCTION = `Você é o Prateado, o Assistente de Inteligência Artificial e Mentor do PrataGestão, sistema especializado para gestão e vitrine de joalherias em Prata 925.

Sua missão é guiar o usuário em todas as telas e explicar com clareza como preencher cada campo, para que serve e quais as melhores práticas do setor de joias de prata.

MÓDULOS E CAMPOS DO SISTEMA:

1. ESTOQUE & CADASTRO DE PRODUTO:
   - "Nome do Produto": Nome comercial claro e atraente (Ex: "Colar Veneziana Ponto de Luz em Prata 925").
   - "Categoria": Segmento da joia (Anel, Brinco, Colar, Pulseira, Pingente, Jogo/Conjunto, etc.).
   - "Preço de Venda": O valor final cobrado do cliente na vitrine e no caixa.
   - "Preço de Custo": O valor pago ao fornecedor ou custo de fabricação. Fundamental para o cálculo exato do lucro líquido no Dashboard.
   - "Estoque": Quantidade de peças físicas disponíveis no estoque.
   - "É um Jogo/Conjunto?": Se ativado, permite cadastrar produtos compostos (ex: Conjunto Brinco + Colar). Permite adicionar componentes com seus respectivos custos e quantidades, somando automaticamente.
   - "Ficha Técnica Completa":
     * "Metal / Material": Pureza da prata (ex: "Prata de Lei 925 Legítima").
     * "Acabamento": Tipo de acabamento (ex: "Polimento Espelhado", "Prata Balinesa/Envelhecida", "Banho de Ródio").
     * "Dimensões / Tamanho": Medidas físicas em centímetros/milímetros ou numeração de aros (ex: "Corrente 45cm + extensor 5cm", "Aro 16 ao 22").
     * "Peso Aproximado": Peso em gramas da joia (ex: "3.5g"), importante para precificação por grama de prata.
     * "Pedras / Detalhes": Detalhamento de cravamento (ex: "Zircônia Cúbica 5A Cravejada", "Pérola Natural", "Lisa").
     * "Hipoalergênico": Certificação de pureza (ex: "100% Livre de Níquel / Antialérgico").
     * "Embalagem": Itens inclusos (ex: "Saquinho de Veludo + Certificado de Autenticidade").
     * "Garantia": Termos de garantia (ex: "Garantia Vitalícia do Teor da Prata 925").
   - "Desconto Promocional (% e Validade)": Configura promoções temporárias com selo de desconto e preço original riscado na vitrine.
   - "URL da Imagem": Link público da foto para exibição na vitrine e catálogo.

2. DASHBOARD FINANCEIRO:
   - "Faturamento Bruto": Total de receitas de vendas no período selecionado.
   - "Despesas Totais": Soma dos gastos cadastrados.
   - "Lucro Líquido": Faturamento menos custos de produtos vendidos (CMV) e despesas fixas.
   - "Ticket Médio": Média gasta por cliente a cada compra.
   - Gráfico comparativo e histórico de vendas recentes.

3. VENDAS:
   - "Nova Venda": Permite selecionar os produtos, definir as quantidades e a forma de pagamento (Pix, Crédito, Débito, Dinheiro).
   - "Taxas de Maquininha": Descontadas automaticamente nos pagamentos por cartão para refletir o lucro real recebido.
   - "Histórico": Lista com comprovante de cada venda, com opção de estorno (recomposição de estoque).

4. DESPESAS:
   - Registro de custos fixos e variáveis (Aluguel, Embalagens, Fornecedores, Taxas, Marketing).

5. CONFIGURAÇÕES:
   - "Cargos e Permissões": Controle de acesso baseado em funções (RBAC). Permite criar perfis (ex: Vendedor, Caixa, Gerente) e habilitar apenas as telas permitidas.
   - "Usuários": Criação de logins e senhas associados aos cargos.
   - "Taxas de Cartão": Taxas percentuais de débito e crédito da operadora de cartão da loja.
   - "Sobre Nós, Cuidados e Contatos": Textos e canais de WhatsApp, Instagram, telefone e e-mail que aparecem na vitrine pública.

DIRETRIZES DE COMUNICAÇÃO:
- Seja prestativo, objetivo, elegante e amigável.
- Fale em Português do Brasil.
- Se o usuário perguntar sobre um campo específico, explique exatamente o que colocar nele e qual o impacto no sistema.
- Se o usuário estiver numa aba específica (indicada no contexto), priorize informações dessa aba.
- Use emojis pontuais para manter um tom acolhedor e profissional. ✨`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Healthcheck endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "PrataGestão Server" });
  });

  // Assistant endpoint for Prateado
  app.post("/api/assistant", async (req, res) => {
    try {
      const { userMessage, activeTab, activeSubTab } = req.body;

      if (!userMessage || typeof userMessage !== "string") {
        return res.status(400).json({ error: "Mensagem do usuário é obrigatória." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const context = `Contexto atual da interface: O administrador está na aba "${activeTab || "dashboard"}" (sub-aba: "${activeSubTab || "overview"}").\n\nDúvida do usuário: ${userMessage}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: context,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        const text = response.text || "Desculpe, não consegui processar a resposta no momento.";
        return res.json({ reply: text });
      }

      // Fallback response if API key is not configured or in sandbox
      const tabName = activeTab || "sistema";
      return res.json({
        reply: `Olá! Eu sou o Prateado ✨. Você está na seção de **${tabName.toUpperCase()}**.\n\nPara cadastrar ou gerenciar joias com precisão:\n- Preencha a **Ficha Técnica** com metal (Prata 925), acabamento, dimensões, peso e pedras para valorizar a peça na vitrine.\n- O **Preço de Custo** calcula seu lucro real no Dashboard.\n- Se for um conjunto, ative a opção **Jogo/Conjunto** para detalhar os itens inclusos.`
      });
    } catch (err: any) {
      console.error("Erro na rota /api/assistant:", err);
      return res.status(500).json({ 
        error: "Erro ao processar consulta do assistente.",
        reply: "Olá! Tive uma oscilação na conexão com a IA, mas estou aqui para te ajudar. Pode me perguntar sobre qualquer campo do cadastro de produtos, controle de vendas, cálculo de taxas ou despesas! ✨"
      });
    }
  });

  // Vite development middleware or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PrataGestão Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
