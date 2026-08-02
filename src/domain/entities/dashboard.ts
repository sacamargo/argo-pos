import type { Ingredient } from "@/domain/entities/ingredient";
import type { SaleListItem } from "@/domain/entities/sale";

export type DashboardProductStat = {
  productName: string;
  quantity: number;
  revenueCents: number;
};

export type DashboardSnapshot = {
  date: string;
  salesCount: number;
  revenueCents: number;
  unitsSold: number;
  topProducts: DashboardProductStat[];
  lastSale: SaleListItem | null;
  cashOpen: boolean;
  cashOpeningCents: number | null;
  lowStock: Ingredient[];
};
