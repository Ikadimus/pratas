/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingDown, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Save, 
  X,
  ChevronRight,
  DollarSign,
  PackageCheck,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  QrCode,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
  Shield,
  Lock,
  Check,
  Eye,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Info,
  Sparkles,
  Phone,
  Instagram,
  Facebook,
  MessageCircle,
  Minus,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Percent,
  Image as ImageIcon,
  Gem,
  Scale,
  Ruler,
  Gift,
  UserCheck,
  Users,
  Award,
  Receipt
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatCurrency } from "./lib/utils";
import { Product, Sale, Expense, AppState, User, Role, Contacts, Seller } from "./types";

import { AdminAssistant } from "./components/AdminAssistant";
import { B2BLogo } from "./components/B2BLogo";
import { SellerCommissions } from "./components/SellerCommissions";

const INITIAL_PRODUCT_CATEGORIES = ["Anel", "Brinco", "Colar", "Pulseira", "Pingente", "Outros", "Jogo"];
const INITIAL_EXPENSE_CATEGORIES = ["Fornecedor", "Aluguel", "Marketing", "Comissões", "Outros"];
const PAYMENT_METHODS = ["Crédito", "Débito", "Pix", "Dinheiro"];

const DEFAULT_SELLERS: Seller[] = [
  { id: "seller-1", name: "Ana Paula Silva", commissionRate: 5, active: true, phone: "(11) 98765-4321" },
  { id: "seller-2", name: "Carlos Eduardo Costa", commissionRate: 5, active: true, phone: "(11) 97654-3210" },
  { id: "seller-3", name: "Mariana Alcantara", commissionRate: 6, active: true, phone: "(11) 96543-2109" },
  { id: "seller-4", name: "Lucas Ferreira", commissionRate: 4, active: true, phone: "(11) 95432-1098" }
];

const MENU_ITEMS = [
  { 
    id: "dashboard", 
    label: "Dashboard Financeiro", 
    icon: <LayoutDashboard size={18} />
  },
  { 
    id: "inventory", 
    label: "Estoque", 
    icon: <Package size={18} />,
    subItems: [
      { id: "list", label: "Lista de Produtos" },
      { id: "add", label: "Novo Produto" },
      { id: "materials", label: "Amostra de Materiais" }
    ]
  },
  { 
    id: "sales", 
    label: "Vendas", 
    icon: <ShoppingCart size={18} />,
    subItems: [
      { id: "history", label: "Histórico de Vendas" },
      { id: "new", label: "Nova Venda" }
    ]
  },
  { 
    id: "expenses", 
    label: "Despesas", 
    icon: <TrendingDown size={18} />,
    subItems: [
      { id: "history", label: "Histórico de Despesas" },
      { id: "commissions", label: "Comissões de Vendedores" },
      { id: "new", label: "Nova Despesa" }
    ]
  },
  { 
    id: "settings", 
    label: "Configurações", 
    icon: <SettingsIcon size={18} />,
    subItems: [
      { id: "users", label: "Usuários" },
      { id: "roles", label: "Cargos" },
      { id: "product-categories", label: "Categorias de Produtos" },
      { id: "expense-categories", label: "Categorias de Despesas" },
      { id: "fees", label: "Taxas de Cartão" },
      { id: "discounts", label: "Descontos de Produtos" },
      { id: "about-us", label: "Sobre Nós" },
      { id: "silver-care", label: "Cuidados com a Prata" },
      { id: "contacts", label: "Contatos" }
    ]
  },
];

