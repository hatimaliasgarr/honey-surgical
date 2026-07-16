import { AdminShell } from "@/components/admin/admin-shell";
import { TemplateForm } from "@/components/admin/template-form";
import { requireAdmin } from "@/lib/auth/admin";
import { getAllTemplates } from "@/lib/repositories/catalog-repository";

export default async function AdminTemplatesPage() {
  const [session, templates] = await Promise.all([
    requireAdmin(),
    getAllTemplates(),
  ]);

  return (
    <AdminShell session={session}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-medical-deep">
            Preset Templates
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage reusable product description templates, specifications JSON, keywords, and features.
          </p>
        </div>
        <TemplateForm templates={templates} />
      </div>
    </AdminShell>
  );
}
