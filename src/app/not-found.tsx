import { LogoHeader } from "@/components/LogoHeader";
import { getStore } from "@/lib/content";

export default async function NotFound() {
  const { logo } = await getStore();
  return (
    <>
      <LogoHeader logo={logo} />
      <div dir="rtl" lang="ar" className="flex flex-1 flex-col items-center bg-white px-4 py-32 text-center">
        <p className="font-[family-name:var(--font-cairo)] text-5xl font-black text-ink">404</p>
        <p className="mt-4 font-[family-name:var(--font-cairo)] text-xl text-muted">الصفحة غير موجودة</p>
      </div>
    </>
  );
}
