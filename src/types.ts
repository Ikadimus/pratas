export interface ProductComponent {
  id: string;
  name: string;
  costPerUnit: number;
  sellingPricePerUnit: number;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sellingPricePerUnit: number;
  costPerUnit: number;
  stock: number;
  imageUrl?: string;
  isSet?: boolean;
  components?: ProductComponent[];
  discountPercentage?: number;
  discountStart?: string;
  discountEnd?: string;
  description?: string;
  material?: string;
  finish?: string;
  dimensions?: string;
  weight?: string;
  stone?: string;
  warranty?: string;
  packaging?: string;
  hypoallergenic?: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  priceAtSale: number;
  nameAtSale: string;
}

export interface Seller {
  id: string;
  name: string;
  commissionRate: number; // Porcentagem padrão de comissão (ex: 5 para 5%)
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: "Crédito" | "Débito" | "Pix" | "Dinheiro" | "Cartão";
  feeAmount?: number;
  netAmount?: number;
  seller?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  roleId: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[]; // Array of tab IDs: "dashboard", "inventory", "sales", "expenses", "settings"
}

export interface Contacts {
  whatsapp: string;
  instagram: string;
  facebook: string;
  email: string;
  phone: string;
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  users: User[];
  roles: Role[];
  expenseCategories: string[];
  productCategories: string[];
  creditFee: number;
  debitFee: number;
  aboutUs: string;
  silverCare: string;
  contacts: Contacts;
  sellers: Seller[];
}
