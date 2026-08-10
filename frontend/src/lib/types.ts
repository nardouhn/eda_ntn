export type Branch = {
  branch_code: string;
  branch_name: string;
  region: string | null;
  brand: string | null;
  status: "Hoạt động" | "Vô hiệu hóa"; // Đã sửa type status
};

export type TrendPoint = { month: string; value: number | null };

export type ItemRow = {
  base_sku: string;
  branch_code: string;
  sku_name: string | null;
  factory_code: string;
  size_code: string;
  product_code: string;
  status: "Hoạt động" | "Vô hiệu hóa"; // Đã sửa type status
  active_variant_count: number;
  inactive_variant_count: number;
  variant_count: number;
  last_positive_sale_month: string | null;
  gross_qty_12m: number;
  return_qty_12m: number;
  net_qty_12m: number;
  trend: TrendPoint[];
};

export type Variant = {
  bravo_sku: string;
  sku_name: string | null;
  color_suffix: string | null;
  has_color_suffix: boolean;
  status: "Hoạt động" | "Vô hiệu hóa"; // Đã sửa type status
  in_disabled_master: boolean;
  first_observed_month: string | null;
  last_observed_month: string | null;
  last_positive_sale_month: string | null;
};
