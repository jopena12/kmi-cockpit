import { TopBar } from '@/components/TopBar';
import { NewSaasForm } from '@/components/NewSaasForm';

export default function NewSaasPage() {
  return (
    <>
      <TopBar title="Ajouter un SaaS" subtitle="Connecter un nouveau produit au Cockpit" showBack />
      <div className="content">
        <NewSaasForm />
      </div>
    </>
  );
}
