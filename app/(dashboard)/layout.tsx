import { getSaasApps } from '@/lib/data';
import { Sidebar } from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const saas = await getSaasApps();

  return (
    <div className="app">
      <Sidebar saas={saas} />
      <div className="main">{children}</div>
    </div>
  );
}
