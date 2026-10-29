import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <div dir="rtl" lang="ar" className="flex flex-1 flex-col items-center bg-white px-4 py-32 text-center">
        <p className="font-[family-name:var(--font-cairo)] text-5xl font-black text-ink">404</p>
        <p className="mt-4 font-[family-name:var(--font-cairo)] text-xl text-muted">الصفحة غير موجودة</p>
      </div>
    </>
  );
}
