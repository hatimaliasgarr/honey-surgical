import { AdminShell } from "@/components/admin/admin-shell";
import { InquiryStatusControl } from "@/components/admin/inquiry-status-control";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/admin";
import { getRecentInquiries } from "@/lib/repositories/catalog-repository";

export default async function AdminInquiriesPage() {
  const [session, inquiries] = await Promise.all([requireAdmin(), getRecentInquiries()]);

  return (
    <AdminShell session={session}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-medical-deep">Inquiry Management</h1>
          <p className="mt-2 text-muted-foreground">Track quote requests from product pages and contact forms.</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-lg text-medical-deep mb-4">Inquiries</h2>
          
          {/* Mobile Card List View */}
          <div className="grid gap-4 md:hidden">
            {inquiries.map((inquiry) => (
              <div 
                key={inquiry.id} 
                className="flex flex-col gap-2 rounded-xl border border-border/80 bg-medical-bluePale/5 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-sm text-medical-deep leading-tight">
                    {inquiry.customerName}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                    {new Date(inquiry.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-2.5 mt-1">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Contact</span>
                    <a href={`mailto:${inquiry.email}`} className="block hover:text-primary truncate">
                      {inquiry.email}
                    </a>
                    <a href={`tel:${inquiry.phone}`} className="block text-muted-foreground hover:text-primary">
                      {inquiry.phone}
                    </a>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Product</span>
                    <span className="truncate block max-w-full">
                      {inquiry.productName || <Badge variant="secondary" className="text-[9px]">General</Badge>}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-2.5 mt-1 text-xs">
                  <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Message</span>
                  <p className="text-muted-foreground italic leading-normal text-[11px]">
                    &quot;{inquiry.message}&quot;
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2.5 mt-1">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Status</span>
                  <InquiryStatusControl inquiryId={inquiry.id} status={inquiry.status} />
                </div>
              </div>
            ))}
            {!inquiries.length ? (
              <div className="py-8 text-center text-muted-foreground border border-dashed rounded-xl bg-white">
                No inquiries yet.
              </div>
            ) : null}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">{inquiry.customerName}</TableCell>
                    <TableCell>
                      <a href={`mailto:${inquiry.email}`} className="block hover:text-primary">
                        {inquiry.email}
                      </a>
                      <a href={`tel:${inquiry.phone}`} className="block text-muted-foreground hover:text-primary">
                        {inquiry.phone}
                      </a>
                    </TableCell>
                    <TableCell>{inquiry.productName || <Badge variant="secondary">General</Badge>}</TableCell>
                    <TableCell className="max-w-xs truncate">{inquiry.message}</TableCell>
                    <TableCell>
                      <InquiryStatusControl inquiryId={inquiry.id} status={inquiry.status} />
                    </TableCell>
                    <TableCell>{new Date(inquiry.createdAt).toLocaleDateString("en-IN")}</TableCell>
                  </TableRow>
                ))}
                {!inquiries.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No inquiries yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
