import ModuleLayout from '@/components/auth/ModuleLayout';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ModuleLayout permission="view_impresoras">{children}</ModuleLayout>;
}
