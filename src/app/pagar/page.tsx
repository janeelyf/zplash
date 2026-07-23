import { Suspense } from "react";
import { getPreciosPublicos } from "@/lib/preciosPublicos";
import PagarForm from "@/components/cliente/PagarForm";

// Ver nota en /cliente/page.tsx: precios siempre frescos desde la base.
export const dynamic = "force-dynamic";

export default async function PagarPageWrapper() {
  const precios = await getPreciosPublicos();

  return (
    <Suspense>
      <PagarForm precios={precios} />
    </Suspense>
  );
}
