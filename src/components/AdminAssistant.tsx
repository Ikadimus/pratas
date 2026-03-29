import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Bot, Sparkles, Loader2 } from "lucide-react";
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

const SYSTEM_INSTRUCTION = `Você é o Prateado, o Assistente Virtual do PrataGestão, um sistema de gestão especializado para joalherias de prata 925.
Sua função é ajudar o administrador a entender como usar o sistema de forma eficiente.

O sistema possui as seguintes áreas e funcionalidades:

1. Dashboard Financeiro:
   - Resumo de faturamento, lucro, ticket médio e número de vendas.
   - Gráficos de Vendas vs Despesas por período.
   - Lista de vendas recentes.

2. Estoque:
   - Lista de Produtos: Onde você visualiza, edita ou exclui itens. Pode filtrar por categoria e buscar por nome.
   - Novo Produto: Cadastro de itens individuais ou conjuntos (sets). Para conjuntos, você adiciona componentes e o sistema calcula o custo total.
   - Amostra de Materiais: Uma vitrine interna rápida com fotos, preços e quantidades.

3. Vendas:
   - Histórico de Vendas: Registro de todas as transações com detalhes de itens e pagamentos.
   - Nova Venda: Interface para selecionar produtos, definir quantidades e escolher a forma de pagamento (Pix, Crédito, Débito, Dinheiro). O sistema calcula taxas de cartão automaticamente.

4. Despesas:
   - Histórico de Despesas: Lista de gastos da empresa.
   - Nova Despesa: Registro de custos fixos ou variáveis.

5. Configurações:
   - Cargos e Permissões: Criação de perfis (ex: Vendedor, Gerente) com acesso limitado a certas abas.
   - Usuários: Gerenciamento de quem pode entrar no painel.
   - Categorias: Personalização das categorias de produtos e despesas.
   - Taxas e Descontos: Configuração de taxas de maquininha e descontos para a vitrine.
   - Sobre Nós, Cuidados e Contatos: Edição das informações institucionais que aparecem na vitrine pública para os clientes.

Diretrizes de Resposta:
- Seja prestativo, educado e profissional.
- Responda em Português do Brasil.
- Mantenha as respostas concisas e diretas ao ponto.
- Se o usuário perguntar algo fora do contexto de gestão de joalheria ou do sistema PrataGestão, gentilmente redirecione-o para as funções do sistema.
- Use emojis ocasionalmente para tornar a conversa amigável. ✨`;

export function AdminAssistant({ activeTab, activeSubTab }: AdminAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Olá! Eu sou o Prateado. Como posso te ajudar com o sistema hoje? ✨" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const contextPrompt = `O usuário está atualmente na aba "${activeTab}"${activeSubTab ? ` (sub-aba: ${activeSubTab})` : ""}.
      Pergunta do usuário: ${userMessage}`;

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: "user", parts: [{ text: contextPrompt }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "Desculpe, não consegui processar sua pergunta agora. 😕";
      setMessages(prev => [...prev, { role: "model", text: aiText }]);
    } catch (error) {
      console.error("Erro no Assistente AI:", error);
      setMessages(prev => [...prev, { role: "model", text: "Ocorreu um erro ao conectar com o assistente. Verifique sua conexão. 🔌" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[380px] h-[500px] bg-white rounded-[32px] shadow-2xl border border-[#e5e5e5] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-[#141414] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Prateado</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Online agora</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcfc]"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === "user" ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div 
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user" 
                        ? "bg-[#141414] text-white rounded-tr-none" 
                        : "bg-white border border-[#e5e5e5] text-[#141414] rounded-tl-none shadow-sm"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-[#9e9e9e]">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs font-medium">Pensando...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-[#e5e5e5]">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Como posso ajudar?"
                  className="w-full pl-4 pr-12 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-2xl text-sm outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 w-8 h-8 bg-[#141414] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="mt-2 text-[9px] text-center text-[#9e9e9e] font-medium uppercase tracking-widest">
                Prateado • IA treinada para o PrataGestão
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group",
          isOpen ? "bg-white text-black rotate-90" : "bg-[#141414] text-white"
        )}
      >
        {isOpen ? <X size={24} /> : (
          <div className="relative">
            <MessageCircle size={24} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <Sparkles size={8} className="text-black" />
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
