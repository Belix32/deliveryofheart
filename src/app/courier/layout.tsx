import { requireCourier } from "@/lib/auth/guards";
import CourierShell from "./CourierShell";

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCourier();
  return <CourierShell>{children}</CourierShell>;
}
