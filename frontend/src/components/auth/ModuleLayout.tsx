import { requirePermission } from '@/lib/server-api';

export default async function ModuleLayout({ permission, children }: { permission: string; children: React.ReactNode }) {
  await requirePermission(permission);
  return children;
}
