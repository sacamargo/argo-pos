import { getPosCatalog } from "@/modules/pos/services/catalog-service";
import { PosScreen } from "@/modules/pos/components/pos-screen";

export default async function PosPage() {
  const catalog = await getPosCatalog();

  return (
    <PosScreen
      categories={catalog.categories}
      products={catalog.products}
      variants={catalog.variants}
      paymentMethods={catalog.paymentMethods}
    />
  );
}
