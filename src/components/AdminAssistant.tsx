import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles, Loader2, HelpCircle, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface Message {
  role: "user" | "model";
  text: string;
}

interface AdminAssistantProps {
  activeTab: string;
  activeSubTab: string;
}

// Complete knowledge base explaining every single field and page in the admin area
const PAGE_EXPLANATIONS: Record<string, { title: string; summary: string; fields: { name: string; purpose: string; example: string; tip: string }[] }> = {
  inventory: {
    title: "Estoque e Cadastro de Joias",
    summary: "Nesta área você gerencia todo o acervo da sua joalheria. Pode cadastrar peças individuais ou conjuntos completos, especificando detalhes técnicos que aparecem na vitrine para o cliente.",
    fields: [
      {
        name: "Nome da Peça",
        purpose: "Identificação comercial da joia na vitrine e nos relatórios de vendas.",
        example: "Ex: 'Colar Veneziana Ponto de Luz em Prata 925' ou 'Anel Solitário Cravejado'.",
        tip: "Utilize nomes atrativos e com termos buscados (ex: modelo da corrente, tipo de pedra)."
      },
      {
        name: "Categoria",
        purpose: "Classificação do produto no catálogo (Anel, Brinco, Colar, Pulseira, Pingente, Jogo, Outros).",
        example: "Ex: 'Anel', 'Colar', 'Jogo'.",
        tip: "A categoria permite ao cliente filtrar na vitrine e organiza os relatórios de saída por tipo de joia."
      },
      {
        name: "Preço de Venda (R$)",
        purpose: "Valor cobrado do cliente na vitrine e registrado nas vendas.",
        example: "Ex: R$ 189,90.",
        tip: "Se houver desconto promocional ativo, este preço será riscado e o valor com desconto será exibido."
      },
      {
        name: "Preço de Custo (R$)",
        purpose: "Custo pago ao fornecedor ou custo de fabricação da joia.",
        example: "Ex: R$ 65,00.",
        tip: "Fundamental para o Dashboard! O sistema calcula seu Lucro Líquido e Margem real subtraindo o custo da venda."
      },
      {
        name: "Estoque Disponível",
        purpose: "Quantidade de unidades prontas para pronta-entrega na loja.",
        example: "Ex: 15 unidades.",
        tip: "O estoque é decrementado automaticamente a cada venda registrada e reposto em caso de exclusão."
      },
      {
        name: "É um Jogo / Conjunto?",
        purpose: "Ativa o modo de peça composta (ex: Conjunto Gota com Colar + Brincos).",
        example: "Ex: Marcado para kits e conjuntos.",
        tip: "Permite adicionar componentes individuais; o sistema calcula o custo somado de cada peça automaticamente."
      },
      {
        name: "Ficha Técnica • Metal / Material",
        purpose: "Composição e pureza do metal precioso.",
        example: "Ex: 'Prata de Lei 925 Legítima' ou 'Prata 925 com Banho de Ródio Branco'.",
        tip: "Garante confiança ao cliente na vitrine, destacando a autenticidade da prata esterlina."
      },
      {
        name: "Ficha Técnica • Acabamento",
        purpose: "Tipo de tratamento superficial da joia.",
        example: "Ex: 'Polimento Espelhado', 'Prata Envelhecida Balinesa', 'Diamantado'.",
        tip: "Informa se a peça tem brilho reflexivo, textura fosca ou visual rústico balinês."
      },
      {
        name: "Ficha Técnica • Dimensões / Tamanho",
        purpose: "Tamanho físico, comprimento de correntes ou numeração de aro.",
        example: "Ex: 'Corrente 45cm + 5cm extensor', 'Aro 16 a 18' ou 'Diâmetro 25mm'.",
        tip: "Evita devoluções por tamanho inadequado, tirando todas as dúvidas do comprador."
      },
      {
        name: "Ficha Técnica • Peso Aproximado",
        purpose: "Massa da joia em gramas.",
        example: "Ex: '3.8g' ou '12.4g'.",
        tip: "No setor de pratas, o peso é um dos maiores indicadores de qualidade e robustez da peça."
      },
      {
        name: "Ficha Técnica • Pedras / Detalhes",
        purpose: "Especificação das gemas ou detalhes ornamentais.",
        example: "Ex: 'Zircônia Cúbica 5A Cravejada', 'Pérola Natural de Água Doce' ou 'Sem pedras'.",
        tip: "Destaque a lapidação e a qualidade do cravamento das pedras."
      },
      {
        name: "Ficha Técnica • Hipoalergênico",
        purpose: "Indicação de segurança para peles sensíveis.",
        example: "Ex: 'Sim (100% Livre de Níquel e Metais Pesados)'.",
        tip: "Crucial para clientes com alergia; joias em prata 925 autêntica são naturalmente seguras."
      },
      {
        name: "Ficha Técnica • Embalagem Inclusa",
        purpose: "Itens que acompanham o pedido ao ser entregue.",
        example: "Ex: 'Saquinho de Veludo Exclusivo + Certificado de Autenticidade'.",
        tip: "Agrega alto valor percebido para presentes."
      },
      {
        name: "Ficha Técnica • Termos de Garantia",
        purpose: "Política de garantia da joalheria.",
        example: "Ex: 'Garantia Vitalícia do Teor da Prata 925 + 90 dias contra defeitos'.",
        tip: "Aumenta muito a taxa de conversão de compras na vitrine e via WhatsApp."
      },
      {
        name: "Desconto Promocional (% e Datas)",
        purpose: "Aplica selo de promoção temporária com percentual de desconto.",
        example: "Ex: 15% de desconto de 01/10 a 15/10.",
        tip: "Gera urgência na vitrine exibindo o selo de desconto e calculando o valor promocional."
      }
    ]
  },
  dashboard: {
    title: "Dashboard Financeiro",
    summary: "Visão executiva da saúde financeira da joalheria, com gráficos analíticos de vendas, despesas, lucro líquido e ticket médio.",
    fields: [
      {
        name: "Faturamento Bruto",
        purpose: "Receita total gerada pelas vendas no período selecionado.",
        example: "Ex: R$ 14.580,00.",
        tip: "Soma de todas as entradas de pedidos e vendas de joias."
      },
      {
        name: "Despesas Totais",
        purpose: "Soma de todos os gastos operacionais e compras de estoque cadastradas.",
        example: "Ex: R$ 4.200,00.",
        tip: "Inclui custos fixos (aluguel, funcionários) e variáveis (embalagens, marketing)."
      },
      {
        name: "Lucro Líquido Real",
        purpose: "Resultado final do negócio após deduzir custos das peças vendidas, despesas e taxas de cartão.",
        example: "Ex: R$ 6.380,00.",
        tip: "Métrica mais importante do negócio: indica o dinheiro que realmente sobra no caixa."
      },
      {
        name: "Ticket Médio",
        purpose: "Valor médio investido por cada cliente por compra.",
        example: "Ex: R$ 185,00.",
        tip: "Incentive combos e conjuntos para aumentar o ticket médio da joalheria."
      },
      {
        name: "Gráficos de Tendência",
        purpose: "Comparativo mensal entre Vendas vs Despesas e distribuição por forma de pagamento.",
        example: "Ex: Linhas mensais e barras comparativas.",
        tip: "Permite prever períodos de sazonalidade (Dia das Mães, Namorados, Fim de Ano)."
      }
    ]
  },
  sales: {
    title: "Vendas e Frente de Caixa",
    summary: "Registro de pedidos e saídas do estoque com cálculo inteligente de taxas de maquininha e comprovante.",
    fields: [
      {
        name: "Seleção de Joias e Quantidade",
        purpose: "Itens que estão sendo adquiridos pelo cliente.",
        example: "Ex: 1x Anel Solitário + 1x Corrente Veneziana.",
        tip: "O sistema valida se há estoque suficiente antes de concluir a venda."
      },
      {
        name: "Forma de Pagamento",
        purpose: "Modalidade escolhida: Pix, Cartão de Crédito, Débito ou Dinheiro.",
        example: "Ex: 'Crédito' ou 'Pix'.",
        tip: "Para cartão, o sistema desconta automaticamente a taxa cadastrada em Configurações, registrando o valor líquido."
      },
      {
        name: "Histórico de Vendas",
        purpose: "Lista de todas as transações com data, total bruto, taxa e valor líquido recebido.",
        example: "Ex: Tabela com busca e detalhes de cada item vendido.",
        tip: "Você pode estornar uma venda: o sistema devolverá automaticamente as peças ao estoque."
      }
    ]
  },
  expenses: {
    title: "Gestão de Despesas",
    summary: "Controle de saídas e despesas fixas ou variáveis da joalheria.",
    fields: [
      {
        name: "Descrição da Despesa",
        purpose: "Identificação clara do motivo do pagamento.",
        example: "Ex: 'Fornecedor Pratas de Curitiba', 'Embalagens Aveludadas', 'Aluguel'.",
        tip: "Facilita auditorias futuras e planejamento tributário."
      },
      {
        name: "Categoria da Despesa",
        purpose: "Classificação orçamentária (Fornecedor, Aluguel, Marketing, Embalagens, Outros).",
        example: "Ex: 'Fornecedor'.",
        tip: "Permite ver no Dashboard onde seu dinheiro está sendo mais consumido."
      },
      {
        name: "Valor (R$) e Data",
        purpose: "Montante financeiro e dia da realização do pagamento.",
        example: "Ex: R$ 350,00 em 10/05/2026.",
        tip: "Mantenha as datas alinhadas para os filtros mensais do Dashboard baterem perfeitamente."
      }
    ]
  },
  settings: {
    title: "Configurações do Sistema",
    summary: "Personalização de níveis de acesso (RBAC), taxas de cartão, dados institucionais e canais de contato.",
    fields: [
      {
        name: "Níveis de Acesso (Cargos)",
        purpose: "Cria perfis de colaboradores e define permissões por módulo.",
        example: "Ex: Cargo 'Vendedor' com acesso apenas ao Estoque e Vendas.",
        tip: "Impede que funcionários vejam dados sensíveis de lucro ou excluam cadastros."
      },
      {
        name: "Usuários do Painel",
        purpose: "Cria login e senha individuais para cada membro da equipe.",
        example: "Ex: maria@joalheria.com vinculado ao cargo de Vendedor.",
        tip: "Permite rastreabilidade e segurança nos acessos."
      },
      {
        name: "Taxas de Cartão (Crédito / Débito)",
        purpose: "Percentual cobrado pela operadora de maquininha de cartão.",
        example: "Ex: 3.99% no Crédito, 1.99% no Débito.",
        tip: "O sistema usa essas taxas para calcular o lucro líquido real de cada venda."
      },
      {
        name: "Sobre Nós & Cuidados com a Prata",
        purpose: "Textos institucionais e manuais que aparecem diretamente na vitrine pública para os clientes.",
        example: "Ex: Instruções de limpeza com flanela mágica e guardados da prata.",
        tip: "Excelente para educar clientes e reduzir reclamações sobre oxidação natural da prata."
      },
      {
        name: "Contatos e Redes Sociais",
        purpose: "Links de WhatsApp, Instagram, Facebook, telefone e e-mail integrados à vitrine.",
        example: "Ex: Número de WhatsApp para finalização direta de pedidos pelo carrinho.",
        tip: "Ao clicar em 'Comprar via WhatsApp' na vitrine, o cliente envia uma mensagem formatada direto para seu número."
      }
    ]
  }
};

