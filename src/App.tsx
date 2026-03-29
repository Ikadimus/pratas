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
  Star,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Info,
  Sparkles,
  Phone,
  Instagram,
  Facebook,
  MessageCircle
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
import { Product, Sale, Expense, AppState, User, Role, Contacts } from "./types";

import { AdminAssistant } from "./components/AdminAssistant";

const INITIAL_PRODUCT_CATEGORIES = ["Anel", "Brinco", "Colar", "Pulseira", "Pingente", "Outros", "Jogo"];
const INITIAL_EXPENSE_CATEGORIES = ["Fornecedor", "Aluguel", "Marketing", "Outros"];
const PAYMENT_METHODS = ["Crédito", "Débito", "Pix", "Dinheiro"];
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
      { id: "1", email: "b@b", password: "123", roleId: "admin" }
    ];

    const defaultAboutUs = "Somos uma empresa dedicada a oferecer as melhores joias em prata.";
    const defaultSilverCare = "Para manter sua prata sempre brilhante, evite contato com produtos químicos.";
    const defaultContacts = {
      whatsapp: "",
      instagram: "",
      facebook: "",
      email: "",
      phone: ""
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            products: Array.isArray(parsed.products) ? parsed.products : [],
            sales: Array.isArray(parsed.sales) ? parsed.sales : [],
            expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
            users: Array.isArray(parsed.users) ? parsed.users : initialUsers,
            roles: Array.isArray(parsed.roles) ? parsed.roles : initialRoles,
            expenseCategories: Array.isArray(parsed.expenseCategories) ? parsed.expenseCategories : INITIAL_EXPENSE_CATEGORIES,
            productCategories: Array.isArray(parsed.productCategories) ? parsed.productCategories : INITIAL_PRODUCT_CATEGORIES,
            creditFee: typeof parsed.creditFee === 'number' ? parsed.creditFee : 0,
            debitFee: typeof parsed.debitFee === 'number' ? parsed.debitFee : 0,
            aboutUs: parsed.aboutUs || defaultAboutUs,
            silverCare: parsed.silverCare || defaultSilverCare,
            contacts: parsed.contacts || defaultContacts
          };
        }
      } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", e);
      }
    }

    return { 
      products: [], 
      sales: [], 
      expenses: [], 
      users: initialUsers, 
      roles: initialRoles,
      expenseCategories: INITIAL_EXPENSE_CATEGORIES,
      productCategories: INITIAL_PRODUCT_CATEGORIES,
      creditFee: 0,
      debitFee: 0,
      aboutUs: defaultAboutUs,
      silverCare: defaultSilverCare,
      contacts: defaultContacts
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
            <div className="flex items-center gap-2">
              <PackageCheck className="w-8 h-8" />
              <h1 className="text-xl font-bold tracking-tighter hidden sm:block">PrataGestão</h1>
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
            onAdd={addExpense} 
            onDelete={deleteExpense}
            initialView={activeSubTab === "new" ? "form" : "list"}
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
    category: categories[0] || "Outros",
    sellingPricePerUnit: 0,
    costPerUnit: 0,
    stock: 0,
    isSet: false,
    components: []
  });

  const [newComponent, setNewComponent] = useState({ name: "", costPerUnit: 0, sellingPricePerUnit: 0, quantity: 1 });

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

  const isJogo = formData.category === "Jogo";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-[#f5f5f5] flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold">{product ? "Editar Produto" : "Novo Produto"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form className="p-8 space-y-6 overflow-y-auto" onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...formData, isSet: isJogo } as Product);
        }}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Nome do Produto</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Categoria</label>
              <select 
                className="w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none appearance-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Estoque Inicial</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {isJogo && (
            <div className="space-y-4 p-6 bg-[#fcfcfc] border border-[#e5e5e5] rounded-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider">Componentes do Jogo</h4>
                <span className="text-[10px] font-bold text-[#9e9e9e] uppercase">Administre os itens do conjunto</span>
              </div>
              
              <div className="space-y-3">
                {formData.components?.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-[#e5e5e5] rounded-xl">
                    <div className="flex-1">
                      <p className="text-xs font-bold">{c.name} <span className="text-[#9e9e9e] ml-1">({c.quantity}x)</span></p>
                      <p className="text-[10px] text-[#9e9e9e]">Custo: {formatCurrency(c.costPerUnit)} | Venda: {formatCurrency(c.sellingPricePerUnit)}</p>
                    </div>
                    <button type="button" onClick={() => removeComponent(c.id)} className="text-red-500 p-1 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input 
                  placeholder="Nome do Item"
                  className="col-span-2 px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl text-xs outline-none"
                  value={newComponent.name}
                  onChange={e => setNewComponent({ ...newComponent, name: e.target.value })}
                />
                <input 
                  type="number"
                  placeholder="Custo Un."
                  className="px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl text-xs outline-none"
                  value={newComponent.costPerUnit || ""}
                  onChange={e => setNewComponent({ ...newComponent, costPerUnit: parseFloat(e.target.value) || 0 })}
                />
                <input 
                  type="number"
                  placeholder="Venda Un."
                  className="px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl text-xs outline-none"
                  value={newComponent.sellingPricePerUnit || ""}
                  onChange={e => setNewComponent({ ...newComponent, sellingPricePerUnit: parseFloat(e.target.value) || 0 })}
                />
                <input 
                  type="number"
                  placeholder="Qtd"
                  className="px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl text-xs outline-none"
                  value={newComponent.quantity}
                  onChange={e => setNewComponent({ ...newComponent, quantity: parseInt(e.target.value) || 1 })}
                />
                <button 
                  type="button"
                  onClick={addComponent}
                  className="col-span-2 py-2 bg-[#141414] text-white rounded-xl text-xs font-bold hover:bg-black"
                >
                  Adicionar Item ao Jogo
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Custo por Unidade (R$)</label>
              <input 
                required
                type="number" 
                step="0.01"
                readOnly={isJogo}
                className={cn(
                  "w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none",
                  isJogo && "opacity-60 cursor-not-allowed"
                )}
                value={formData.costPerUnit}
                onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Preço de Venda por Unidade (R$)</label>
              <input 
                required
                type="number" 
                step="0.01"
                readOnly={isJogo}
                className={cn(
                  "w-full px-4 py-3 bg-[#f5f5f5] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none",
                  isJogo && "opacity-60 cursor-not-allowed"
                )}
                value={formData.sellingPricePerUnit}
                onChange={e => setFormData({ ...formData, sellingPricePerUnit: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4 shrink-0">
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
              Salvar Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Sales Component ---
function Sales({ sales, products, onAdd, onDelete, initialView, creditFee, debitFee }: { 
  sales: Sale[], 
  products: Product[], 
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
          <p className="text-[#9e9e9e]">Registre novas vendas e acompanhe o histórico</p>
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
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Itens</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#9e9e9e]">Nenhuma venda registrada.</td>
                </tr>
              ) : (
                [...sales].reverse().map(sale => (
                  <tr key={sale.id} className="hover:bg-[#fcfcfc] transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">
                      {format(parseISO(sale.date), "dd/MM/yyyy HH:mm")}
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

function SaleModal({ products, creditFee, debitFee, onClose, onSave }: { 
  products: Product[], 
  creditFee: number, 
  debitFee: number, 
  onClose: () => void, 
  onSave: (s: Sale) => void 
}) {
  const [cart, setCart] = useState<{ productId: string, quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<Sale["paymentMethod"]>("Pix");
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
function Expenses({ expenses, categories, onAdd, onDelete, initialView }: { expenses: Expense[], categories: string[], onAdd: (e: Expense) => void, onDelete: (id: string) => void, initialView?: "list" | "form" }) {
  const [isAdding, setIsAdding] = useState(initialView === "form");

  useEffect(() => {
    if (initialView === "form") setIsAdding(true);
    if (initialView === "list") setIsAdding(false);
  }, [initialView]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
          <p className="text-[#9e9e9e]">Controle seus gastos e custos operacionais</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#141414] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10"
        >
          <Plus size={20} />
          Nova Despesa
        </button>
      </header>

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
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#9e9e9e]">Nenhuma despesa registrada.</td>
                </tr>
              ) : (
                [...expenses].reverse().map(expense => (
                  <tr key={expense.id} className="hover:bg-[#fcfcfc] transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">
                      {format(parseISO(expense.date), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-[#f5f5f5] rounded-full text-xs font-bold text-[#4a4a4a]">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm text-red-500">-{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDelete(expense.id)}
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
      setError("E-mail ou senha incorretos");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#141414] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-black/20">
              <PackageCheck size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter">PrataGestão</h1>
            <p className="text-sm text-[#9e9e9e] mt-2 font-medium uppercase tracking-widest">
              Acesso Administrativo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#9e9e9e] uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e9e9e]" size={18} />
                <input 
                  required
                  type="email" 
                  placeholder="exemplo@loja.com"
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
                  placeholder="••••••••"
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
              Entrar
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <button 
            onClick={onBack}
            className="w-full mt-6 py-4 text-[#9e9e9e] hover:text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar para Vitrine
          </button>
          
          <div className="mt-10 pt-8 border-t border-[#f5f5f5] text-center">
            <p className="text-[10px] text-[#9e9e9e] font-bold uppercase tracking-widest">Usuário de Teste</p>
            <p className="text-xs text-[#4a4a4a] mt-1 font-medium">b@b / 123</p>
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
              <Star size={20} />
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
  
  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => selectedCategory === "Todos" || p.category === selectedCategory);

  const getDiscountedPrice = (product: Product) => {
    if (!product.discountPercentage || !product.discountStart || !product.discountEnd) return product.sellingPricePerUnit;
    const now = new Date();
    const start = parseISO(product.discountStart);
    const end = parseISO(product.discountEnd);
    if (isWithinInterval(now, { start, end })) {
      return product.sellingPricePerUnit * (1 - product.discountPercentage / 100);
    }
    return product.sellingPricePerUnit;
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
      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1611085583191-a3b13b94b421?q=80&w=2070&auto=format&fit=crop" 
            alt="Silver Jewelry Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <nav className="absolute top-0 left-0 w-full p-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-white">
            <PackageCheck size={32} />
            <span className="text-2xl font-bold tracking-tighter uppercase">PrataGestão</span>
          </div>
          <button 
            onClick={onAdminAccess}
            className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white hover:text-black transition-all flex items-center gap-2"
          >
            <Lock size={16} />
            Acesso Administrativo
          </button>
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
              const discountedPrice = getDiscountedPrice(product);
              const hasDiscount = discountedPrice < product.sellingPricePerUnit;
              
              return (
                <div key={product.id} className="group relative">
                  <div className="aspect-[4/5] bg-[#f5f5f5] rounded-3xl overflow-hidden mb-6 relative">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <PackageCheck size={64} />
                      </div>
                    )}
                    
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        -{product.discountPercentage}% OFF
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                      <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform">
                        <Eye size={20} />
                      </button>
                      <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform">
                        <ShoppingBag size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest">{product.category}</span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold">4.9</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-[#9e9e9e] transition-colors">{product.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold">{formatCurrency(discountedPrice)}</span>
                      {hasDiscount && (
                        <span className="text-sm text-[#9e9e9e] line-through font-medium">
                          {formatCurrency(product.sellingPricePerUnit)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-20">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <PackageCheck size={32} />
              <span className="text-2xl font-bold tracking-tighter uppercase">PrataGestão</span>
            </div>
            <p className="text-gray-400 max-w-sm text-lg leading-relaxed">
              Especialistas em joias de prata 925. Qualidade, sofisticação e atendimento personalizado para você brilhar em qualquer ocasião.
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
              <li>{contacts.email || "contato@pratagestao.com.br"}</li>
              <li>{contacts.phone || "(11) 99999-9999"}</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm font-medium">
          <p>© 2024 PrataGestão. Todos os direitos reservados.</p>
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
