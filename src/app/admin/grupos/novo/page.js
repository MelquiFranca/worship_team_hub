import AdminGroupForm from '@/components/organisms/AdminGroupForm/AdminGroupForm';

export const metadata = {
  title: 'Novo Grupo Admin | Worship Team Hub',
  description: 'Cadastro administrativo de grupo com configuracoes iniciais e gestor group-app.'
};

export default function AdminCreateGroupPage() {
  return <AdminGroupForm mode="create" />;
}