export function AdminAssistant({ activeTab, activeSubTab }: AdminAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "guide">("chat");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "model", 
      text: "Olá! Eu sou o **Prateado**, seu assistente especializado da **B2B Pratas** ✨.\n\nEstou aqui para tirar qualquer dúvida sobre **como utilizar e para que serve cada campo** do painel administrativo. Pode me perguntar qualquer coisa ou clicar nos tópicos rápidos abaixo!" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentTabKey = activeTab || "dashboard";
  const currentTabInfo = PAGE_EXPLANATIONS[currentTabKey] || PAGE_EXPLANATIONS.dashboard;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeView]);

  const explainFieldDirectly = (fieldName: string) => {
    setActiveView("chat");
    const foundField = currentTabInfo.fields.find(f => f.name.toLowerCase().includes(fieldName.toLowerCase())) ||
      Object.values(PAGE_EXPLANATIONS).flatMap(p => p.fields).find(f => f.name.toLowerCase().includes(fieldName.toLowerCase()));

    if (foundField) {
      const userText = `Como funciona o campo "${foundField.name}"?`;
      const replyText = `**Campo: ${foundField.name}**\n\n📌 **Para que serve:**\n${foundField.purpose}\n\n📝 **Exemplo prático:**\n${foundField.example}\n\n💡 **Dica de Ouro:**\n${foundField.tip}`;
      
      setMessages(prev => [
        ...prev,
        { role: "user", text: userText },
        { role: "model", text: replyText }
      ]);
    } else {
      askQuestion(`Como preencher os campos de ${currentTabInfo.title}?`);
    }
  };

  const explainCurrentPage = () => {
    setActiveView("chat");
    const userText = `Pode explicar todos os campos desta tela de ${currentTabInfo.title}?`;
    
    let replyText = `✨ **Guia Completo da Tela: ${currentTabInfo.title}**\n\n${currentTabInfo.summary}\n\n`;
    currentTabInfo.fields.forEach(f => {
      replyText += `🔹 **${f.name}**\n• *Para que serve:* ${f.purpose}\n• *Exemplo:* ${f.example}\n• *Dica:* ${f.tip}\n\n`;
    });

    setMessages(prev => [
      ...prev,
      { role: "user", text: userText },
      { role: "model", text: replyText }
    ]);
  };

  const askQuestion = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;
    
    const userMessage = questionText.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // Call server-side /api/assistant endpoint
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          activeTab,
          activeSubTab
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setMessages(prev => [...prev, { role: "model", text: data.reply }]);
          setIsLoading(false);
          return;
        }
      }

      // Fallback response based on the knowledge base if server response is not available
      const lower = userMessage.toLowerCase();
      let fallback = "";

      if (lower.includes("campo") || lower.includes("cadastro") || lower.includes("produto") || lower.includes("joia")) {
        fallback = `Para cadastrar uma joia com máxima excelência:\n- **Nome**: Use termos atrativos (ex: Gargantilha Ponto de Luz Prata 925).\n- **Preço de Custo**: Fundamental para que o Dashboard calcule seu lucro líquido real.\n- **Ficha Técnica**: Preencha metal (Prata 925), acabamento, peso, medidas e pedras. Esses dados aparecem no modal da vitrine pública e dão segurança ao comprador!`;
      } else if (lower.includes("jogo") || lower.includes("conjunto")) {
        fallback = `Ao marcar **"É um Jogo / Conjunto?"** no cadastro de produto, você pode cadastrar joias compostas (ex: Brinco + Colar). O sistema permite listar os componentes individuais e soma os custos de cada um para gerar o custo total do conjunto!`;
      } else if (lower.includes("venda") || lower.includes("taxa") || lower.includes("cartão")) {
        fallback = `No módulo de **Vendas**, ao selecionar pagamento por Cartão (Crédito ou Débito), o B2B Pratas desconta automaticamente a taxa que você configurou em Configurações > Taxas de Cartão. Dessa forma, seu Dashboard exibe o valor líquido que realmente cairá na sua conta.`;
      } else if (lower.includes("dashboard") || lower.includes("lucro")) {
        fallback = `O **Dashboard Financeiro** consolida Faturamento Bruto, Despesas Totais e Lucro Líquido Real. O lucro líquido calcula exatamente a receita subtraída do custo das peças (CMV), taxas de cartão e despesas operacionais da joalheria.`;
      } else {
        fallback = `Eu sou o **Prateado** ✨. Estou aqui para te orientar em todos os módulos: **Estoque**, **Vendas**, **Despesas**, **Dashboard** e **Configurações**. Você pode clicar na aba 'Guia dos Campos' acima para ver a explicação de cada campo desta tela ou me perguntar sobre qualquer funcionalidade!`;
      }

      setMessages(prev => [...prev, { role: "model", text: fallback }]);
    } catch {
      // Local fallback
      setMessages(prev => [
        ...prev, 
        { 
          role: "model", 
          text: `Olá! Eu sou o Prateado ✨. Na aba **${currentTabInfo.title}**, os principais campos são: **${currentTabInfo.fields.map(f => f.name).join(", ")}**. Clique na aba 'Guia dos Campos' acima para conferir a explicação detalhada de cada um!` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    askQuestion(input);
  };

  // Helper to format message with basic markdown
  const renderMessageText = (text: string) => {
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
        {text.split("\n\n").map((paragraph, pIdx) => {
          // Check for bold highlights
          const parts = paragraph.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={pIdx}>
              {parts.map((part, partIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={partIdx} className="font-bold text-black">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith("• ")) {
                  return <span key={partIdx} className="block pl-2 text-[#4a4a4a]">{part}</span>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[92vw] sm:w-[440px] h-[560px] bg-white rounded-[32px] shadow-2xl border border-[#e5e5e5] flex flex-col overflow-hidden animate-in"
          >
            {/* Header */}
            <div className="p-5 bg-[#141414] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">Prateado</h3>
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
                      IA Assistente
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/70 font-medium">Pronto para explicar os campos</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white/80 hover:text-white"
                title="Fechar assistente"
              >
                <X size={16} />
              </button>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex border-b border-gray-100 bg-[#fbfbfb] px-4 pt-2 gap-2 text-xs">
              <button
                onClick={() => setActiveView("chat")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 font-bold rounded-t-xl transition-all border-b-2",
                  activeView === "chat" 
                    ? "border-black text-black bg-white shadow-sm" 
                    : "border-transparent text-gray-400 hover:text-black"
                )}
              >
                <MessageCircle size={14} />
                Conversa com Prateado
              </button>
              <button
                onClick={() => setActiveView("guide")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 font-bold rounded-t-xl transition-all border-b-2",
                  activeView === "guide" 
                    ? "border-black text-black bg-white shadow-sm" 
                    : "border-transparent text-gray-400 hover:text-black"
                )}
              >
                <BookOpen size={14} />
                Guia dos Campos ({currentTabInfo.fields.length})
              </button>
            </div>

            {/* Content Body */}
            {activeView === "chat" ? (
              <>
                {/* Messages List */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#fafafa]"
                >
                  {/* Context Banner */}
                  <div className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-gray-500" />
                      <span className="text-[11px] font-bold text-gray-700">Página atual: {currentTabInfo.title}</span>
                    </div>
                    <button
                      onClick={explainCurrentPage}
                      className="text-[11px] font-bold text-[#141414] hover:underline flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      Explicar tela
                    </button>
                  </div>

                  {messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex flex-col max-w-[90%]",
                        msg.role === "user" ? "ml-auto items-end" : "items-start"
                      )}
                    >
                      <div 
                        className={cn(
                          "px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-xs",
                          msg.role === "user" 
                            ? "bg-[#141414] text-white rounded-tr-none" 
                            : "bg-white border border-[#e5e5e5] text-[#141414] rounded-tl-none shadow-xs"
                        )}
                      >
                        {renderMessageText(msg.text)}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 text-[#9e9e9e] p-2 bg-white rounded-2xl border border-gray-100 w-fit">
                      <Loader2 size={14} className="animate-spin text-black" />
                      <span className="text-xs font-bold text-gray-600">Prateado está digitando...</span>
                    </div>
                  )}
                </div>

                {/* Quick Prompts Carousel */}
                <div className="px-4 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={explainCurrentPage}
                    className="whitespace-nowrap px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0"
                  >
                    <HelpCircle size={12} />
                    Explicar todos os campos
                  </button>
                  {currentTabKey === "inventory" && (
                    <>
                      <button
                        onClick={() => explainFieldDirectly("Ficha Técnica • Metal / Material")}
                        className="whitespace-nowrap px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors shrink-0"
                      >
                        Ficha Técnica Joias
                      </button>
                      <button
                        onClick={() => explainFieldDirectly("É um Jogo / Conjunto?")}
                        className="whitespace-nowrap px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors shrink-0"
                      >
                        Como cadastrar Conjuntos?
                      </button>
                    </>
                  )}
                  {currentTabKey === "dashboard" && (
                    <button
                      onClick={() => explainFieldDirectly("Lucro Líquido Real")}
                      className="whitespace-nowrap px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors shrink-0"
                    >
                      Como o Lucro é calculado?
                    </button>
                  )}
                  {currentTabKey === "sales" && (
                    <button
                      onClick={() => explainFieldDirectly("Forma de Pagamento")}
                      className="whitespace-nowrap px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors shrink-0"
                    >
                      Taxas de Maquininha
                    </button>
                  )}
                  {currentTabKey === "settings" && (
                    <button
                      onClick={() => explainFieldDirectly("Níveis de Acesso (Cargos)")}
                      className="whitespace-nowrap px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold transition-colors shrink-0"
                    >
                      Permissões e Cargos
                    </button>
                  )}
                </div>

                {/* Input Field */}
                <div className="p-3 bg-white border-t border-[#e5e5e5]">
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Tire sua dúvida sobre qualquer campo..."
                      className="w-full pl-4 pr-12 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-2xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 w-8 h-8 bg-[#141414] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all cursor-pointer"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Fields Guide View */
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
                <div className="p-3 bg-white rounded-2xl border border-gray-200 text-xs">
                  <h4 className="font-bold text-gray-900 mb-1">{currentTabInfo.title}</h4>
                  <p className="text-gray-500 text-[11px]">{currentTabInfo.summary}</p>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                  Campos desta tela (clique para perguntar no chat)
                </p>

                {currentTabInfo.fields.map((field, fIdx) => (
                  <div 
                    key={fIdx} 
                    className="p-3 bg-white rounded-2xl border border-gray-200 hover:border-black transition-all cursor-pointer group shadow-2xs"
                    onClick={() => explainFieldDirectly(field.name)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-900 group-hover:text-black flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        {field.name}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-black">
                        Ver detalhes →
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug mb-1.5">{field.purpose}</p>
                    <div className="text-[10px] text-gray-400 font-medium">
                      <span className="font-bold text-gray-500">Exemplo: </span>{field.example}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group relative",
          isOpen ? "bg-white text-black rotate-90 border border-gray-300" : "bg-[#141414] text-white"
        )}
        title="Ajuda do Assistente Prateado"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <MessageCircle size={24} />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-xs">
              <Sparkles size={9} className="text-black" />
            </div>
          </div>
        )}

        {/* Tooltip helper badge when closed */}
        {!isOpen && (
          <div className="absolute right-16 bg-[#141414] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl border border-white/10 hidden md:flex items-center gap-1.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles size={12} className="text-amber-300" />
            <span>Dúvidas dos campos? Chame o Prateado!</span>
          </div>
        )}
      </button>
    </div>
  );
}
