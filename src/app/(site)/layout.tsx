import { LogoHeader } from "@/components/LogoHeader";
import { getStore } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { logo } = await getStore();
  return (
    <>
      <LogoHeader logo={logo} />
      <main className="flex-1 bg-white">{children}</main>
    </>
  );
}
