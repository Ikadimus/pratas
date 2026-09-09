import React, { useState, useMemo } from "react";
import { 
  Users, 
  DollarSign, 
  Percent, 
  Plus, 
  Search, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  ArrowUpRight, 
  Award, 
  Trash2, 
  Receipt, 
  UserCheck, 
  TrendingUp, 
  X,
  CreditCard,
  QrCode,
  Banknote,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sale, Expense, Seller } from "../types";
import { cn, formatCurrency } from "../lib/utils";

interface SellerCommissionsProps {
  sales: Sale[];
  expenses: Expense[];
  sellers: Seller[];
  onAddExpense: (expense: Expense) => void;
  onUpdateSellers: (sellers: Seller[]) => void;
}

export function SellerCommissions({
  sales,
  expenses,
  sellers,
  onAddExpense,
  onUpdateSellers
}: SellerCommissionsProps) {
  // Period filter: "current-month" | "last-month" | "last-30-days" | "all" | specific month index
  const [periodFilter, setPeriodFilter] = useState<string>("current-month");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSellerForSales, setSelectedSellerForSales] = useState<Seller | null>(null);
  const [sellerToLaunchExpense, setSellerToLaunchExpense] = useState<{ seller: Seller; amount: number; totalSold: number; count: number } | null>(null);
  const [isAddingSeller, setIsAddingSeller] = useState(false);
  const [editingCommissionSellerId, setEditingCommissionSellerId] = useState<string | null>(null);
  const [tempCommissionRate, setTempCommissionRate] = useState<number>(5);

  // New Seller Form state
  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerCommission, setNewSellerCommission] = useState<number>(5);
  const [newSellerPhone, setNewSellerPhone] = useState("");
  const [newSellerEmail, setNewSellerEmail] = useState("");

  // Confirmation message for launched expense
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Derive all active sellers (merging declared sellers + any seller name found in sales)
  const allSellers = useMemo(() => {
    const list = [...sellers];
    const existingNames = new Set(list.map(s => s.name.toLowerCase()));

    sales.forEach(sale => {
      if (sale.seller && sale.seller.trim() !== "" && !existingNames.has(sale.seller.toLowerCase())) {
        list.push({
          id: `auto-${sale.seller.toLowerCase().replace(/\s+/g, "-")}`,
          name: sale.seller,
          commissionRate: 5,
          active: true
        });
        existingNames.add(sale.seller.toLowerCase());
      }
    });

    return list;
  }, [sellers, sales]);

  // Date interval based on periodFilter
  const dateInterval = useMemo(() => {
    const now = new Date();
    if (periodFilter === "current-month") {
      return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, "MMMM 'de' yyyy", { locale: ptBR }) };
    }
    if (periodFilter === "last-month") {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev), label: format(prev, "MMMM 'de' yyyy", { locale: ptBR }) };
    }
    if (periodFilter === "last-30-days") {
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now), label: "Últimos 30 Dias" };
    }
    if (periodFilter === "all") {
      return { start: new Date(2020, 0, 1), end: new Date(2035, 11, 31), label: "Todo o Histórico" };
    }

    // Specific past month (e.g. "month-2" = 2 months ago)
    if (periodFilter.startsWith("month-")) {
      const mOffset = parseInt(periodFilter.replace("month-", ""), 10) || 0;
      const target = subMonths(now, mOffset);
      return { start: startOfMonth(target), end: endOfMonth(target), label: format(target, "MMMM 'de' yyyy", { locale: ptBR }) };
    }

    return { start: startOfMonth(now), end: endOfMonth(now), label: format(now, "MMMM 'de' yyyy", { locale: ptBR }) };
  }, [periodFilter]);

  // Filter sales in interval
  const salesInPeriod = useMemo(() => {
    return sales.filter(s => {
      try {
        const saleDate = parseISO(s.date);
        return isWithinInterval(saleDate, { start: dateInterval.start, end: dateInterval.end });
      } catch (e) {
        return false;
      }
    });
  }, [sales, dateInterval]);

  // Check which sellers already had commission launched as an expense in this period
  const launchedCommissions = useMemo(() => {
    // Find expenses in this period categorized as Comissões or with commission in description
    const relevantExpenses = expenses.filter(e => {
      try {
        const expDate = parseISO(e.date);
        const inPeriod = isWithinInterval(expDate, { start: dateInterval.start, end: dateInterval.end });
        return inPeriod && (e.category.toLowerCase().includes("comiss") || e.description.toLowerCase().includes("comiss"));
      } catch {
        return false;
      }
    });

    const launchedMap: Record<string, { id: string; amount: number; date: string }> = {};
    allSellers.forEach(seller => {
      const match = relevantExpenses.find(e => 
        e.description.toLowerCase().includes(seller.name.toLowerCase())
      );
      if (match) {
        launchedMap[seller.name.toLowerCase()] = {
          id: match.id,
          amount: match.amount,
          date: match.date
        };
      }
    });

    return launchedMap;
  }, [expenses, dateInterval, allSellers]);

  // Calculate statistics for each seller
  const sellerStats = useMemo(() => {
    return allSellers.map(seller => {
      const sellerSales = salesInPeriod.filter(s => {
        if (!s.seller) return false;
        return s.seller.trim().toLowerCase() === seller.name.trim().toLowerCase();
      });

      const totalSold = sellerSales.reduce((sum, s) => sum + s.total, 0);
      const salesCount = sellerSales.length;
      const averageTicket = salesCount > 0 ? totalSold / salesCount : 0;
      const rate = seller.commissionRate || 5;
      const commissionAmount = (totalSold * rate) / 100;
      const isLaunched = !!launchedCommissions[seller.name.toLowerCase()];
      const launchedData = launchedCommissions[seller.name.toLowerCase()];

      return {
        seller,
        sales: sellerSales,
        totalSold,
        salesCount,
        averageTicket,
        commissionRate: rate,
        commissionAmount,
        isLaunched,
        launchedData
      };
    });
  }, [allSellers, salesInPeriod, launchedCommissions]);

  // Sales without assigned seller
  const unassignedSales = useMemo(() => {
    return salesInPeriod.filter(s => !s.seller || s.seller.trim() === "");
  }, [salesInPeriod]);

  const unassignedTotal = useMemo(() => {
    return unassignedSales.reduce((acc, s) => acc + s.total, 0);
  }, [unassignedSales]);

  // Filtered seller stats by search
  const filteredSellerStats = useMemo(() => {
    if (!searchQuery.trim()) return sellerStats;
    const q = searchQuery.toLowerCase();
    return sellerStats.filter(item => 
      item.seller.name.toLowerCase().includes(q) ||
      (item.seller.email && item.seller.email.toLowerCase().includes(q))
    );
  }, [sellerStats, searchQuery]);

  // Global KPIs for the period
  const totalPeriodSales = useMemo(() => {
    return salesInPeriod.reduce((sum, s) => sum + s.total, 0);
  }, [salesInPeriod]);

  const totalCommissionsCalculated = useMemo(() => {
    return sellerStats.reduce((sum, item) => sum + item.commissionAmount, 0);
  }, [sellerStats]);

  const topSeller = useMemo(() => {
    const withSales = [...sellerStats].filter(s => s.totalSold > 0);
    if (withSales.length === 0) return null;
    return withSales.sort((a, b) => b.totalSold - a.totalSold)[0];
  }, [sellerStats]);

  const activeSellersCount = useMemo(() => {
    return sellerStats.filter(s => s.salesCount > 0).length;
  }, [sellerStats]);

  // Quick commission rate update
  const handleSaveCommissionRate = (sellerId: string) => {
    const updated = allSellers.map(s => {
      if (s.id === sellerId) {
        return { ...s, commissionRate: tempCommissionRate };
      }
      return s;
    });
    onUpdateSellers(updated);
    setEditingCommissionSellerId(null);
  };

  // Add new seller
  const handleAddSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerName.trim()) return;

    const newSeller: Seller = {
      id: `seller-${Date.now()}`,
      name: newSellerName.trim(),
      commissionRate: Number(newSellerCommission) || 5,
      phone: newSellerPhone.trim() || undefined,
      email: newSellerEmail.trim() || undefined,
      active: true
    };

    onUpdateSellers([...sellers, newSeller]);
    setNewSellerName("");
    setNewSellerCommission(5);
    setNewSellerPhone("");
    setNewSellerEmail("");
    setIsAddingSeller(false);
  };

  // Launch commission as expense
  const handleConfirmLaunchExpense = () => {
    if (!sellerToLaunchExpense) return;

    const { seller, amount } = sellerToLaunchExpense;
    const newExpense: Expense = {
      id: `comm-${Date.now()}`,
      date: new Date().toISOString(),
      description: `Comissão de Vendas - ${seller.name} (${dateInterval.label})`,
      category: "Comissões",
      amount: parseFloat(amount.toFixed(2))
    };

    onAddExpense(newExpense);
    setSuccessNotice(`Despesa de comissão lançada com sucesso para ${seller.name} no valor de ${formatCurrency(amount)}!`);
    setSellerToLaunchExpense(null);

    setTimeout(() => {
      setSuccessNotice(null);
    }, 5000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header with Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#e5e5e5] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-md shadow-black/20">
              <Award size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Comissões de Vendedores</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Acompanhe as vendas individuais de cada vendedor e calcule a comissão exata a ser paga
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center bg-[#f5f5f5] rounded-2xl p-1 border border-gray-200">
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 px-3 py-2 outline-none cursor-pointer"
            >
              <option value="current-month">Este Mês (Atual)</option>
              <option value="last-month">Mês Anterior</option>
              <option value="last-30-days">Últimos 30 Dias</option>
              <option value="month-2">2 Meses Atrás</option>
              <option value="month-3">3 Meses Atrás</option>
              <option value="all">Todo o Histórico</option>
            </select>
          </div>

          {/* New Seller Button */}
          <button
            onClick={() => setIsAddingSeller(true)}
            className="bg-[#141414] text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all shadow-md shadow-black/10"
          >
            <Plus size={16} />
            Novo Vendedor
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sold */}
        <div className="bg-white p-6 rounded-3xl border border-[#e5e5e5] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vendas no Período</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {formatCurrency(totalPeriodSales)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-medium">
              <Calendar size={12} /> {dateInterval.label} • {salesInPeriod.length} vendas
            </p>
          </div>
        </div>

        {/* Total Commissions */}
        <div className="bg-white p-6 rounded-3xl border border-[#e5e5e5] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total em Comissões</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-600 tracking-tight">
              {formatCurrency(totalCommissionsCalculated)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              Previsão de comissões para a equipe
            </p>
          </div>
        </div>

        {/* Active Sellers */}
        <div className="bg-white p-6 rounded-3xl border border-[#e5e5e5] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vendedores Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {activeSellersCount} <span className="text-xs font-normal text-gray-400">/ {allSellers.length} cadastrados</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              Realizaram ao menos uma venda no período
            </p>
          </div>
        </div>

        {/* Top Seller */}
        <div className="bg-white p-6 rounded-3xl border border-[#e5e5e5] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Destaque de Vendas</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Award size={16} />
            </div>
          </div>
          <div>
            {topSeller ? (
              <>
                <div className="text-lg font-bold text-gray-900 truncate">
                  {topSeller.seller.name}
                </div>
                <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                  {formatCurrency(topSeller.totalSold)} ({topSeller.salesCount} vendas)
                </p>
              </>
            ) : (
              <div className="text-sm text-gray-400 font-medium py-1">Nenhuma venda registrada</div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por vendedor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all shadow-sm"
          />
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Exibindo dados apurados para: <span className="font-bold text-gray-800 capitalize">{dateInterval.label}</span>
        </div>
      </div>

      {/* Main Sellers & Commissions Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#e5e5e5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fcfcfc] border-b border-[#f5f5f5]">
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider text-center">Vendas</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Total Vendido</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Ticket Médio</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider text-center">Comissão (%)</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Valor Comissão</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider">Status Despesa</th>
                <th className="px-6 py-4 text-xs font-bold text-[#9e9e9e] uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {filteredSellerStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    Nenhum vendedor encontrado para o filtro atual.
                  </td>
                </tr>
              ) : (
                filteredSellerStats.map((item) => {
                  const { seller, totalSold, salesCount, averageTicket, commissionRate, commissionAmount, isLaunched, launchedData } = item;

                  return (
                    <tr key={seller.id} className="hover:bg-[#fcfcfc] transition-colors group">
                      {/* Seller Name & Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {seller.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                              {seller.name}
                              {topSeller && topSeller.seller.id === seller.id && totalSold > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  <Award size={10} /> Top 1
                                </span>
                              )}
                            </div>
                            {seller.phone && (
                              <span className="text-[11px] text-gray-400 block">{seller.phone}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sales Count */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {salesCount} {salesCount === 1 ? "venda" : "vendas"}
                        </span>
                      </td>

                      {/* Total Sold */}
                      <td className="px-6 py-4">
                        <div className="font-black text-sm text-gray-900">
                          {formatCurrency(totalSold)}
                        </div>
                        {totalPeriodSales > 0 && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {((totalSold / totalPeriodSales) * 100).toFixed(1)}% do total
                          </span>
                        )}
                      </td>

                      {/* Average Ticket */}
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        {formatCurrency(averageTicket)}
                      </td>

                      {/* Commission % Editable */}
                      <td className="px-6 py-4 text-center">
                        {editingCommissionSellerId === seller.id ? (
                          <div className="inline-flex items-center gap-1 bg-white border border-black rounded-xl p-1 shadow-sm">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={tempCommissionRate}
                              onChange={e => setTempCommissionRate(parseFloat(e.target.value) || 0)}
                              className="w-12 text-center text-xs font-bold outline-none"
                            />
                            <span className="text-xs font-bold text-gray-500">%</span>
                            <button
                              onClick={() => handleSaveCommissionRate(seller.id)}
                              className="bg-black text-white p-1 rounded-lg text-[10px] font-bold hover:bg-gray-800"
                              title="Salvar taxa"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingCommissionSellerId(null)}
                              className="text-gray-400 hover:text-gray-600 p-1 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingCommissionSellerId(seller.id);
                              setTempCommissionRate(commissionRate);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-dashed border-gray-300 hover:border-black text-xs font-bold text-gray-800 hover:bg-gray-50 transition-all"
                            title="Clique para alterar a porcentagem de comissão deste vendedor"
                          >
                            <span>{commissionRate}%</span>
                            <span className="text-[10px] text-gray-400">✎</span>
                          </button>
                        )}
                      </td>

                      {/* Commission Amount */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-red-600">
                          {formatCurrency(commissionAmount)}
                        </div>
                      </td>

                      {/* Expense Status */}
                      <td className="px-6 py-4">
                        {isLaunched ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Lançada ({formatCurrency(launchedData?.amount || commissionAmount)})</span>
                          </div>
                        ) : commissionAmount > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pendente de Lançamento
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Sem comissão</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Sales Details */}
                          <button
                            onClick={() => setSelectedSellerForSales(seller)}
                            disabled={salesCount === 0}
                            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Ver vendas deste vendedor"
                          >
                            <Eye size={18} />
                          </button>

                          {/* Launch Commission as Expense Button */}
                          <button
                            onClick={() => {
                              setSellerToLaunchExpense({
                                seller,
                                amount: commissionAmount,
                                totalSold,
                                count: salesCount
                              });
                            }}
                            disabled={commissionAmount <= 0 || isLaunched}
                            className={cn(
                              "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm",
                              isLaunched
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : commissionAmount > 0
                                ? "bg-black text-white hover:bg-gray-800"
                                : "bg-gray-100 text-gray-300 cursor-not-allowed"
                            )}
                            title={isLaunched ? "Comissão já lançada no período" : "Lançar valor da comissão em Despesas"}
                          >
                            <Receipt size={14} />
                            <span>{isLaunched ? "Já Lançado" : "Lançar Despesa"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Optional note about unassigned sales if any */}
        {unassignedSales.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              ℹ️ Há <strong>{unassignedSales.length} venda(s)</strong> sem vendedor atribuído neste período (total: {formatCurrency(unassignedTotal)}).
            </span>
            <span className="text-gray-400">
              Dica: ao registrar novas vendas, selecione o vendedor para cálculo automático de comissão.
            </span>
          </div>
        )}
      </div>

      {/* MODAL: View Seller Sales Details */}
      {selectedSellerForSales && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 sm:p-8 border-b border-[#f5f5f5] flex items-center justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 tracking-wider">
                  <UserCheck size={14} /> Detalhamento de Vendas
                </div>
                <h3 className="text-2xl font-black tracking-tight text-gray-900 mt-1">
                  {selectedSellerForSales.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Período: <span className="font-semibold text-gray-700 capitalize">{dateInterval.label}</span> • Taxa de Comissão: <span className="font-bold text-gray-900">{selectedSellerForSales.commissionRate}%</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedSellerForSales(null)} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sales Table in Modal */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {(() => {
                const sellerSales = salesInPeriod.filter(s => 
                  s.seller && s.seller.trim().toLowerCase() === selectedSellerForSales.name.trim().toLowerCase()
                );
                const sellerTotal = sellerSales.reduce((acc, s) => acc + s.total, 0);
                const sellerCommission = (sellerTotal * selectedSellerForSales.commissionRate) / 100;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total de Vendas</span>
                        <p className="text-lg font-black text-gray-900">{sellerSales.length}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Volume Faturado</span>
                        <p className="text-lg font-black text-gray-900">{formatCurrency(sellerTotal)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Comissão Apurada</span>
                        <p className="text-lg font-black text-red-600">{formatCurrency(sellerCommission)}</p>
                      </div>
                    </div>

                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Data</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Peças / Itens</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Pagamento</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Valor Venda</th>
                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase text-right">Comissão ({selectedSellerForSales.commissionRate}%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {sellerSales.map(sale => {
                            const itemCommission = (sale.total * selectedSellerForSales.commissionRate) / 100;
                            return (
                              <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                                  {format(parseISO(sale.date), "dd/MM/yyyy HH:mm")}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-0.5 max-w-xs">
                                    {sale.items.map((item, idx) => (
                                      <div key={idx} className="text-gray-800">
                                        <span className="font-bold">{item.quantity}x</span> {item.nameAtSale}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-600">
                                  <div className="flex items-center gap-1.5">
                                    {(sale.paymentMethod === "Crédito" || sale.paymentMethod === "Débito" || sale.paymentMethod === "Cartão") && <CreditCard size={12} />}
                                    {sale.paymentMethod === "Pix" && <QrCode size={12} />}
                                    {sale.paymentMethod === "Dinheiro" && <Banknote size={12} />}
                                    <span>{sale.paymentMethod}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-bold text-gray-900 text-right">
                                  {formatCurrency(sale.total)}
                                </td>
                                <td className="px-4 py-3 font-bold text-red-600 text-right">
                                  {formatCurrency(itemCommission)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 border-t border-[#f5f5f5] bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedSellerForSales(null)}
                className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Launch Commission as Expense Confirmation */}
      {sellerToLaunchExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 border-b border-[#f5f5f5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900">Lançar Despesa</h3>
                  <p className="text-xs text-gray-500">Registrar comissão no fluxo financeiro</p>
                </div>
              </div>
              <button onClick={() => setSellerToLaunchExpense(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Vendedor:</span>
                  <span className="font-bold text-gray-900">{sellerToLaunchExpense.seller.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Período de Apuração:</span>
                  <span className="font-bold text-gray-900 capitalize">{dateInterval.label}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Vendas Realizadas:</span>
                  <span className="font-bold text-gray-900">{sellerToLaunchExpense.count} vendas ({formatCurrency(sellerToLaunchExpense.totalSold)})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Taxa de Comissão:</span>
                  <span className="font-bold text-gray-900">{sellerToLaunchExpense.seller.commissionRate}%</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-gray-700">Valor da Comissão:</span>
                  <span className="text-xl font-black text-red-600">
                    {formatCurrency(sellerToLaunchExpense.amount)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-blue-800">
                Esta ação criará um registro em <strong>Despesas</strong> na categoria <strong>Comissões</strong> e descontará este valor do lucro líquido da loja no Dashboard.
              </div>
            </div>

            <div className="p-6 border-t border-[#f5f5f5] bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSellerToLaunchExpense(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLaunchExpense}
                className="px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-md shadow-black/10 flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                Confirmar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register New Seller */}
      {isAddingSeller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 border-b border-[#f5f5f5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900">Novo Vendedor</h3>
                  <p className="text-xs text-gray-500">Cadastre um vendedor e defina a comissão</p>
                </div>
              </div>
              <button onClick={() => setIsAddingSeller(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSeller} className="p-6 sm:p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome Completo do Vendedor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Lima"
                  value={newSellerName}
                  onChange={e => setNewSellerName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Porcentagem de Comissão (%) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="Ex: 5"
                    value={newSellerCommission}
                    onChange={e => setNewSellerCommission(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">%</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Taxa padrão aplicada sobre o valor total vendido pelo profissional.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={newSellerPhone}
                    onChange={e => setNewSellerPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl text-xs font-medium outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">E-mail</label>
                  <input
                    type="email"
                    placeholder="vendedor@email.com"
                    value={newSellerEmail}
                    onChange={e => setNewSellerEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#f5f5f5] rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-[#f5f5f5] bg-gray-50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingSeller(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-md shadow-black/10"
                >
                  Salvar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