const COLORS = ["#141414", "#4a4a4a", "#8e9299", "#d1d1d1", "#e6e6e6"];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("prata_gestao_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("prata_gestao_data");
    
    // Initial roles
    const initialRoles: Role[] = [
      { id: "admin", name: "Administrador", permissions: ["dashboard", "inventory", "sales", "expenses", "settings"] },
      { id: "vendedor", name: "Vendedor", permissions: ["dashboard", "inventory", "sales"] }
    ];
    
    const initialUsers: User[] = [
      { id: "demo", email: "teste", password: "teste", roleId: "admin" },
      { id: "1", email: "b@b", password: "123", roleId: "admin" }
    ];

    const defaultAboutUs = "Bem-vindo à B2B Pratas! Negócio que prospera. Somos especialistas em Prata 925 legítima no atacado e varejo, trazendo sofisticação, alta lucratividade e excelência em joias finas. Nossa missão é oferecer joias atemporais de altíssima qualidade com design moderno, acabamento espelhado e garantia de pureza, impulsionando o sucesso e o brilho do seu negócio.";
    const defaultSilverCare = "Como cuidar de suas Joias de Prata 925:\n\n1. Evite o contato com produtos químicos, perfumes, cosméticos e produtos de limpeza.\n2. Retire suas peças antes de tomar banho, entrar na piscina ou no mar.\n3. Limpe suas joias periodicamente com uma flanela mágica macia ou use produtos específicos para limpeza de prata (como o Limpa Pratas Monzi).\n4. Guarde suas joias individualmente em saquinhos de veludo ou caixas fechadas, protegidas da luz e da umidade, para evitar a oxidação natural.";
    const defaultContacts = {
      whatsapp: "https://wa.me/5511999999999",
      instagram: "https://instagram.com/b2bpratas",
      facebook: "https://facebook.com/b2bpratas",
      email: "contato@b2bpratas.com.br",
      phone: "(11) 99999-9999"
    };

    const initialProducts: Product[] = [
      {
        id: "prod-1",
        name: "Anel Solitário Prata 925 Cravejado",
        category: "Anel",
        sellingPricePerUnit: 129.90,
        costPerUnit: 45.00,
        stock: 18,
        discountPercentage: 15,
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop",
        description: "O clássico atemporal que nunca sai de moda. O Anel Solitário em Prata 925 legítima possui uma zircônia central lapidada com brilho intenso, realçado por microcravitações no aro que capturam a luz de todos os ângulos. Perfeito para pedidos especiais, presentes marcantes ou para compor um mix elegante no dia a dia.",
        material: "Prata de Lei 925 Legítima",
        finish: "Polimento Espelhado de Alta Precisão",
        dimensions: "Aro 17 (Ajustável entre 16 e 18)",
        weight: "2.8g",
        stone: "Zircônia Cúbica Central 6mm Cravejada 5A",
        hypoallergenic: "Sim (100% Livre de Níquel e Chumbo)",
        packaging: "Caixa Rígida Aveludada + Certificado de Autenticidade",
        warranty: "Garantia Vitalícia da Autenticidade da Prata 925"
      },
      {
        id: "prod-2",
        name: "Colar Corrente Veneziana 45cm",
        category: "Colar",
        sellingPricePerUnit: 89.90,
        costPerUnit: 30.00,
        stock: 25,
        imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop",
        description: "Corrente veneziana tradicional confeccionada em Prata 925 maciça com elos quadrados perfeitamente simétricos e entrelaçamento refinado. Possui brilho fluido extraordinário e caimento impecável no colo. Ideal para ser usada sozinha como ponto de luz ou acompanhada do seu pingente favorito.",
        material: "Prata de Lei 925 Legítima",
        finish: "Polimento Italiano Espelhado",
        dimensions: "Comprimento 45cm | Espessura 1.0mm",
        weight: "3.2g",
        stone: "Sem pedras (Design em malha contínua)",
        hypoallergenic: "Sim (Antialérgica / Hipoalergênica)",
        packaging: "Saquinho de Veludo B2B Pratas + Certificado",
        warranty: "Garantia Vitalícia da Autenticidade da Prata 925"
      },
      {
        id: "prod-3",
        name: "Brinco Argola Fio Quadrado G",
        category: "Brinco",
        sellingPricePerUnit: 119.90,
        costPerUnit: 40.00,
        stock: 14,
        imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=600&auto=format&fit=crop",
        description: "Argola geométrica moderna com design em fio quadrado que une minimalismo contemporâneo e presença sofisticada. Leve e confortável para uso prolongado, possui fecho click seguro e estrutura resistente. Uma peça curinga para elevar qualquer visual do casual à festa.",
        material: "Prata de Lei 925 Legítima",
        finish: "Polimento Espelhado com Proteção Antioxidante",
        dimensions: "Diâmetro Externo 28mm | Espessura 2.2mm",
        weight: "4.1g (o par)",
        stone: "Sem pedras (Fio maciço trabalhado)",
        hypoallergenic: "Sim (Sem níquel, ideal para orelhas sensíveis)",
        packaging: "Saquinho de Veludo Premium + Certificado",
        warranty: "Garantia Vitalícia da Autenticidade da Prata 925"
      },
      {
        id: "prod-4",
        name: "Pulseira Masculina Grumet 21cm",
        category: "Pulseira",
        sellingPricePerUnit: 249.90,
        costPerUnit: 95.00,
        stock: 8,
        imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop",
        description: "Pulseira com malha Grumet diamantada com elos duplos achatados que oferecem imponência e sofisticação sóbria. Conta com fecho gaveta com trava de segurança dupla, proporcionando conforto absoluto e máxima confiabilidade no pulso.",
        material: "Prata de Lei 925 Legítima Maciça",
        finish: "Diamantado com Polimento Especial",
        dimensions: "Comprimento 21cm | Largura dos elos 6.5mm",
        weight: "14.8g",
        stone: "Sem pedras (Prata maciça com facetas diamantadas)",
        hypoallergenic: "Sim (100% Livre de Metais Pesados)",
        packaging: "Estojo Luxo B2B Pratas + Certificado de Autenticidade",
        warranty: "Garantia Vitalícia da Autenticidade da Prata 925"
      },
      {
        id: "prod-5",
        name: "Conjunto Gota Fusion Esmeralda",
        category: "Jogo",
        sellingPricePerUnit: 389.90,
        costPerUnit: 140.00,
        stock: 6,
        isSet: true,
        discountPercentage: 20,
        imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop",
        description: "Conjunto deslumbrante composto por colar e par de brincos com pedras centrais fusion no tom verde esmeralda colombiana, circundadas por halo de microzircônias translúcidas cravejadas manualmente. Um conjunto aristocrático projetado para momentos inesquecíveis.",
        material: "Prata de Lei 925 com Banho de Ródio Branco",
        finish: "Ródio Nobre e Cravação Pavê Manual",
        dimensions: "Corrente 45cm + 5cm | Pingente 18x12mm | Brincos 14x10mm",
        weight: "8.5g (conjunto completo)",
        stone: "Cristais Fusion Esmeralda + Microzircônias 5A",
        hypoallergenic: "Sim (Camada nobre de ródio antialérgico)",
        packaging: "Estojo Completo de Veludo + Certificado Gemológico e do Metal",
        warranty: "Garantia Vitalícia do Metal e 1 Ano de Cravação",
        components: [
          { id: "comp-1", name: "Colar Gota Fusion Esmeralda", costPerUnit: 80.00, sellingPricePerUnit: 220.00, quantity: 1 },
          { id: "comp-2", name: "Brincos Gota Fusion Esmeralda", costPerUnit: 60.00, sellingPricePerUnit: 169.90, quantity: 1 }
        ]
      },
      {
        id: "prod-6",
        name: "Pingente Mandala Árvore da Vida",
        category: "Pingente",
        sellingPricePerUnit: 59.90,
        costPerUnit: 18.00,
        stock: 32,
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=600&auto=format&fit=crop",
        description: "Símbolo milenar de renovação, sabedoria e conexão familiar esculpido a laser em Prata 925 com detalhes vazados e borda trabalhada em micropontos de luz. Uma joia afetiva com profundo significado e acabamento artesanal de alto nível.",
        material: "Prata de Lei 925 Legítima",
        finish: "Corte a Laser com Acabamento Acetinado e Bordas Polidas",
        dimensions: "Diâmetro 22mm (Passador compatível até 3mm)",
        weight: "2.1g",
        stone: "Sem pedras (Escultura vazada de alta definição)",
        hypoallergenic: "Sim (100% Livre de Níquel)",
        packaging: "Saquinho de Algodão Cru com Tag e Certificado",
        warranty: "Garantia Vitalícia da Autenticidade da Prata 925"
      },
      {
        id: "prod-7",
        name: "Pulseira Riviera Cravejada Zircônia",
        category: "Pulseira",
        sellingPricePerUnit: 329.90,
        costPerUnit: 120.00,
        stock: 11,
        discountPercentage: 10,
        imageUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=600&auto=format&fit=crop",
        description: "A icônica pulseira Riviera com fileira contínua de zircônias cúbicas lapidadas em brilhante, montadas individualmente em chatões articulados com quatro garras cada. Oferece flexibilidade perfeita no contorno do pulso e brilho cintilante comparável a diamantes.",
        material: "Prata de Lei 925 Legítima com Banho de Ródio",
        finish: "Banho de Ródio Branco com Articulação Flexível",
        dimensions: "Comprimento 18cm | Largura 2.5mm | Fecho Joalheria Duplo",
        weight: "9.2g",
        stone: "Zircônias Cúbicas 2.5mm Alto Brilho Cravação 4 Garras",
        hypoallergenic: "Sim (100% Hipoalergênico)",
        packaging: "Estojo Longo Rígido + Certificado de Autenticidade",
        warranty: "Garantia Vitalícia da Autenticidade da Prata 925"
      },
      {
        id: "prod-8",
        name: "Anel Minimalista Três Linhas",
        category: "Anel",
        sellingPricePerUnit: 79.90,
        costPerUnit: 24.00,
        stock: 22,
        imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600&auto=format&fit=crop",
        description: "Design arquitetônico contemporâneo apresentando três aros paralelos que se encontram na base, criando o efeito visual de múltiplos anéis em uma única peça ergonômica e marcante. Elegância discreta e moderna para qualquer composição.",
        material: "Prata de Lei 925 Legítima",
        finish: "Polimento Alto Brilho Espelhado",
        dimensions: "Aro 16 (Largura frontal 8mm)",
        weight: "3.6g",
        stone: "Sem pedras (Design minimalista escultural)",
        hypoallergenic: "Sim (Livre de Níquel e Chumbo)",
        packaging: "Saquinho de Veludo + Certificado de Autenticidade",
        warranty: "Garantia Vitalícia da Autenticidade da Prata 925"
      }
    ];

    const generateDemoData = () => {
      const sales: Sale[] = [];
      const expenses: Expense[] = [];
      const now = new Date();
      
      for (let m = 5; m >= 0; m--) {
        const monthDate = subMonths(now, m);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        
        expenses.push({
          id: `exp-rent-${year}-${month}`,
          date: new Date(year, month, 5, 10, 0, 0).toISOString(),
          description: "Aluguel da Loja / Showroom",
          amount: 1500.00,
          category: "Aluguel"
        });

        expenses.push({
          id: `exp-mkt-${year}-${month}`,
          date: new Date(year, month, 10, 14, 0, 0).toISOString(),
          description: "Anúncios Meta Ads (Instagram/Facebook)",
          amount: Math.round(400.00 + Math.random() * 200),
          category: "Marketing"
        });

        expenses.push({
          id: `exp-sup-${year}-${month}`,
          date: new Date(year, month, 15, 11, 0, 0).toISOString(),
          description: "Compra de Prata 925 com Fornecedor",
          amount: Math.round(2000.00 + Math.random() * 800),
          category: "Fornecedor"
        });

        expenses.push({
          id: `exp-oth-${year}-${month}`,
          date: new Date(year, month, 22, 16, 0, 0).toISOString(),
          description: "Embalagens Personalizadas e Sacolas",
          amount: Math.round(150.00 + Math.random() * 100),
          category: "Outros"
        });

        if (m > 0) {
          expenses.push({
            id: `exp-comm-ana-${year}-${month}`,
            date: new Date(year, month, 28, 17, 0, 0).toISOString(),
            description: "Comissão de Vendas - Ana Paula Silva",
            amount: Math.round(380.00 + Math.random() * 120),
            category: "Comissões"
          });
          expenses.push({
            id: `exp-comm-carlos-${year}-${month}`,
            date: new Date(year, month, 28, 17, 30, 0).toISOString(),
            description: "Comissão de Vendas - Carlos Eduardo Costa",
            amount: Math.round(320.00 + Math.random() * 100),
            category: "Comissões"
          });
        }

        const demoSellerNames = ["Ana Paula Silva", "Carlos Eduardo Costa", "Mariana Alcantara", "Lucas Ferreira"];

        const salesCount = 15 + Math.floor(Math.random() * 10);
        for (let s = 0; s < salesCount; s++) {
          const day = 1 + Math.floor(Math.random() * 27);
          const saleDate = new Date(year, month, day, 10 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60)).toISOString();
          
          const product1 = initialProducts[Math.floor(Math.random() * initialProducts.length)];
          const product2 = initialProducts[Math.floor(Math.random() * initialProducts.length)];
          const items = [
            {
              productId: product1.id,
              quantity: 1,
              priceAtSale: product1.sellingPricePerUnit,
              nameAtSale: product1.name
            }
          ];

          if (Math.random() < 0.4 && product2.id !== product1.id) {
            items.push({
              productId: product2.id,
              quantity: 1,
              priceAtSale: product2.sellingPricePerUnit,
              nameAtSale: product2.name
            });
          }

          const total = items.reduce((acc, item) => acc + (item.priceAtSale * item.quantity), 0);
          const methods: ("Crédito" | "Débito" | "Pix" | "Dinheiro")[] = ["Crédito", "Débito", "Pix", "Dinheiro"];
          const paymentMethod = methods[Math.floor(Math.random() * methods.length)];
          
          let feeRate = 0;
          if (paymentMethod === "Crédito") feeRate = 0.0399;
          else if (paymentMethod === "Débito") feeRate = 0.0199;
          
          const feeAmount = parseFloat((total * feeRate).toFixed(2));
          const netAmount = parseFloat((total - feeAmount).toFixed(2));
          const seller = demoSellerNames[s % demoSellerNames.length];

          sales.push({
            id: `sale-${year}-${month}-${s}`,
            date: saleDate,
            items,
            total,
            paymentMethod,
            feeAmount,
            netAmount,
            seller
          });
        }
      }

      return { sales, expenses };
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const hasProducts = Array.isArray(parsed.products) && parsed.products.length > 0;
          const products = hasProducts 
            ? parsed.products.map((p: Product) => {
                const init = initialProducts.find(ip => ip.id === p.id);
                if (init) {
                  return {
                    ...init,
                    ...p,
                    description: p.description || init.description,
                    material: p.material || init.material,
                    finish: p.finish || init.finish,
                    dimensions: p.dimensions || init.dimensions,
                    weight: p.weight || init.weight,
                    stone: p.stone || init.stone,
                    warranty: p.warranty || init.warranty,
                    packaging: p.packaging || init.packaging,
                    hypoallergenic: p.hypoallergenic || init.hypoallergenic,
                    discountPercentage: p.discountPercentage !== undefined ? p.discountPercentage : init.discountPercentage
                  };
                }
                return p;
              })
            : initialProducts;
          
          const hasSalesAndExpenses = Array.isArray(parsed.sales) && parsed.sales.length > 0;
          const { sales: demoSales, expenses: demoExpenses } = generateDemoData();
          const rawSales = hasSalesAndExpenses ? parsed.sales : demoSales;
          const expenses = hasSalesAndExpenses ? parsed.expenses : demoExpenses;

          const sellers = Array.isArray(parsed.sellers) && parsed.sellers.length > 0 ? parsed.sellers : DEFAULT_SELLERS;

          // Ensure all sales have an attributed seller so commission calculations work
          const sales = rawSales.map((s: Sale, index: number) => {
            if (!s.seller || s.seller.trim() === "") {
              const defaultAssigned = sellers[index % sellers.length]?.name || "Loja / Geral";
              return { ...s, seller: defaultAssigned };
            }
            return s;
          });

          // Merge initialUsers with parsed.users to ensure 'teste' exists
          let users = Array.isArray(parsed.users) ? parsed.users : initialUsers;
          if (!users.some((u: User) => u.email === "teste")) {
            users = [{ id: "demo", email: "teste", password: "teste", roleId: "admin" }, ...users];
          }

          // Ensure "Comissões" is in expense categories
          const rawExpenseCats = Array.isArray(parsed.expenseCategories) ? parsed.expenseCategories : INITIAL_EXPENSE_CATEGORIES;
          const expenseCategories = rawExpenseCats.includes("Comissões") ? rawExpenseCats : [...rawExpenseCats, "Comissões"];

          return {
            products,
            sales,
            expenses,
            users,
            roles: Array.isArray(parsed.roles) ? parsed.roles : initialRoles,
            expenseCategories,
            productCategories: Array.isArray(parsed.productCategories) ? parsed.productCategories : INITIAL_PRODUCT_CATEGORIES,
            creditFee: typeof parsed.creditFee === 'number' ? parsed.creditFee : 3.99,
            debitFee: typeof parsed.debitFee === 'number' ? parsed.debitFee : 1.99,
            aboutUs: parsed.aboutUs || defaultAboutUs,
            silverCare: parsed.silverCare || defaultSilverCare,
            contacts: parsed.contacts || defaultContacts,
            sellers
          };
        }
      } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", e);
      }
    }

    const { sales: demoSales, expenses: demoExpenses } = generateDemoData();
    return { 
      products: initialProducts, 
      sales: demoSales, 
      expenses: demoExpenses, 
      users: initialUsers, 
      roles: initialRoles,
      expenseCategories: INITIAL_EXPENSE_CATEGORIES,
      productCategories: INITIAL_PRODUCT_CATEGORIES,
      creditFee: 3.99,
      debitFee: 1.99,
      aboutUs: defaultAboutUs,
      silverCare: defaultSilverCare,
      contacts: defaultContacts,
      sellers: DEFAULT_SELLERS
    };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem("prata_gestao_data", JSON.stringify(state));
  }, [state]);

  // Persist user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("prata_gestao_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("prata_gestao_user");
    }
  }, [currentUser]);

  const currentRole = useMemo(() => {
    if (!currentUser) return null;
    return state.roles.find(r => r.id === currentUser.roleId) || null;
  }, [currentUser, state.roles]);

  const hasPermission = (tabId: string) => {
    if (!currentRole) return false;
    return currentRole.permissions.includes(tabId);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab("dashboard");
    setActiveSubTab("overview");
  };

  const handleTabChange = (tabId: string, subTabId: string) => {
    setActiveTab(tabId);
    setActiveSubTab(subTabId);
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const addProduct = (product: Product) => {
    setState(prev => ({ ...prev, products: [...prev.products, product] }));
  };

  const updateProduct = (updated: Product) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === updated.id ? updated : p)
    }));
  };

  const deleteProduct = (id: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const addSale = (sale: Sale) => {
    setState(prev => {
      // Update stock
      const updatedProducts = prev.products.map(p => {
        const saleItem = sale.items.find(item => item.productId === p.id);
        if (saleItem) {
          return { ...p, stock: p.stock - saleItem.quantity };
        }
        return p;
      });
      return {
        ...prev,
        products: updatedProducts,
        sales: [...prev.sales, sale]
      };
    });
  };

  const addExpense = (expense: Expense) => {
    setState(prev => ({ ...prev, expenses: [...prev.expenses, expense] }));
  };

  const deleteExpense = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  const updateFees = (creditFee: number, debitFee: number) => {
    setState(prev => ({ ...prev, creditFee, debitFee }));
  };

  const deleteSale = (id: string) => {
    setState(prev => {
      const sale = prev.sales.find(s => s.id === id);
      if (!sale) return prev;
      
      // Restore stock
      const updatedProducts = prev.products.map(p => {
        const saleItem = sale.items.find(item => item.productId === p.id);
        if (saleItem) {
          return { ...p, stock: p.stock + saleItem.quantity };
        }
        return p;
      });

      return {
        ...prev,
        products: updatedProducts,
        sales: prev.sales.filter(s => s.id !== id)
      };
    });
  };

  const loadMockData = () => {
    const mockProducts: Product[] = [
      { id: "1", name: "Anel de Prata 925 Cravejado", category: "Anel", sellingPricePerUnit: 189.90, costPerUnit: 75.00, stock: 15 },
      { id: "2", name: "Colar Veneziana com Pingente Coração", category: "Colar", sellingPricePerUnit: 249.90, costPerUnit: 110.00, stock: 8 },
      { id: "3", name: "Brinco Argola Média Lisa", category: "Brinco", sellingPricePerUnit: 89.90, costPerUnit: 35.00, stock: 25 },
      { id: "4", name: "Pulseira Riviera Prata", category: "Pulseira", sellingPricePerUnit: 320.00, costPerUnit: 140.00, stock: 5 },
    ];
    
    const mockSales: Sale[] = [
      { 
        id: "s1", 
        date: new Date().toISOString(), 
        total: 189.90, 
        paymentMethod: "Pix",
        items: [{ productId: "1", quantity: 1, priceAtSale: 189.90, nameAtSale: "Anel de Prata 925 Cravejado" }]
      },
      { 
        id: "s2", 
        date: subMonths(new Date(), 1).toISOString(), 
        total: 499.80, 
        paymentMethod: "Cartão",
        items: [{ productId: "2", quantity: 2, priceAtSale: 249.90, nameAtSale: "Colar Veneziana com Pingente Coração" }]
      }
    ];

    const mockExpenses: Expense[] = [
      { id: "e1", date: new Date().toISOString(), description: "Aluguel Quiosque", amount: 1200.00, category: "Aluguel" },
      { id: "e2", date: new Date().toISOString(), description: "Embalagens", amount: 150.00, category: "Outros" },
    ];

    setState(prev => ({ 
      ...prev,
      products: mockProducts, 
      sales: mockSales, 
      expenses: mockExpenses 
    }));
  };

  if (!currentUser) {
    if (showLogin) {
      return (
        <Login 
          users={state.users} 
          onLogin={setCurrentUser} 
          onBack={() => setShowLogin(false)}
        />
      );
    }
    return (
      <Showcase 
        products={state.products} 
        aboutUs={state.aboutUs}
        silverCare={state.silverCare}
        contacts={state.contacts}
        onAdminAccess={() => setShowLogin(true)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#141414] font-sans">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full bg-white border-b border-[#e5e5e5] z-50 h-20">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <B2BLogo className="w-10 h-10" showShadow />
              <div className="hidden sm:block">
                <h1 className="text-lg font-black tracking-tight leading-none text-gray-900">B2B Pratas</h1>
                <span className="text-[10px] text-gray-500 font-medium italic block mt-0.5">Negócio que prospera</span>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {MENU_ITEMS.filter(item => hasPermission(item.id)).map(item => (
                <div 
                  key={item.id} 
                  className="relative group"
                  onMouseEnter={() => setOpenDropdown(item.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button 
                    onClick={() => !item.subItems && handleTabChange(item.id, "overview")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                      activeTab === item.id 
                        ? "bg-[#141414] text-white" 
                        : "text-[#4a4a4a] hover:bg-[#f5f5f5]"
                    )}
                  >
                    {item.icon}
                    {item.label}
                    {item.subItems && (
                      <ChevronRight size={14} className={cn("transition-transform", openDropdown === item.id ? "rotate-90" : "")} />
                    )}
                  </button>

                  {item.subItems && openDropdown === item.id && (
                    <div className="absolute top-full left-0 pt-2 w-56 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e5e5] overflow-hidden py-2">
                        {item.subItems.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => handleTabChange(item.id, sub.id)}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors",
                              activeTab === item.id && activeSubTab === sub.id
                                ? "bg-[#f5f5f5] text-black font-bold"
                                : "text-[#4a4a4a] hover:bg-[#f5f5f5]"
                            )}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#f5f5f5] rounded-2xl border border-[#e5e5e5]">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#141414] border border-[#e5e5e5]">
                <UserIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate leading-tight">{currentUser.email}</p>
                <p className="text-[9px] text-[#9e9e9e] uppercase font-bold leading-tight">{currentRole?.name}</p>
              </div>
              <button onClick={handleLogout} className="text-[#9e9e9e] hover:text-red-500 transition-colors ml-2">
                <LogOut size={16} />
              </button>
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-[#f5f5f5] rounded-xl text-[#141414]"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Plus size={24} className="rotate-45" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-[#e5e5e5] shadow-2xl animate-in slide-in-from-top-4 duration-300 overflow-y-auto max-h-[calc(100vh-80px)]">
            <div className="p-4 space-y-6">
              {MENU_ITEMS.filter(item => hasPermission(item.id)).map(item => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-2 text-[#9e9e9e] text-[10px] font-bold uppercase tracking-widest">
                    {item.icon}
                    {item.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1 pl-4">
                    {item.subItems ? (
                      item.subItems.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => handleTabChange(item.id, sub.id)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                            activeTab === item.id && activeSubTab === sub.id
                              ? "bg-[#141414] text-white font-bold"
                              : "bg-[#f5f5f5] text-[#4a4a4a]"
                          )}
                        >
                          {sub.label}
                        </button>
                      ))
                    ) : (
                      <button
                        onClick={() => handleTabChange(item.id, "overview")}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                          activeTab === item.id
                            ? "bg-[#141414] text-white font-bold"
                            : "bg-[#f5f5f5] text-[#4a4a4a]"
                        )}
                      >
                        Acessar {item.label}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-[#f5f5f5]">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold bg-red-50 rounded-2xl"
                >
                  <LogOut size={20} />
                  Sair do Sistema
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
        {activeTab === "dashboard" && hasPermission("dashboard") && <Dashboard state={state} />}
        {activeTab === "inventory" && hasPermission("inventory") && (
          activeSubTab === "materials" ? (
            <MaterialsSample products={state.products} />
          ) : (
            <Inventory 
              products={state.products} 
              categories={state.productCategories}
              onAdd={addProduct} 
              onUpdate={updateProduct} 
              onDelete={deleteProduct}
              initialView={activeSubTab === "add" ? "form" : "list"}
            />
          )
        )}
        {activeTab === "sales" && hasPermission("sales") && (
          <Sales 
            sales={state.sales} 
            products={state.products} 
            sellers={state.sellers}
            onAdd={addSale} 
            onDelete={deleteSale}
            initialView={activeSubTab === "new" ? "form" : "list"}
            creditFee={state.creditFee}
            debitFee={state.debitFee}
          />
        )}
        {activeTab === "expenses" && hasPermission("expenses") && (
          <Expenses 
            expenses={state.expenses} 
            categories={state.expenseCategories}
            sales={state.sales}
            sellers={state.sellers}
            onAdd={addExpense} 
            onDelete={deleteExpense}
            onUpdateSellers={(sellers) => setState(prev => ({ ...prev, sellers }))}
            initialView={activeSubTab === "new" ? "form" : "list"}
            activeSubTab={activeSubTab}
            onSubTabChange={(sub) => setActiveSubTab(sub)}
          />
        )}
        {activeTab === "settings" && hasPermission("settings") && (
          <Settings 
            state={state} 
            onUpdateRoles={(roles) => setState(prev => ({ ...prev, roles }))}
            onUpdateUsers={(users) => setState(prev => ({ ...prev, users }))}
            onUpdateExpenseCategories={(categories) => setState(prev => ({ ...prev, expenseCategories: categories }))}
            onUpdateProductCategories={(categories) => setState(prev => ({ ...prev, productCategories: categories }))}
            onUpdateFees={updateFees}
            onUpdateProducts={(products) => setState(prev => ({ ...prev, products }))}
            onUpdateAboutUs={(aboutUs) => setState(prev => ({ ...prev, aboutUs }))}
            onUpdateSilverCare={(silverCare) => setState(prev => ({ ...prev, silverCare }))}
            onUpdateContacts={(contacts) => setState(prev => ({ ...prev, contacts }))}
            activeSection={activeSubTab}
          />
        )}
      </main>

      <AdminAssistant activeTab={activeTab} activeSubTab={activeSubTab} />
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, key?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
        active 
          ? "bg-[#141414] text-white shadow-lg shadow-black/10" 
          : "text-[#4a4a4a] hover:bg-[#f5f5f5]"
      )}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );
}

// --- Dashboard Component ---
function Dashboard({ state }: { state: AppState }) {
  const currentMonth = new Date();
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);

  const monthlySales = state.sales.filter(s => isWithinInterval(parseISO(s.date), { start, end }));
  const monthlyExpenses = state.expenses.filter(e => isWithinInterval(parseISO(e.date), { start, end }));

  const totalRevenue = monthlySales.reduce((acc, s) => acc + (s.netAmount ?? s.total), 0);
  const totalExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;

  const lowStockCount = state.products.filter(p => p.stock < 5).length;

  // Chart data
  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      
      const revenue = state.sales
        .filter(s => isWithinInterval(parseISO(s.date), { start: mStart, end: mEnd }))
        .reduce((acc, s) => acc + (s.netAmount ?? s.total), 0);
        
      const expenses = state.expenses
        .filter(e => isWithinInterval(parseISO(e.date), { start: mStart, end: mEnd }))
        .reduce((acc, e) => acc + e.amount, 0);

      return {
        name: format(d, "MMM", { locale: ptBR }),
        receita: revenue,
        despesas: expenses,
        lucro: revenue - expenses
      };
    });
    return last6Months;
  }, [state.sales, state.expenses]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.products.forEach(p => {
      const cat = p.category || "Outros";
      counts[cat] = (counts[cat] || 0) + p.stock;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state.products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
        <p className="text-[#9e9e9e]">Visão geral do seu negócio em {format(currentMonth, "MMMM yyyy", { locale: ptBR })}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita Mensal" 
          value={formatCurrency(totalRevenue)} 
          icon={<DollarSign className="text-green-600" />} 
          trend={12}
        />
        <StatCard 
          title="Despesas Mensais" 
          value={formatCurrency(totalExpenses)} 
          icon={<TrendingDown className="text-red-500" />} 
          trend={-5}
        />
        <StatCard 
          title="Lucro Líquido" 
          value={formatCurrency(totalProfit)} 
          icon={<ArrowUpRight className="text-blue-500" />} 
          trend={8}
        />
        <StatCard 
          title="Estoque Baixo" 
          value={lowStockCount.toString()} 
          icon={<AlertCircle className="text-orange-500" />} 
          subtitle="Produtos com menos de 5 un."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-[#e5e5e5]">
          <h3 className="text-lg font-bold mb-6">Desempenho Financeiro (6 Meses)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9e9e9e', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9e9e9e', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f5f5f5' }}
                />
                <Bar dataKey="receita" fill="#141414" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="#d1d1d1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#e5e5e5]">
          <h3 className="text-lg font-bold mb-6">Distribuição de Estoque</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[#4a4a4a]">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, subtitle }: { title: string, value: string, icon: React.ReactNode, trend?: number, subtitle?: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#e5e5e5]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#9e9e9e]">{title}</p>
          <h4 className="text-2xl font-bold mt-1">{value}</h4>
        </div>
        <div className="p-3 bg-[#f5f5f5] rounded-2xl">
          {icon}
        </div>
      </div>
      {(trend !== undefined || subtitle) && (
        <div className="mt-4 flex items-center gap-2">
          {trend !== undefined && (
            <span className={cn(
              "text-xs font-bold flex items-center px-2 py-1 rounded-full",
              trend > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            )}>
              {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
          <span className="text-xs text-[#9e9e9e]">{subtitle || "vs. mês anterior"}</span>
        </div>
      )}
    </div>
  );
}

// --- Inventory Component ---
function MaterialsSample({ products = [] }: { products: Product[] }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-4xl font-bold tracking-tighter">Amostra de Materiais</h2>
        <p className="text-[#9e9e9e] mt-1 font-medium">Visualização detalhada de custos e estoque para análise interna</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fcfcfc] border-y border-[#f5f5f5]">
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Custo Unitário</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Valor Total (Custo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#9e9e9e]">Nenhum produto cadastrado.</td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-[#fcfcfc] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-[#f5f5f5] rounded-lg flex items-center justify-center text-[#9e9e9e]">
                            <Package size={20} />
                          </div>
                        )}
                        <span className="text-sm font-bold">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold px-3 py-1 bg-[#f5f5f5] rounded-full text-[#4a4a4a]">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{formatCurrency(product.costPerUnit)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-bold",
                        product.stock < 5 ? "text-red-500" : "text-[#141414]"
                      )}>
                        {product.stock} un
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      {formatCurrency(product.costPerUnit * product.stock)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {products.length > 0 && (
              <tfoot>
                <tr className="bg-[#fcfcfc] font-bold">
                  <td colSpan={4} className="px-6 py-4 text-right text-sm uppercase tracking-wider text-[#9e9e9e]">Total em Estoque (Custo):</td>
                  <td className="px-6 py-4 text-lg">
                    {formatCurrency(products.reduce((acc, p) => acc + (p.costPerUnit * p.stock), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function Inventory({ products, categories, onAdd, onUpdate, onDelete, initialView }: { products: Product[], categories: string[], onAdd: (p: Product) => void, onUpdate: (p: Product) => void, onDelete: (id: string) => void, initialView?: "list" | "form" }) {
  const [isAdding, setIsAdding] = useState(initialView === "form");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (initialView === "form") setIsAdding(true);
    if (initialView === "list") setIsAdding(false);
  }, [initialView]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estoque</h2>
          <p className="text-[#9e9e9e]">Gerencie seus produtos e níveis de estoque</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-[#e5e5e5] overflow-hidden">
        <div className="p-6 border-bottom border-[#f5f5f5] flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e9e9e]" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou categoria..." 
              className="w-full pl-12 pr-4 py-3 bg-[#f5f5f5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fcfcfc] border-y border-[#f5f5f5]">
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Custo/Un</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Venda/Un</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#9e9e9e]">Nenhum produto encontrado.</td>
                </tr>
              ) : (
                filtered.map(product => (
                  <tr key={product.id} className="hover:bg-[#fcfcfc] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#9e9e9e]">
                          <Package size={20} />
                        </div>
                        <span className="font-bold text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-[#f5f5f5] rounded-full text-xs font-bold text-[#4a4a4a]">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4a4a4a]">{formatCurrency(product.costPerUnit)}</td>
                    <td className="px-6 py-4 font-bold text-sm">{formatCurrency(product.sellingPricePerUnit)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold text-sm",
                          product.stock < 5 ? "text-red-500" : "text-black"
                        )}>
                          {product.stock}
                        </span>
                        {product.stock < 5 && <AlertCircle size={14} className="text-red-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingId(product.id)}
                          className="p-2 text-[#4a4a4a] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => onDelete(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isAdding || editingId) && (
        <ProductModal 
          product={editingId ? products.find(p => p.id === editingId) : undefined}
          categories={categories}
          onClose={() => { setIsAdding(false); setEditingId(null); }}
          onSave={(p) => {
            if (editingId) onUpdate(p);
            else onAdd({ ...p, id: Math.random().toString(36).substr(2, 9) });
            setIsAdding(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSave }: { product?: Product, categories: string[], onClose: () => void, onSave: (p: Product) => void }) {
  const [formData, setFormData] = useState<Partial<Product>>(product || {
    name: "",
    category: categories[0] || "Anel",
    sellingPricePerUnit: 0,
    costPerUnit: 0,
    stock: 1,
    imageUrl: "",
    description: "",
    material: "Prata de Lei 925 Legítima",
    finish: "Polimento Espelhado de Alta Precisão",
    dimensions: "",
    weight: "",
    stone: "Sem pedras (Lisa)",
    hypoallergenic: "Sim (100% Livre de Níquel e Chumbo)",
    packaging: "Saquinho de Veludo + Certificado de Autenticidade",
    warranty: "Garantia Vitalícia da Autenticidade da Prata 925",
    discountPercentage: 0,
    discountStart: "",
    discountEnd: "",
    isSet: false,
    components: []
  });

  const [newComponent, setNewComponent] = useState({ name: "", costPerUnit: 0, sellingPricePerUnit: 0, quantity: 1 });

  const isJogo = formData.category === "Jogo";

  const addComponent = () => {
    if (!newComponent.name.trim()) return;
    const components = [...(formData.components || []), { ...newComponent, id: Math.random().toString(36).substr(2, 9) }];
    
    // Auto-calculate total cost and price if it's a set
    const totalCost = components.reduce((acc, c) => acc + c.costPerUnit * c.quantity, 0);
    const totalPrice = components.reduce((acc, c) => acc + c.sellingPricePerUnit * c.quantity, 0);

    setFormData({ 
      ...formData, 
      components,
      costPerUnit: totalCost,
      sellingPricePerUnit: totalPrice
    });
    setNewComponent({ name: "", costPerUnit: 0, sellingPricePerUnit: 0, quantity: 1 });
  };

  const removeComponent = (id: string) => {
    const components = (formData.components || []).filter(c => c.id !== id);
    const totalCost = components.reduce((acc, c) => acc + c.costPerUnit * c.quantity, 0);
    const totalPrice = components.reduce((acc, c) => acc + c.sellingPricePerUnit * c.quantity, 0);
    
    setFormData({ 
      ...formData, 
      components,
      costPerUnit: totalCost,
      sellingPricePerUnit: totalPrice
    });
  };

  const selling = formData.sellingPricePerUnit || 0;
  const cost = formData.costPerUnit || 0;
  const unitProfit = selling - cost;
  const grossMargin = selling > 0 ? ((unitProfit / selling) * 100).toFixed(1) : "0";
  const discount = formData.discountPercentage || 0;
  const discountedPrice = discount > 0 ? selling * (1 - discount / 100) : selling;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-[#f0f0f0] flex items-center justify-between shrink-0 bg-[#fafafa]">
          <div>
            <h3 className="text-xl font-black text-[#141414] tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              {product ? "Editar Joia / Produto" : "Cadastrar Nova Joia"}
            </h3>
            <p className="text-xs text-[#9e9e9e] font-medium mt-0.5">
              Todos os campos preenchidos aqui alimentam o estoque e o detalhamento completo da vitrine
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <form 
          className="p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1" 
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ ...formData, isSet: isJogo } as Product);
          }}
        >
          {/* SECTION 1: DADOS PRINCIPAIS E APRESENTAÇÃO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Package size={16} className="text-gray-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">1. Identificação e Apresentação da Joia</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Nome da Peça *</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ex: Anel Solitário Prata 925 Cravejado"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.name || ""}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Categoria *</label>
                <select 
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.category || categories[0] || "Anel"}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Image URL & Live Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>Foto da Joia (URL da Imagem)</span>
                <span className="text-[11px] text-gray-400 font-normal">Link direto para imagem (JPG, PNG, WebP)</span>
              </label>
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f5f5] border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon size={22} className="text-gray-400" />
                  )}
                </div>
                <input 
                  type="url" 
                  placeholder="https://exemplo.com/foto-joia.jpg"
                  className="flex-1 px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.imageUrl || ""}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>Descrição Completa e História da Peça</span>
                <span className="text-[11px] text-gray-400 font-normal">Exibido na vitrine pública</span>
              </label>
              <textarea 
                rows={3}
                placeholder="Descreva a elegância, o design, acabamento e inspirações desta joia. Conte ao cliente o que a torna tão especial..."
                className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all resize-none"
                value={formData.description || ""}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 2: ESTOQUE E PRECIFICAÇÃO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <DollarSign size={16} className="text-gray-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">2. Estoque e Precificação</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Estoque Disponível *</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all font-bold"
                  value={formData.stock ?? 0}
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Custo Unitário (R$) *</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  min="0"
                  readOnly={isJogo}
                  className={cn(
                    "w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all font-bold",
                    isJogo && "opacity-60 cursor-not-allowed"
                  )}
                  value={formData.costPerUnit || ""}
                  onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Preço de Venda (R$) *</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  min="0"
                  readOnly={isJogo}
                  className={cn(
                    "w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all font-bold",
                    isJogo && "opacity-60 cursor-not-allowed"
                  )}
                  value={formData.sellingPricePerUnit || ""}
                  onChange={e => setFormData({ ...formData, sellingPricePerUnit: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Profit summary card */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500">Lucro Bruto Unitário:</span>
                <span className={cn("font-black text-sm", unitProfit >= 0 ? "text-emerald-700" : "text-red-600")}>
                  {formatCurrency(unitProfit)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500">Margem Bruta:</span>
                <span className="font-black text-sm text-gray-900 bg-white px-2.5 py-1 rounded-xl border border-gray-200">
                  {grossMargin}%
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: DESCONTO & PROMOÇÃO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Percent size={16} className="text-gray-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">3. Promoção e Desconto na Vitrine</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Desconto Vitrine (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    max="99"
                    placeholder="0"
                    className="w-full pl-4 pr-9 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all font-bold"
                    value={formData.discountPercentage || ""}
                    onChange={e => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Início da Promoção</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all font-medium"
                  value={formData.discountStart || ""}
                  onChange={e => setFormData({ ...formData, discountStart: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Fim da Promoção</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all font-medium"
                  value={formData.discountEnd || ""}
                  onChange={e => setFormData({ ...formData, discountEnd: e.target.value })}
                />
              </div>
            </div>

            {discount > 0 && (
              <div className="p-3.5 bg-red-50/70 border border-red-200/60 rounded-2xl flex items-center justify-between text-xs text-red-950">
                <span className="font-semibold">
                  Exibição na Vitrine: De <span className="line-through font-bold text-red-700">{formatCurrency(selling)}</span> por <span className="text-base font-black text-red-900">{formatCurrency(discountedPrice)}</span>
                </span>
                <span className="bg-red-500 text-white font-bold px-2.5 py-1 rounded-lg text-[11px]">
                  -{discount}% OFF
                </span>
              </div>
            )}
          </div>

          {/* SECTION 4: ESPECIFICAÇÕES TÉCNICAS DA JOIA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <ShieldCheck size={16} className="text-gray-700" />
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800">4. Ficha Técnica da Joia (Detalhamento Completo)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-gray-500" /> Metal / Material
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Prata de Lei 925 Legítima"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.material || ""}
                  onChange={e => setFormData({ ...formData, material: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-gray-500" /> Acabamento
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Polimento Espelhado / Banho de Ródio"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.finish || ""}
                  onChange={e => setFormData({ ...formData, finish: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Ruler size={13} className="text-gray-500" /> Dimensões / Tamanho
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Aro 17 / Corrente 45cm + 5cm / 25mm"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.dimensions || ""}
                  onChange={e => setFormData({ ...formData, dimensions: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Scale size={13} className="text-gray-500" /> Peso Aproximado
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: 3.5g / 14.8g"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.weight || ""}
                  onChange={e => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Gem size={13} className="text-gray-500" /> Pedras / Gemas / Cravação
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Zircônia Cúbica Cravejada 5A / Sem pedras (Lisa)"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.stone || ""}
                  onChange={e => setFormData({ ...formData, stone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-gray-500" /> Certificação Hipoalergênica
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Sim (100% Livre de Níquel e Chumbo)"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.hypoallergenic || ""}
                  onChange={e => setFormData({ ...formData, hypoallergenic: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Gift size={13} className="text-gray-500" /> Embalagem Inclusa
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Saquinho de Veludo + Certificado de Autenticidade"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.packaging || ""}
                  onChange={e => setFormData({ ...formData, packaging: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-gray-500" /> Termo de Garantia
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Garantia Vitalícia da Autenticidade da Prata 925"
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-gray-200/80 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-black/10 outline-none transition-all"
                  value={formData.warranty || ""}
                  onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: COMPONENTES DO JOGO (SE FOR CONJUNTO / JOGO) */}
          {isJogo && (
            <div className="space-y-4 p-6 bg-amber-50/40 border border-amber-200/60 rounded-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-amber-950">Componentes do Jogo / Conjunto</h4>
                  <p className="text-[11px] text-amber-800 font-medium">Os custos e preços unitários do conjunto são calculados pela soma dos itens</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {formData.components?.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3.5 bg-white border border-amber-100 rounded-2xl shadow-sm">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-900">{c.name} <span className="text-amber-700 font-semibold ml-1">({c.quantity}x)</span></p>
                      <p className="text-[11px] text-gray-500">Custo: {formatCurrency(c.costPerUnit)} | Venda: {formatCurrency(c.sellingPricePerUnit)}</p>
                    </div>
                    <button type="button" onClick={() => removeComponent(c.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <input 
                  placeholder="Nome do Item (ex: Colar)"
                  className="col-span-2 sm:col-span-4 px-3.5 py-2.5 bg-white border border-amber-200/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={newComponent.name}
                  onChange={e => setNewComponent({ ...newComponent, name: e.target.value })}
                />
                <input 
                  type="number"
                  placeholder="Custo Un."
                  className="px-3.5 py-2.5 bg-white border border-amber-200/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={newComponent.costPerUnit || ""}
                  onChange={e => setNewComponent({ ...newComponent, costPerUnit: parseFloat(e.target.value) || 0 })}
                />
                <input 
                  type="number"
                  placeholder="Venda Un."
                  className="px-3.5 py-2.5 bg-white border border-amber-200/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={newComponent.sellingPricePerUnit || ""}
                  onChange={e => setNewComponent({ ...newComponent, sellingPricePerUnit: parseFloat(e.target.value) || 0 })}
                />
                <input 
                  type="number"
                  min="1"
                  placeholder="Qtd"
                  className="px-3.5 py-2.5 bg-white border border-amber-200/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={newComponent.quantity}
                  onChange={e => setNewComponent({ ...newComponent, quantity: parseInt(e.target.value) || 1 })}
                />
                <button 
                  type="button"
                  onClick={addComponent}
                  className="py-2.5 bg-[#141414] text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                >
                  + Adicionar Item
                </button>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="pt-4 flex gap-4 shrink-0 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-sm font-bold border border-[#e5e5e5] rounded-2xl hover:bg-[#f5f5f5] transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 text-sm font-bold bg-[#141414] text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Salvar Produto na Vitrine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Sales Component ---
function Sales({ sales, products, sellers = [], onAdd, onDelete, initialView, creditFee, debitFee }: { 
  sales: Sale[], 
  products: Product[], 
  sellers?: Seller[],
  onAdd: (s: Sale) => void, 
  onDelete: (id: string) => void, 
  initialView?: "list" | "form",
  creditFee: number,
  debitFee: number
}) {
  const [isAdding, setIsAdding] = useState(initialView === "form");

  useEffect(() => {
    if (initialView === "form") setIsAdding(true);
    if (initialView === "list") setIsAdding(false);
  }, [initialView]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vendas</h2>
          <p className="text-[#9e9e9e]">Registre novas vendas com identificação de vendedor e acompanhe o histórico</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10"
        >
          <Plus size={20} />
          Nova Venda
        </button>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fcfcfc] border-y border-[#f5f5f5]">
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Itens</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#9e9e9e]">Nenhuma venda registrada.</td>
                </tr>
              ) : (
                [...sales].reverse().map(sale => (
                  <tr key={sale.id} className="hover:bg-[#fcfcfc] transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">
                      {format(parseISO(sale.date), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center">
                          {(sale.seller || "L").charAt(0)}
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          {sale.seller || "Loja / Geral"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {sale.items.map((item, i) => (
                          <p key={i} className="text-xs text-[#4a4a4a]">
                            <span className="font-bold">{item.quantity}x</span> {item.nameAtSale}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#4a4a4a]">
                        {(sale.paymentMethod === "Crédito" || sale.paymentMethod === "Débito" || sale.paymentMethod === "Cartão") && <CreditCard size={14} />}
                        {sale.paymentMethod === "Pix" && <QrCode size={14} />}
                        {sale.paymentMethod === "Dinheiro" && <Banknote size={14} />}
                        {sale.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm">{formatCurrency(sale.total)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDelete(sale.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <SaleModal 
          products={products}
          sellers={sellers}
          creditFee={creditFee}
          debitFee={debitFee}
          onClose={() => setIsAdding(false)}
          onSave={(s) => {
            onAdd({ ...s, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() });
            setIsAdding(false);
          }}
        />
      )}
    </div>
  );
}

function SaleModal({ products, sellers = [], creditFee, debitFee, onClose, onSave }: { 
  products: Product[], 
  sellers?: Seller[],
  creditFee: number, 
  debitFee: number, 
  onClose: () => void, 
  onSave: (s: Sale) => void 
}) {
  const [cart, setCart] = useState<{ productId: string, quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<Sale["paymentMethod"]>("Pix");
  const [selectedSeller, setSelectedSeller] = useState<string>(
    sellers.length > 0 ? sellers[0].name : "Loja / Geral"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return acc + (p?.sellingPricePerUnit || 0) * item.quantity;
    }, 0);
  }, [cart, products]);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        {/* Product Selection */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-[#f5f5f5]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Selecionar Produtos</h3>
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" size={14} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full pl-9 pr-3 py-2 bg-[#f5f5f5] rounded-xl text-xs outline-none" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(p => (
              <button 
                key={p.id}
                disabled={p.stock <= 0}
                onClick={() => addToCart(p.id)}
                className="p-4 bg-[#fcfcfc] border border-[#f5f5f5] rounded-2xl text-left hover:border-black transition-all disabled:opacity-50 group"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-[#9e9e9e] uppercase">{p.category}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", p.stock < 5 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                    {p.stock} em estoque
                  </span>
                </div>
                <h4 className="font-bold text-sm mt-1">{p.name}</h4>
                <p className="text-sm font-bold mt-2">{formatCurrency(p.sellingPricePerUnit)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="w-full md:w-80 bg-[#fcfcfc] p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Carrinho</h3>
            <button onClick={onClose} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto mb-8">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-[#9e9e9e]">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">Carrinho vazio</p>
              </div>
            ) : (
              cart.map(item => {
                const p = products.find(prod => prod.id === item.productId);
                return (
                  <div key={item.productId} className="flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-bold">{p?.name}</p>
                      <p className="text-xs text-[#9e9e9e]">{item.quantity}x {formatCurrency(p?.sellingPricePerUnit || 0)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-4 border-t border-[#f5f5f5] pt-6">
            {/* Vendedor Responsável */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider flex items-center justify-between">
                <span>Vendedor Responsável</span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  comissão vinculada
                </span>
              </label>
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-black transition-all shadow-sm"
              >
                {sellers.filter(s => s.active !== false).map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.commissionRate}%)
                  </option>
                ))}
                <option value="Loja / Geral">Loja / Geral (Sem comissão direta)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button 
                    key={m}
                    onClick={() => setPaymentMethod(m as any)}
                    className={cn(
                      "py-2 text-[10px] font-bold rounded-xl border transition-all",
                      paymentMethod === m ? "bg-[#141414] text-white border-black" : "bg-white border-[#e5e5e5] text-[#4a4a4a]"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#9e9e9e]">Subtotal</span>
                <span className="text-sm font-bold">{formatCurrency(total)}</span>
              </div>
              {(paymentMethod === "Crédito" || paymentMethod === "Débito") && (
                <div className="flex items-center justify-between text-red-500">
                  <span className="text-xs font-medium">Taxa ({paymentMethod === "Crédito" ? creditFee : debitFee}%)</span>
                  <span className="text-sm font-bold">-{formatCurrency(total * ((paymentMethod === "Crédito" ? creditFee : debitFee) / 100))}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-[#f5f5f5]">
                <span className="text-sm font-bold">Total Líquido</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(total - (
                    paymentMethod === "Crédito" ? total * (creditFee / 100) : 
                    paymentMethod === "Débito" ? total * (debitFee / 100) : 0
                  ))}
                </span>
              </div>
            </div>

            <button 
              disabled={cart.length === 0}
              onClick={() => {
                const fee = paymentMethod === "Crédito" ? total * (creditFee / 100) : 
                            paymentMethod === "Débito" ? total * (debitFee / 100) : 0;
                onSave({
                  id: "",
                  date: "",
                  total,
                  paymentMethod,
                  feeAmount: fee,
                  netAmount: total - fee,
                  seller: selectedSeller || "Loja / Geral",
                  items: cart.map(item => {
                    const p = products.find(prod => prod.id === item.productId)!;
                    return {
                      productId: item.productId,
                      quantity: item.quantity,
                      priceAtSale: p.sellingPricePerUnit,
                      nameAtSale: p.name
                    };
                  })
                });
              }}
              className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-black/10"
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Expenses Component ---
function Expenses({ 
  expenses, 
  categories, 
  sales = [],
  sellers = [],
  onAdd, 
  onDelete, 
  onUpdateSellers,
  initialView,
  activeSubTab = "history",
  onSubTabChange
}: { 
  expenses: Expense[], 
  categories: string[], 
  sales?: Sale[],
  sellers?: Seller[],
  onAdd: (e: Expense) => void, 
  onDelete: (id: string) => void, 
  onUpdateSellers?: (sellers: Seller[]) => void,
  initialView?: "list" | "form",
  activeSubTab?: string,
  onSubTabChange?: (tab: string) => void
}) {
  const [currentTab, setCurrentTab] = useState<"history" | "commissions">(
    activeSubTab === "commissions" ? "commissions" : "history"
  );
  const [isAdding, setIsAdding] = useState(initialView === "form");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (activeSubTab === "commissions") {
      setCurrentTab("commissions");
    } else if (activeSubTab === "history") {
      setCurrentTab("history");
    } else if (activeSubTab === "new") {
      setCurrentTab("history");
      setIsAdding(true);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: "history" | "commissions") => {
    setCurrentTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchCat = categoryFilter === "all" || e.category === categoryFilter;
      const matchSearch = !searchQuery.trim() || 
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const totalFilteredExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Despesas & Comissões</h2>
          <p className="text-[#9e9e9e]">Controle seus custos operacionais, fornecedores e comissões da equipe de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10"
          >
            <Plus size={20} />
            Nova Despesa
          </button>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 border-b border-[#e5e5e5] pb-4">
        <button
          onClick={() => handleTabSwitch("history")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all",
            currentTab === "history"
              ? "bg-black text-white shadow-md shadow-black/10"
              : "bg-white text-[#4a4a4a] border border-[#e5e5e5] hover:bg-[#f5f5f5]"
          )}
        >
          <TrendingDown size={16} />
          Histórico de Despesas
        </button>

        <button
          onClick={() => handleTabSwitch("commissions")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all relative",
            currentTab === "commissions"
              ? "bg-black text-white shadow-md shadow-black/10"
              : "bg-white text-[#4a4a4a] border border-[#e5e5e5] hover:bg-[#f5f5f5]"
          )}
        >
          <Award size={16} />
          Comissões de Vendedores
          <span className={cn(
            "ml-1 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase",
            currentTab === "commissions" ? "bg-white text-black" : "bg-black text-white"
          )}>
            Novo
          </span>
        </button>
      </div>

      {currentTab === "commissions" ? (
        <SellerCommissions 
          sales={sales}
          expenses={expenses}
          sellers={sellers}
          onAddExpense={onAdd}
          onUpdateSellers={onUpdateSellers || (() => {})}
        />
      ) : (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" size={14} />
              <input 
                type="text" 
                placeholder="Buscar despesa..." 
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#e5e5e5] rounded-2xl text-xs outline-none focus:border-black transition-all shadow-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  categoryFilter === "all" ? "bg-black text-white" : "bg-[#f5f5f5] text-[#4a4a4a] hover:bg-gray-200"
                )}
              >
                Todas ({expenses.length})
              </button>
              {categories.map(cat => {
                const count = expenses.filter(e => e.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                      categoryFilter === cat ? "bg-black text-white" : "bg-[#f5f5f5] text-[#4a4a4a] hover:bg-gray-200"
                    )}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-[#e5e5e5] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#fcfcfc] border-y border-[#f5f5f5]">
                    <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f5]">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#9e9e9e]">Nenhuma despesa encontrada.</td>
                    </tr>
                  ) : (
                    [...filteredExpenses].reverse().map(expense => (
                      <tr key={expense.id} className="hover:bg-[#fcfcfc] transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium">
                          {format(parseISO(expense.date), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{expense.description}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1",
                            expense.category === "Comissões"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-[#f5f5f5] text-[#4a4a4a]"
                          )}>
                            {expense.category === "Comissões" && <Award size={12} />}
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-red-500">-{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => onDelete(expense.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir despesa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredExpenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50/80 font-bold border-t border-[#f5f5f5]">
                      <td colSpan={3} className="px-6 py-3.5 text-xs text-gray-500 uppercase tracking-wider">
                        Total das despesas ({filteredExpenses.length} itens)
                      </td>
                      <td className="px-6 py-3.5 text-sm text-red-600 font-black">
                        -{formatCurrency(totalFilteredExpenses)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <ExpenseModal 
          onClose={() => setIsAdding(false)}
          categories={categories}
          onSave={(e) => {
            onAdd({ ...e, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() });
            setIsAdding(false);
          }}
        />
      )}
    </div>
  );
}

function Login({ users, onLogin, onBack }: { users: User[], onLogin: (u: User) => void, onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError("Usuário ou senha incorretos");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-12">
          <div className="flex flex-col items-center mb-6 text-center">
            <B2BLogo className="w-28 h-28 mb-3" showShadow />
            <h1 className="text-3xl font-black tracking-tight text-gray-900">B2B Pratas</h1>
            <p className="text-xs text-gray-500 font-semibold italic mt-0.5">
              Negócio que prospera
            </p>
            <p className="text-[11px] text-[#9e9e9e] mt-2 font-bold uppercase tracking-widest">
              Acesso Administrativo
            </p>
          </div>

          {/* Presentation System Notice */}
          <div className="mb-8 p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl text-amber-950 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-amber-600 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-wider text-amber-900">Sistema de Apresentação • Portfólio</p>
            </div>
            <p className="text-xs leading-relaxed text-amber-900 font-medium mb-3">
              Esta é uma versão demonstrativa para apresentação de portfólio. Para acessar o painel administrativo completo, utilize as credenciais de teste:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white/90 rounded-xl border border-amber-200 text-xs">
              <div className="flex items-center gap-3">
                <span><strong>Login:</strong> <code className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">teste</code></span>
                <span><strong>Senha:</strong> <code className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">teste</code></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail("teste");
                  setPassword("teste");
                }}
                className="text-[11px] font-bold text-amber-900 hover:text-black underline cursor-pointer"
              >
                Preencher dados
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider ml-1">Login (ou E-mail)</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e9e9e]" size={18} />
                <input 
                  required
                  type="text" 
                  placeholder="Digite 'teste'"
                  className="w-full pl-12 pr-4 py-4 bg-[#f5f5f5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e9e9e]" size={18} />
                <input 
                  required
                  type="password" 
                  placeholder="Digite 'teste'"
                  className="w-full pl-12 pr-4 py-4 bg-[#f5f5f5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-black/20 flex items-center justify-center gap-2 group"
            >
              Entrar no Painel Administrativo
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <button 
            onClick={onBack}
            className="w-full mt-6 py-4 text-[#9e9e9e] hover:text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar para Vitrine Pública
          </button>
          
          <div className="mt-8 pt-6 border-t border-[#f5f5f5]">
            <div className="p-4 bg-[#fcfcfc] rounded-2xl border border-[#f0f0f0] flex flex-col items-center justify-center text-center">
              <p className="text-[10px] text-[#9e9e9e] font-bold uppercase tracking-widest mb-1.5">Acesso de Demonstração</p>
              <div className="flex gap-4 justify-center text-xs">
                <div>
                  <span className="text-[#9e9e9e] font-medium">Login: </span>
                  <span className="font-bold text-[#141414] bg-[#f5f5f5] px-2 py-1 rounded-md">teste</span>
                </div>
                <div>
                  <span className="text-[#9e9e9e] font-medium">Senha: </span>
                  <span className="font-bold text-[#141414] bg-[#f5f5f5] px-2 py-1 rounded-md">teste</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseModal({ onClose, onSave, categories }: { onClose: () => void, onSave: (e: Expense) => void, categories: string[] }) {
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: "",
    category: categories[0] || "Outros",
    amount: 0,
    date: new Date().toISOString().split("T")[0]
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-[#f5f5f5] flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Nova Despesa</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form className="p-8 space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: Math.random().toString(36).substr(2, 9),
            ...formData as Expense
          });
        }}>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest ml-1">Descrição</label>
            <input 
              required
              className="w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest ml-1">Categoria</label>
              <select 
                className="w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest ml-1">Valor</label>
              <input 
                required
                type="number"
                step="0.01"
                className="w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all font-mono"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest ml-1">Data</label>
            <input 
              required
              type="date"
              className="w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-black/10 mt-4"
          >
            Salvar Despesa
          </button>
        </form>
      </div>
    </div>
  );
}

function Settings({ 
  state, 
  onUpdateRoles, 
  onUpdateUsers, 
  onUpdateExpenseCategories, 
  onUpdateProductCategories, 
  onUpdateFees, 
  onUpdateProducts, 
  onUpdateAboutUs,
  onUpdateSilverCare,
  onUpdateContacts,
  activeSection 
}: { 
  state: AppState, 
  onUpdateRoles: (roles: Role[]) => void, 
  onUpdateUsers: (users: User[]) => void,
  onUpdateExpenseCategories: (categories: string[]) => void,
  onUpdateProductCategories: (categories: string[]) => void,
  onUpdateFees: (credit: number, debit: number) => void,
  onUpdateProducts: (products: Product[]) => void,
  onUpdateAboutUs: (text: string) => void,
  onUpdateSilverCare: (text: string) => void,
  onUpdateContacts: (contacts: Contacts) => void,
  activeSection?: string
}) {
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingExpenseCat, setIsAddingExpenseCat] = useState(false);
  const [isAddingProductCat, setIsAddingProductCat] = useState(false);
  
  const usersRef = React.useRef<HTMLDivElement>(null);
  const rolesRef = React.useRef<HTMLDivElement>(null);
  const prodCatRef = React.useRef<HTMLDivElement>(null);
  const expCatRef = React.useRef<HTMLDivElement>(null);
  const feesRef = React.useRef<HTMLDivElement>(null);
  const discountsRef = React.useRef<HTMLDivElement>(null);
  const aboutUsRef = React.useRef<HTMLDivElement>(null);
  const silverCareRef = React.useRef<HTMLDivElement>(null);
  const contactsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSection === "users") usersRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (activeSection === "roles") rolesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (activeSection === "product-categories") prodCatRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (activeSection === "expense-categories") expCatRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (activeSection === "fees") feesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (activeSection === "discounts") discountsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (activeSection === "about-us") aboutUsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (activeSection === "silver-care") silverCareRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (activeSection === "contacts") contactsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSection]);
  
  const [newRoleName, setNewRoleName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRoleId, setNewUserRoleId] = useState("vendedor");
  const [newExpenseCatName, setNewExpenseCatName] = useState("");
  const [newProductCatName, setNewProductCatName] = useState("");
  const [creditFee, setCreditFee] = useState(state.creditFee);
  const [debitFee, setDebitFee] = useState(state.debitFee);

  const togglePermission = (roleId: string, permission: string) => {
    const newRoles = state.roles.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.includes(permission);
        const newPermissions = hasPermission
          ? role.permissions.filter(p => p !== permission)
          : [...role.permissions, permission];
        return { ...role, permissions: newPermissions };
      }
      return role;
    });
    onUpdateRoles(newRoles);
  };

  const updateUserRole = (userId: string, roleId: string) => {
    const newUsers = state.users.map(user => {
      if (user.id === userId) {
        return { ...user, roleId };
      }
      return user;
    });
    onUpdateUsers(newUsers);
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const newRole: Role = {
      id: newRoleName.toLowerCase().replace(/\s+/g, '-'),
      name: newRoleName,
      permissions: ["dashboard"]
    };
    onUpdateRoles([...state.roles, newRole]);
    setNewRoleName("");
    setIsAddingRole(false);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim()) return;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: newUserEmail,
      password: newUserPassword,
      roleId: newUserRoleId
    };
    onUpdateUsers([...state.users, newUser]);
    setNewUserEmail("");
    setNewUserPassword("");
    setIsAddingUser(false);
  };

  const handleAddExpenseCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseCatName.trim()) return;
    if (state.expenseCategories.includes(newExpenseCatName)) return;
    onUpdateExpenseCategories([...state.expenseCategories, newExpenseCatName]);
    setNewExpenseCatName("");
    setIsAddingExpenseCat(false);
  };

  const handleAddProductCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductCatName.trim()) return;
    if (state.productCategories.includes(newProductCatName)) return;
    onUpdateProductCategories([...state.productCategories, newProductCatName]);
    setNewProductCatName("");
    setIsAddingProductCat(false);
  };

  const removeExpenseCat = (cat: string) => {
    onUpdateExpenseCategories(state.expenseCategories.filter(c => c !== cat));
  };

  const removeProductCat = (cat: string) => {
    onUpdateProductCategories(state.productCategories.filter(c => c !== cat));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter">Configurações</h2>
          <p className="text-[#9e9e9e] mt-1 font-medium">Gestão de acessos, usuários e categorias</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roles Management */}
        <div ref={rolesRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "roles" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Níveis de Acesso</h3>
                <p className="text-xs text-[#9e9e9e] font-medium">Defina o que cada cargo pode visualizar</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAddingRole(true)}
              className="p-2 bg-[#141414] text-white rounded-xl hover:bg-black transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          {isAddingRole && (
            <form onSubmit={handleAddRole} className="mb-8 p-6 bg-[#f5f5f5] rounded-2xl space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider">Novo Nível</h4>
                <button type="button" onClick={() => setIsAddingRole(false)} className="text-[#9e9e9e] hover:text-black">
                  <X size={16} />
                </button>
              </div>
              <input 
                autoFocus
                required
                placeholder="Nome do Nível (ex: Gerente)"
                className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
              />
              <button type="submit" className="w-full py-3 bg-[#141414] text-white rounded-xl font-bold text-sm">
                Criar Nível
              </button>
            </form>
          )}

          <div className="space-y-6">
            {state.roles.map(role => (
              <div key={role.id} className="p-6 bg-[#f5f5f5] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm uppercase tracking-wider">{role.name}</h4>
                  <span className="text-[10px] bg-white px-2 py-1 rounded-md border border-[#e5e5e5] font-bold text-[#9e9e9e]">
                    {role.permissions.length} PERMISSÕES
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {MENU_ITEMS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => togglePermission(role.id, item.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border",
                        role.permissions.includes(item.id)
                          ? "bg-[#141414] text-white border-transparent shadow-md shadow-black/10"
                          : "bg-white text-[#9e9e9e] border-[#e5e5e5] hover:border-[#141414] hover:text-[#141414]"
                      )}
                    >
                      {role.permissions.includes(item.id) ? <Check size={14} /> : <Lock size={14} />}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Management */}
        <div ref={usersRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "users" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
                <UserIcon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Usuários</h3>
                <p className="text-xs text-[#9e9e9e] font-medium">Gerencie o cargo de cada colaborador</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAddingUser(true)}
              className="p-2 bg-[#141414] text-white rounded-xl hover:bg-black transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          {isAddingUser && (
            <form onSubmit={handleAddUser} className="mb-8 p-6 bg-[#f5f5f5] rounded-2xl space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider">Novo Usuário</h4>
                <button type="button" onClick={() => setIsAddingUser(false)} className="text-[#9e9e9e] hover:text-black">
                  <X size={16} />
                </button>
              </div>
              <input 
                required
                type="email"
                placeholder="E-mail"
                className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
              />
              <input 
                required
                type="password"
                placeholder="Senha"
                className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                value={newUserPassword}
                onChange={e => setNewUserPassword(e.target.value)}
              />
              <select
                className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                value={newUserRoleId}
                onChange={e => setNewUserRoleId(e.target.value)}
              >
                {state.roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <button type="submit" className="w-full py-3 bg-[#141414] text-white rounded-xl font-bold text-sm">
                Criar Usuário
              </button>
            </form>
          )}

          <div className="space-y-4">
            {state.users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-[#f5f5f5] rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#141414] border border-[#e5e5e5]">
                    <UserIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.email}</p>
                    <p className="text-[10px] text-[#9e9e9e] uppercase font-bold tracking-widest">ID: {user.id}</p>
                  </div>
                </div>

                <select
                  className="bg-white border border-[#e5e5e5] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={user.roleId}
                  onChange={(e) => updateUserRole(user.id, e.target.value)}
                >
                  {state.roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories Management */}
        <div ref={expCatRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "expense-categories" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
                <TrendingDown size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Categorias de Despesas</h3>
                <p className="text-xs text-[#9e9e9e] font-medium">Gerencie as categorias para suas despesas</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAddingExpenseCat(true)}
              className="p-2 bg-[#141414] text-white rounded-xl hover:bg-black transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          {isAddingExpenseCat && (
            <form onSubmit={handleAddExpenseCat} className="mb-8 p-6 bg-[#f5f5f5] rounded-2xl space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider">Nova Categoria</h4>
                <button type="button" onClick={() => setIsAddingExpenseCat(false)} className="text-[#9e9e9e] hover:text-black">
                  <X size={16} />
                </button>
              </div>
              <input 
                autoFocus
                required
                placeholder="Nome da Categoria (ex: Manutenção)"
                className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                value={newExpenseCatName}
                onChange={e => setNewExpenseCatName(e.target.value)}
              />
              <button type="submit" className="w-full py-3 bg-[#141414] text-white rounded-xl font-bold text-sm">
                Adicionar Categoria
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            {state.expenseCategories.map(cat => (
              <div key={cat} className="flex items-center gap-2 px-4 py-2 bg-[#f5f5f5] rounded-xl border border-[#e5e5e5] group">
                <span className="text-sm font-bold">{cat}</span>
                <button 
                  onClick={() => removeExpenseCat(cat)}
                  className="text-[#9e9e9e] hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Product Categories Management */}
        <div ref={prodCatRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "product-categories" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Categorias de Estoque</h3>
                <p className="text-xs text-[#9e9e9e] font-medium">Gerencie as categorias para seus produtos</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAddingProductCat(true)}
              className="p-2 bg-[#141414] text-white rounded-xl hover:bg-black transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          {isAddingProductCat && (
            <form onSubmit={handleAddProductCat} className="mb-8 p-6 bg-[#f5f5f5] rounded-2xl space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider">Nova Categoria</h4>
                <button type="button" onClick={() => setIsAddingProductCat(false)} className="text-[#9e9e9e] hover:text-black">
                  <X size={16} />
                </button>
              </div>
              <input 
                autoFocus
                required
                placeholder="Nome da Categoria (ex: Pulseira)"
                className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                value={newProductCatName}
                onChange={e => setNewProductCatName(e.target.value)}
              />
              <button type="submit" className="w-full py-3 bg-[#141414] text-white rounded-xl font-bold text-sm">
                Adicionar Categoria
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            {state.productCategories.map(cat => (
              <div key={cat} className="flex items-center gap-2 px-4 py-2 bg-[#f5f5f5] rounded-xl border border-[#e5e5e5] group">
                <span className="text-sm font-bold">{cat}</span>
                {cat !== "Jogo" && (
                  <button 
                    onClick={() => removeProductCat(cat)}
                    className="text-[#9e9e9e] hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card Fees Management */}
        <div ref={feesRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "fees" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Taxas de Cartão</h3>
              <p className="text-xs text-[#9e9e9e] font-medium">Configure as taxas de crédito e débito (%)</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onUpdateFees(creditFee, debitFee); }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4a4a4a] uppercase tracking-wider">Taxa de Crédito (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full pl-4 pr-10 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 font-bold"
                    value={creditFee}
                    onChange={e => setCreditFee(parseFloat(e.target.value) || 0)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e9e9e] font-bold">%</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#4a4a4a] uppercase tracking-wider">Taxa de Débito (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full pl-4 pr-10 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 font-bold"
                    value={debitFee}
                    onChange={e => setDebitFee(parseFloat(e.target.value) || 0)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e9e9e] font-bold">%</div>
                </div>
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-[#141414] text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-black/10"
            >
              Atualizar Taxas
            </button>
          </form>
        </div>

        {/* Discounts Management */}
        <div ref={discountsRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "discounts" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
              <Percent size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Descontos de Produtos</h3>
              <p className="text-xs text-[#9e9e9e] font-medium">Configure descontos temporários para seus produtos</p>
            </div>
          </div>

          <div className="space-y-6">
            {state.products.length === 0 ? (
              <p className="text-sm text-[#9e9e9e] text-center py-8">Nenhum produto cadastrado para aplicar descontos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#f5f5f5]">
                      <th className="pb-4 text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider">Produto</th>
                      <th className="pb-4 text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider text-center">Desconto (%)</th>
                      <th className="pb-4 text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider text-center">Período</th>
                      <th className="pb-4 text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f5]">
                    {state.products.map(product => (
                      <tr key={product.id} className="group">
                        <td className="py-4">
                          <p className="text-sm font-bold">{product.name}</p>
                          <p className="text-[10px] text-[#9e9e9e]">{formatCurrency(product.sellingPricePerUnit)}</p>
                        </td>
                        <td className="py-4 text-center">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg text-xs font-bold text-center outline-none"
                            value={product.discountPercentage || 0}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              onUpdateProducts(state.products.map(p => p.id === product.id ? { ...p, discountPercentage: val } : p));
                            }}
                          />
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <input 
                              type="date"
                              className="px-2 py-1 bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg text-[10px] outline-none"
                              value={product.discountStart || ""}
                              onChange={e => {
                                onUpdateProducts(state.products.map(p => p.id === product.id ? { ...p, discountStart: e.target.value } : p));
                              }}
                            />
                            <span className="text-[#9e9e9e]">-</span>
                            <input 
                              type="date"
                              className="px-2 py-1 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-[10px] outline-none"
                              value={product.discountEnd || ""}
                              onChange={e => {
                                onUpdateProducts(state.products.map(p => p.id === product.id ? { ...p, discountEnd: e.target.value } : p));
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          {(product.discountPercentage || product.discountStart || product.discountEnd) && (
                            <button 
                              onClick={() => {
                                onUpdateProducts(state.products.map(p => p.id === product.id ? { ...p, discountPercentage: 0, discountStart: undefined, discountEnd: undefined } : p));
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* About Us Management */}
        <div ref={aboutUsRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "about-us" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
              <Info size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Sobre Nós</h3>
              <p className="text-xs text-[#9e9e9e] font-medium">Edite o texto que aparece na vitrine</p>
            </div>
          </div>

          <div className="space-y-4">
            <textarea 
              className="w-full px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 min-h-[200px]"
              value={state.aboutUs}
              onChange={e => onUpdateAboutUs(e.target.value)}
              placeholder="Escreva sobre sua empresa..."
            />
          </div>
        </div>

        {/* Silver Care Management */}
        <div ref={silverCareRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "silver-care" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Cuidados com a Prata</h3>
              <p className="text-xs text-[#9e9e9e] font-medium">Instruções de manutenção para seus clientes</p>
            </div>
          </div>

          <div className="space-y-4">
            <textarea 
              className="w-full px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 min-h-[200px]"
              value={state.silverCare}
              onChange={e => onUpdateSilverCare(e.target.value)}
              placeholder="Instruções de cuidados..."
            />
          </div>
        </div>

        {/* Contacts Management */}
        <div ref={contactsRef} className={cn("bg-white rounded-3xl p-8 shadow-sm border transition-all duration-500", activeSection === "contacts" ? "border-black ring-4 ring-black/5" : "border-[#e5e5e5]")}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl flex items-center justify-center text-[#141414]">
              <Phone size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Contatos e Redes Sociais</h3>
              <p className="text-xs text-[#9e9e9e] font-medium">Links para suas redes e canais de atendimento</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider flex items-center gap-2">
                  <MessageCircle size={12} /> WhatsApp (Link ou Número)
                </label>
                <input 
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                  value={state.contacts.whatsapp}
                  onChange={e => onUpdateContacts({ ...state.contacts, whatsapp: e.target.value })}
                  placeholder="https://wa.me/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider flex items-center gap-2">
                  <Instagram size={12} /> Instagram (Link)
                </label>
                <input 
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                  value={state.contacts.instagram}
                  onChange={e => onUpdateContacts({ ...state.contacts, instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider flex items-center gap-2">
                  <Facebook size={12} /> Facebook (Link)
                </label>
                <input 
                  className="w-full px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                  value={state.contacts.facebook}
                  onChange={e => onUpdateContacts({ ...state.contacts, facebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider">E-mail</label>
                  <input 
                    className="w-full px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                    value={state.contacts.email}
                    onChange={e => onUpdateContacts({ ...state.contacts, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-wider">Telefone</label>
                  <input 
                    className="w-full px-4 py-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5"
                    value={state.contacts.phone}
                    onChange={e => onUpdateContacts({ ...state.contacts, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Showcase({ 
  products = [], 
  aboutUs = "", 
  silverCare = "", 
  contacts = { whatsapp: "", instagram: "", facebook: "", email: "", phone: "" },
  onAdminAccess 
}: { 
  products: Product[], 
  aboutUs?: string,
  silverCare?: string,
  contacts?: Contacts,
  onAdminAccess: () => void 
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [modalContent, setModalContent] = useState<{ title: string, content: React.ReactNode } | null>(null);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [detailsQuantity, setDetailsQuantity] = useState<number>(1);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => selectedCategory === "Todos" || p.category === selectedCategory);

  const getDiscountInfo = (product: Product) => {
    let hasDiscount = false;
    let discountedPrice = product.sellingPricePerUnit;
    
    if (product.discountPercentage && product.discountPercentage > 0) {
      if (product.discountStart && product.discountEnd) {
        try {
          const now = new Date();
          const start = parseISO(product.discountStart);
          const end = parseISO(product.discountEnd);
          if (isWithinInterval(now, { start, end })) {
            hasDiscount = true;
            discountedPrice = product.sellingPricePerUnit * (1 - product.discountPercentage / 100);
          }
        } catch {
          hasDiscount = true;
          discountedPrice = product.sellingPricePerUnit * (1 - product.discountPercentage / 100);
        }
      } else {
        hasDiscount = true;
        discountedPrice = product.sellingPricePerUnit * (1 - product.discountPercentage / 100);
      }
    }
    
    const finalDiscountedPrice = parseFloat(discountedPrice.toFixed(2));
    const savings = parseFloat((product.sellingPricePerUnit - finalDiscountedPrice).toFixed(2));

    return {
      hasDiscount,
      discountedPrice: finalDiscountedPrice,
      originalPrice: product.sellingPricePerUnit,
      discountPercentage: product.discountPercentage || 0,
      savings
    };
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.stock <= 0) {
      showToast(`A peça "${product.name}" está esgotada no momento.`);
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantityToAdd, product.stock);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        return [...prev, { product, quantity: Math.min(quantityToAdd, product.stock) }];
      }
    });

    showToast(`"${product.name}" (${quantityToAdd}x) adicionado ao carrinho!`);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return { ...item, quantity: Math.min(newQty, item.product.stock) };
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => {
    const info = getDiscountInfo(item.product);
    return acc + (info.discountedPrice * item.quantity);
  }, 0);

  const cartTotalSavings = cart.reduce((acc, item) => {
    const info = getDiscountInfo(item.product);
    return acc + (info.hasDiscount ? info.savings * item.quantity : 0);
  }, 0);

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleBuySingleWhatsApp = (product: Product, quantity: number) => {
    const info = getDiscountInfo(product);
    const priceText = formatCurrency(info.discountedPrice);
    const discountNote = info.hasDiscount 
      ? ` (Valor original: ${formatCurrency(info.originalPrice)} com ${info.discountPercentage}% OFF - Economia de ${formatCurrency(info.savings)})` 
      : "";
    
    const message = 
      `Olá! Tenho interesse em adquirir esta joia através da vitrine:\n\n` +
      `✨ *Peça:* ${product.name}\n` +
      `💎 *Material:* Prata 925 Legítima\n` +
      `📁 *Categoria:* ${product.category}\n` +
      `📦 *Quantidade:* ${quantity} unidade(s)\n` +
      `💰 *Valor Unitário:* ${priceText}${discountNote}\n` +
      `🏷️ *Subtotal:* ${formatCurrency(info.discountedPrice * quantity)}\n\n` +
      `Ainda está disponível? Como posso combinar o pagamento e entrega?`;
    
    const rawNumber = contacts.whatsapp ? contacts.whatsapp.replace(/\D/g, '') : "5511999999999";
    const cleanNumber = rawNumber.length >= 10 ? rawNumber : "5511999999999";
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleCheckoutCartWhatsApp = () => {
    if (cart.length === 0) return;
    
    let message = `Olá! Gostaria de finalizar meu pedido da vitrine *B2B Pratas*:\n\n*🛍️ Itens do Pedido:*\n`;
    
    cart.forEach((item, index) => {
      const info = getDiscountInfo(item.product);
      const subtotal = info.discountedPrice * item.quantity;
      const discountNote = info.hasDiscount ? ` (${info.discountPercentage}% OFF)` : "";
      message += `${index + 1}. *${item.product.name}* (Prata 925)\n   • Qtd: ${item.quantity}x | Unitário: ${formatCurrency(info.discountedPrice)}${discountNote} | Subtotal: ${formatCurrency(subtotal)}\n`;
    });
    
    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (cartTotalSavings > 0) {
      message += `🎉 *Você economizou:* ${formatCurrency(cartTotalSavings)}\n`;
    }
    message += `💵 *Total a Pagar:* ${formatCurrency(cartTotal)}\n\n`;
    message += `Por favor, me informe as opções para pagamento (Pix / Cartão) e prazo para envio!`;
    
    const rawNumber = contacts.whatsapp ? contacts.whatsapp.replace(/\D/g, '') : "5511999999999";
    const cleanNumber = rawNumber.length >= 10 ? rawNumber : "5511999999999";
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const openModal = (type: 'about' | 'care' | 'contacts') => {
    if (type === 'about') {
      setModalContent({
        title: "Sobre Nós",
        content: <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#4a4a4a]">{aboutUs}</div>
      });
    } else if (type === 'care') {
      setModalContent({
        title: "Cuidados com a Prata",
        content: <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#4a4a4a]">{silverCare}</div>
      });
    } else if (type === 'contacts') {
      setModalContent({
        title: "Nossos Contatos",
        content: (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {contacts.whatsapp && (
                <a 
                  href={contacts.whatsapp.startsWith('http') ? contacts.whatsapp : `https://wa.me/${contacts.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-[#f5f5f5] rounded-2xl hover:bg-[#e5e5e5] transition-all group"
                >
                  <div className="w-10 h-10 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/20 group-hover:scale-110 transition-transform">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">WhatsApp</p>
                    <p className="text-sm font-bold">Fale conosco agora</p>
                  </div>
                </a>
              )}
              {contacts.instagram && (
                <a 
                  href={contacts.instagram.startsWith('http') ? contacts.instagram : `https://instagram.com/${contacts.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-[#f5f5f5] rounded-2xl hover:bg-[#e5e5e5] transition-all group"
                >
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                    <Instagram size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Instagram</p>
                    <p className="text-sm font-bold">Siga nossas novidades</p>
                  </div>
                </a>
              )}
              {contacts.facebook && (
                <a 
                  href={contacts.facebook.startsWith('http') ? contacts.facebook : `https://facebook.com/${contacts.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-[#f5f5f5] rounded-2xl hover:bg-[#e5e5e5] transition-all group"
                >
                  <div className="w-10 h-10 bg-[#1877F2] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#1877F2]/20 group-hover:scale-110 transition-transform">
                    <Facebook size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Facebook</p>
                    <p className="text-sm font-bold">Acompanhe nossa página</p>
                  </div>
                </a>
              )}
            </div>
            
            <div className="pt-4 border-t border-[#e5e5e5] space-y-3">
              {contacts.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-[#f5f5f5] rounded-lg flex items-center justify-center text-[#9e9e9e]">
                    <Edit size={14} />
                  </div>
                  <span className="font-medium">{contacts.email}</span>
                </div>
              )}
              {contacts.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-[#f5f5f5] rounded-lg flex items-center justify-center text-[#9e9e9e]">
                    <Phone size={14} />
                  </div>
                  <span className="font-medium">{contacts.phone}</span>
                </div>
              )}
            </div>
          </div>
        )
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#141414] font-sans selection:bg-black selection:text-white">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#141414] text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 max-w-md">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
            <button 
              onClick={() => { setIsCartOpen(true); setToastMessage(null); }}
              className="text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 underline whitespace-nowrap"
            >
              Ver Carrinho
            </button>
          </div>
        </div>
      )}

      {/* Floating Cart Button (when items exist in cart) */}
      {cartItemsCount > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-6 z-[90] bg-[#141414] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border border-white/20 group"
          title="Abrir carrinho de compras"
        >
          <div className="relative">
            <ShoppingBag size={22} className="group-hover:rotate-6 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
              {cartItemsCount}
            </span>
          </div>
          <span className="text-xs font-bold tracking-tight pr-1 hidden sm:inline">
            Carrinho ({formatCurrency(cartTotal)})
          </span>
        </button>
      )}

      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <nav className="absolute top-0 left-0 w-full p-6 md:p-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 text-white">
            <B2BLogo className="w-12 h-12" showShadow />
            <div>
              <span className="text-2xl font-black tracking-tight uppercase block leading-none text-white">B2B Pratas</span>
              <span className="text-[11px] text-gray-200 font-medium italic hidden sm:block mt-0.5">Negócio que prospera</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Cart Header Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white hover:text-black transition-all flex items-center gap-2"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline">Carrinho</span>
              {cartItemsCount > 0 && (
                <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Admin Access Button */}
            <button 
              onClick={onAdminAccess}
              className="px-5 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white hover:text-black transition-all flex items-center gap-2"
            >
              <Lock size={16} />
              <span className="hidden sm:inline">Acesso Administrativo</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>
        </nav>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            ELEGÂNCIA EM <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-white">PRATA 925</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            Descubra nossa coleção exclusiva de joias em prata legítima. Design moderno, brilho eterno e a sofisticação que você merece.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <a href="#colecao" className="px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
              Ver Coleção
              <ArrowRight size={20} />
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
          <ArrowRight size={32} className="rotate-90" />
        </div>
      </header>

      {/* Collection Section */}
      <section id="colecao" className="py-32 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#9e9e9e]">Joias Selecionadas</span>
            </div>
            <h2 className="text-5xl font-bold tracking-tighter mb-4">Nossa Coleção</h2>
            <p className="text-[#9e9e9e] text-lg max-w-xl">Peças selecionadas para todos os momentos. Da delicadeza do dia a dia ao brilho das grandes ocasiões.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-full text-sm font-bold transition-all",
                  selectedCategory === cat 
                    ? "bg-[#141414] text-white shadow-xl shadow-black/10" 
                    : "bg-[#f5f5f5] text-[#4a4a4a] hover:bg-[#e5e5e5]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-32 text-center">
              <Package size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-[#9e9e9e] font-medium">Nenhum produto disponível nesta categoria.</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const info = getDiscountInfo(product);
              const isOutOfStock = product.stock <= 0;
              
              return (
                <div 
                  key={product.id} 
                  className="group relative flex flex-col bg-white rounded-3xl p-3 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
                >
                  {/* Card Image Box */}
                  <div 
                    onClick={() => {
                      setSelectedProductForDetails(product);
                      setDetailsQuantity(1);
                    }}
                    className="aspect-[4/5] bg-[#f5f5f5] rounded-2xl overflow-hidden mb-4 relative cursor-pointer"
                  >
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <PackageCheck size={64} />
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    {info.hasDiscount && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                        -{info.discountPercentage}% OFF
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <div className="absolute top-3 right-3 bg-black/80 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                        Esgotado
                      </div>
                    ) : product.stock <= 5 ? (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                        Últimas {product.stock} un.
                      </div>
                    ) : null}
                    
                    {/* Hover Action Buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      {/* EYE BUTTON (View details) */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForDetails(product);
                          setDetailsQuantity(1);
                        }}
                        title="Ver detalhamento completo da joia"
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 shadow-xl transition-all"
                      >
                        <Eye size={20} />
                      </button>

                      {/* CART BUTTON (Add to cart) */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, 1);
                        }}
                        disabled={isOutOfStock}
                        title={isOutOfStock ? "Produto esgotado" : "Adicionar ao carrinho"}
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all",
                          isOutOfStock 
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                            : "bg-white text-black hover:scale-110 active:scale-95"
                        )}
                      >
                        <ShoppingBag size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="px-2 pb-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest">{product.category}</span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          {product.material ? "Prata 925" : "Legítima"}
                        </span>
                      </div>
                      
                      <h3 
                        onClick={() => {
                          setSelectedProductForDetails(product);
                          setDetailsQuantity(1);
                        }}
                        className="font-bold text-base mb-2 cursor-pointer hover:text-gray-600 transition-colors line-clamp-2"
                      >
                        {product.name}
                      </h3>
                    </div>

                    <div>
                      {/* Stock Indicator */}
                      <div className="flex items-center gap-1.5 mb-2 text-xs">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          isOutOfStock ? "bg-red-500" : product.stock <= 5 ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <span className="text-[11px] font-medium text-gray-500">
                          {isOutOfStock ? "Sem estoque" : `Estoque: ${product.stock} un.`}
                        </span>
                      </div>

                      {/* Pricing Display */}
                      <div className="flex flex-col">
                        {info.hasDiscount ? (
                          <>
                            <span className="text-xs text-[#9e9e9e] line-through font-medium">
                              De {formatCurrency(info.originalPrice)}
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-extrabold text-[#141414]">
                                Por {formatCurrency(info.discountedPrice)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xl font-extrabold text-[#141414]">
                            {formatCurrency(info.discountedPrice)}
                          </span>
                        )}
                      </div>

                      {/* Quick Action Buttons on Card */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setSelectedProductForDetails(product);
                            setDetailsQuantity(1);
                          }}
                          className="py-2.5 px-3 bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#141414] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Eye size={14} />
                          Ver Peça
                        </button>
                        <button
                          onClick={() => addToCart(product, 1)}
                          disabled={isOutOfStock}
                          className={cn(
                            "py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                            isOutOfStock
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-[#141414] hover:bg-black text-white shadow-sm"
                          )}
                        >
                          <ShoppingBag size={14} />
                          Comprar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* MODAL: DETALHAMENTO COMPLETO DA PEÇA */}
      {selectedProductForDetails && (() => {
        const product = selectedProductForDetails;
        const info = getDiscountInfo(product);
        const isOutOfStock = product.stock <= 0;

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col">
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fcfcfc]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Prata 925 Legítima</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProductForDetails(null)}
                  className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  {/* Left Column: Image & Badges */}
                  <div>
                    <div className="aspect-[4/5] bg-[#f5f5f5] rounded-3xl overflow-hidden relative shadow-inner border border-gray-100">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <PackageCheck size={96} />
                        </div>
                      )}

                      {/* Discount ribbon */}
                      {info.hasDiscount && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-lg">
                          -{info.discountPercentage}% OFF
                        </div>
                      )}

                      {/* Guarantee Seal */}
                      <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md text-white p-3 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          <Sparkles size={18} className="text-amber-300" />
                        </div>
                        <div className="text-[11px] leading-tight">
                          <p className="font-bold text-white uppercase tracking-wider">{product.warranty || "Garantia Eterna do Metal"}</p>
                          <p className="text-gray-300">{product.material || "Prata de Lei 925 legítima certificada"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Complete Details & Purchasing */}
                  <div className="flex flex-col justify-between">
                    <div>
                      {/* Category & Material Seal (Customer ratings removed as requested) */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="text-xs font-bold text-[#9e9e9e] uppercase tracking-widest">{product.category}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          {product.material || "Prata de Lei 925 Legítima"}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#141414] tracking-tight mb-4">
                        {product.name}
                      </h2>

                      {/* Product Description */}
                      {product.description && (
                        <div className="mb-6 p-4 rounded-2xl bg-[#fafafa] border border-gray-100/90">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-500" />
                            Sobre esta Peça
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed font-normal">
                            {product.description}
                          </p>
                        </div>
                      )}

                      {/* Stock Quantity Details */}
                      <div className="mb-6 p-4 rounded-2xl bg-[#fafafa] border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-3.5 h-3.5 rounded-full ring-4",
                            isOutOfStock 
                              ? "bg-red-500 ring-red-100" 
                              : product.stock <= 5 
                                ? "bg-amber-500 ring-amber-100" 
                                : "bg-emerald-500 ring-emerald-100 animate-pulse"
                          )} />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Disponibilidade</p>
                            <p className="text-sm font-extrabold text-gray-900">
                              {isOutOfStock ? (
                                "Produto Esgotado"
                              ) : (
                                <>
                                  Em Estoque: <span className="text-emerald-700">{product.stock} unidades disponíveis</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Postagem</span>
                          <p className="text-xs font-bold text-gray-700">Imediata</p>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#f8f9fa] to-[#f0f2f5] border border-gray-200/70 mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Preço Exclusivo de Vitrine</p>
                        
                        {info.hasDiscount ? (
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm text-gray-400 line-through font-medium">
                                De {formatCurrency(info.originalPrice)}
                              </span>
                              <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                                Economize {formatCurrency(info.savings)}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-bold text-gray-600">Por:</span>
                              <span className="text-4xl font-black text-[#141414] tracking-tight">
                                {formatCurrency(info.discountedPrice)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-4xl font-black text-[#141414] tracking-tight">
                            {formatCurrency(info.discountedPrice)}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs font-medium text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={14} className="text-gray-400" />
                            <span>Até 3x de {formatCurrency(info.discountedPrice / 3)} sem juros</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <Banknote size={14} />
                            <span>5% off à vista via Pix ({formatCurrency(info.discountedPrice * 0.95)})</span>
                          </div>
                        </div>
                      </div>

                      {/* Components listing if it's a set (Jogo) */}
                      {product.isSet && product.components && product.components.length > 0 && (
                        <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-600" />
                            Itens inclusos neste Conjunto:
                          </p>
                          <div className="space-y-1.5">
                            {product.components.map(comp => (
                              <div key={comp.id} className="flex items-center justify-between text-xs bg-white/80 p-2.5 rounded-xl border border-amber-100">
                                <span className="font-bold text-gray-800">{comp.quantity}x {comp.name}</span>
                                <span className="text-amber-800 font-semibold">{formatCurrency(comp.sellingPricePerUnit)} cada</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Specifications and Material Specs - All filled dynamically from registration */}
                      <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-gray-500" />
                          Especificações Técnicas da Joia
                        </p>
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="p-3 bg-[#fbfbfb] rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <ShieldCheck size={11} className="text-gray-400" /> Metal / Material
                            </p>
                            <p className="font-bold text-gray-800 mt-0.5 break-words">{product.material || "Prata de Lei 925 Legítima"}</p>
                          </div>
                          
                          <div className="p-3 bg-[#fbfbfb] rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles size={11} className="text-gray-400" /> Acabamento
                            </p>
                            <p className="font-bold text-gray-800 mt-0.5 break-words">{product.finish || "Polimento Espelhado"}</p>
                          </div>

                          <div className="p-3 bg-[#fbfbfb] rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <Ruler size={11} className="text-gray-400" /> Dimensões / Tamanho
                            </p>
                            <p className="font-bold text-gray-800 mt-0.5 break-words">{product.dimensions || "Tamanho padrão"}</p>
                          </div>

                          <div className="p-3 bg-[#fbfbfb] rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <Scale size={11} className="text-gray-400" /> Peso Aproximado
                            </p>
                            <p className="font-bold text-gray-800 mt-0.5 break-words">{product.weight || "Conforme modelo"}</p>
                          </div>

                          <div className="p-3 bg-[#fbfbfb] rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <Gem size={11} className="text-gray-400" /> Pedras / Detalhes
                            </p>
                            <p className="font-bold text-gray-800 mt-0.5 break-words">{product.stone || "Sem pedras / Lisa"}</p>
                          </div>

                          <div className="p-3 bg-[#fbfbfb] rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-gray-400" /> Hipoalergênico
                            </p>
                            <p className="font-bold text-gray-800 mt-0.5 break-words">{product.hypoallergenic || "100% Livre de Níquel"}</p>
                          </div>

                          <div className="p-3 bg-[#fbfbfb] rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <Gift size={11} className="text-gray-400" /> Embalagem
                            </p>
                            <p className="font-bold text-gray-800 mt-0.5 break-words">{product.packaging || "Saquinho de Veludo + Certificado"}</p>
                          </div>

                          <div className="p-3 bg-[#fbfbfb] rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                              <ShieldCheck size={11} className="text-gray-400" /> Garantia
                            </p>
                            <p className="font-bold text-gray-800 mt-0.5 break-words">{product.warranty || "Garantia Vitalícia da Prata 925"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector & Action Buttons */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      {/* Quantity Selector */}
                      {!isOutOfStock && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Quantidade Desejada:
                          </span>
                          <div className="flex items-center gap-3 bg-[#f5f5f5] p-1.5 rounded-2xl border border-gray-200">
                            <button
                              onClick={() => setDetailsQuantity(q => Math.max(1, q - 1))}
                              disabled={detailsQuantity <= 1}
                              className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:bg-gray-100 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-extrabold text-sm w-8 text-center">{detailsQuantity}</span>
                            <button
                              onClick={() => setDetailsQuantity(q => Math.min(product.stock, q + 1))}
                              disabled={detailsQuantity >= product.stock}
                              className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:bg-gray-100 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Primary Actions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Add to Cart Button */}
                        <button
                          onClick={() => {
                            addToCart(product, detailsQuantity);
                            setSelectedProductForDetails(null);
                          }}
                          disabled={isOutOfStock}
                          className={cn(
                            "py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg",
                            isOutOfStock
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-[#141414] hover:bg-black text-white hover:scale-[1.02] active:scale-[0.98] shadow-black/10"
                          )}
                        >
                          <ShoppingBag size={18} />
                          Colocar no Carrinho
                        </button>

                        {/* Buy via WhatsApp Button */}
                        <button
                          onClick={() => handleBuySingleWhatsApp(product, detailsQuantity)}
                          disabled={isOutOfStock}
                          className={cn(
                            "py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg",
                            isOutOfStock
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-[#25D366] hover:bg-[#20bd5a] text-white hover:scale-[1.02] active:scale-[0.98] shadow-[#25D366]/20"
                          )}
                        >
                          <MessageCircle size={18} />
                          Comprar via WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL / DRAWER: CARRINHO DE COMPRAS */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Cart Header */}
            <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#141414] text-white rounded-xl flex items-center justify-center shadow-md">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Carrinho de Compras</h3>
                  <p className="text-xs text-[#9e9e9e] font-medium">
                    {cartItemsCount} {cartItemsCount === 1 ? 'peça selecionada' : 'peças selecionadas'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 bg-[#f5f5f5] rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-[#e5e5e5] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <ShoppingBag size={36} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-1">Seu carrinho está vazio</h4>
                  <p className="text-xs text-gray-400 max-w-xs mb-6">
                    Aproveite nossa coleção em Prata 925 legítima e adicione suas peças favoritas!
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-6 py-3 bg-[#141414] text-white rounded-full font-bold text-xs hover:scale-105 transition-transform"
                  >
                    Explorar Coleção
                  </button>
                </div>
              ) : (
                cart.map(item => {
                  const info = getDiscountInfo(item.product);
                  const subtotal = info.discountedPrice * item.quantity;
                  
                  return (
                    <div key={item.product.id} className="flex gap-4 p-4 bg-[#fafafa] rounded-2xl border border-gray-100 group">
                      {/* Product Thumbnail */}
                      <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-200 relative">
                        {item.product.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <PackageCheck size={24} />
                          </div>
                        )}
                        {info.hasDiscount && (
                          <span className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                            -{info.discountPercentage}%
                          </span>
                        )}
                      </div>

                      {/* Product Info & Controls */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-gray-900 leading-tight">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Remover peça"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {item.product.category} • Prata 925
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-gray-200">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, -1)}
                              className="text-gray-500 hover:text-black"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="text-gray-500 hover:text-black disabled:opacity-30"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="text-right">
                            {info.hasDiscount && (
                              <span className="text-[10px] text-gray-400 line-through block leading-none">
                                {formatCurrency(info.originalPrice * item.quantity)}
                              </span>
                            )}
                            <span className="text-sm font-extrabold text-[#141414]">
                              {formatCurrency(subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-[#fcfcfc] space-y-4">
                <div className="space-y-1.5 text-xs text-gray-600">
                  {cartTotalSavings > 0 && (
                    <div className="flex justify-between font-bold text-red-600">
                      <span>Descontos Promocionais:</span>
                      <span>-{formatCurrency(cartTotalSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Envio / Frete:</span>
                    <span className="font-bold text-emerald-600">A combinar via WhatsApp</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Total do Pedido:</span>
                    <span className="text-2xl font-black text-gray-900">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleCheckoutCartWhatsApp}
                    className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageCircle size={20} />
                    Finalizar Pedido via WhatsApp
                  </button>

                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-3 bg-[#f5f5f5] hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-xs transition-colors"
                  >
                    Continuar Escolhendo Peças
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0a0a0a] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-20">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <B2BLogo className="w-14 h-14" showShadow />
              <div>
                <span className="text-2xl font-black tracking-tight uppercase block leading-none text-white">B2B Pratas</span>
                <span className="text-xs text-gray-400 font-medium italic block mt-0.5">Negócio que prospera</span>
              </div>
            </div>
            <p className="text-gray-400 max-w-sm text-base leading-relaxed">
              B2B Pratas • Especialistas em joias em Prata 925 legítima. Atacado e varejo com qualidade, sofisticação e o brilho que impulsiona o seu negócio.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-8">Links Úteis</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              <li><button onClick={() => openModal('about')} className="hover:text-white transition-colors">Sobre Nós</button></li>
              <li><a href="#colecao" className="hover:text-white transition-colors">Coleções</a></li>
              <li><button onClick={() => openModal('care')} className="hover:text-white transition-colors">Cuidados com a Prata</button></li>
              <li><button onClick={() => openModal('contacts')} className="hover:text-white transition-colors">Contatos</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-8">Contato</h4>
            <ul className="space-y-4 text-gray-400 font-medium">
              <li>{contacts.email || "contato@b2bpratas.com.br"}</li>
              <li>{contacts.phone || "(11) 99999-9999"}</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm font-medium">
          <p>© 2026 B2B Pratas. Negócio que prospera. Todos os direitos reservados.</p>
          <div className="flex items-center gap-8">
            {contacts.instagram && (
              <a href={contacts.instagram.startsWith('http') ? contacts.instagram : `https://instagram.com/${contacts.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            )}
            {contacts.whatsapp && (
              <a href={contacts.whatsapp.startsWith('http') ? contacts.whatsapp : `https://wa.me/${contacts.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
            )}
            {contacts.facebook && (
              <a href={contacts.facebook.startsWith('http') ? contacts.facebook : `https://facebook.com/${contacts.facebook}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>
            )}
          </div>
        </div>
      </footer>

      {/* Modal for Info Sections */}
      {modalContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-[#f5f5f5] flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight">{modalContent.title}</h3>
              <button 
                onClick={() => setModalContent(null)}
                className="w-10 h-10 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[#9e9e9e] hover:text-black hover:bg-[#e5e5e5] transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {modalContent.content}
            </div>
            <div className="p-6 bg-[#f5f5f5] flex justify-end">
              <button 
                onClick={() => setModalContent(null)}
                className="px-8 py-3 bg-[#141414] text-white rounded-full font-bold text-sm hover:scale-105 transition-transform"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
