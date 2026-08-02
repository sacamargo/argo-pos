import { notFound } from "next/navigation";
import { getSaleById } from "@/modules/pos/services/sale-query-service";
import { getCurrentProfile } from "@/modules/auth/services/auth-service";
import { canReverseSale } from "@/modules/core/permissions";
import type { Role } from "@/modules/core/constants";
import { SaleDetailView } from "@/modules/pos/components/sale-detail-view";

type SalePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SaleDetailPage({ params }: SalePageProps) {
  const { id } = await params;
  const [sale, profile] = await Promise.all([
    getSaleById(id),
    getCurrentProfile(),
  ]);

  if (!sale) notFound();

  return (
    <div className="h-full overflow-y-auto">
      <SaleDetailView
        sale={sale}
        canReverse={
          profile ? canReverseSale(profile.role as Role) : false
        }
      />
    </div>
  );
}
