"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  FileText, Receipt, Shield, FolderOpen, Mail,
  ClipboardCheck, Banknote, Download, AlertCircle, CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

const API_BASE = "";

interface ClientDocument {
  id: number;
  name: string;
  document_type: string;
  is_signed: boolean;
  file_url: string | null;
  uploaded_by_name: string;
  created_at: string;
  expires_at: string | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  issued_date: string;
  total: string;
  status: string;
  pdf: string | null;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  CONTRACT:       FileText,
  RECEIPT:        Receipt,
  AGREEMENT:      ClipboardCheck,
  ID_DOCUMENT:    Shield,
  PROOF_OF_FUNDS: Banknote,
  OTHER:          FolderOpen,
};

function fmt(v: string | number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    typeof v === "string" ? parseFloat(v) : v
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isExpiringSoon(expires_at: string | null): boolean {
  if (!expires_at) return false;
  const diff = new Date(expires_at).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function DocumentCard({ doc }: { doc: ClientDocument }) {
  const Icon = TYPE_ICONS[doc.document_type] ?? FolderOpen;
  const expiring = isExpiringSoon(doc.expires_at);

  return (
    <div className="bg-surface rounded-lg border border-outline-variant/50 hover:bg-surface-container transition-colors p-4 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[16px] leading-6 font-semibold text-on-surface truncate">{doc.name}</p>
          {doc.is_signed && (
            <span className="flex items-center gap-1 text-[12px] leading-4 font-semibold text-[#2E7D32] bg-primary-fixed/50 px-2 py-0.5 rounded-full shrink-0">
              <CheckCircle size={11} />
              Signed
            </span>
          )}
        </div>
        <p className="text-[12px] leading-4 text-on-surface-variant mt-0.5">{fmtDate(doc.created_at)}</p>
        {expiring && doc.expires_at && (
          <div className="flex items-center gap-1 mt-1.5 text-[12px] leading-4 font-medium text-terracotta-warm">
            <AlertCircle size={12} />
            Expires {fmtDate(doc.expires_at)}
          </div>
        )}
        {doc.file_url && (
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[14px] font-semibold text-primary hover:underline"
          >
            <Download size={13} />
            Download
          </a>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch(`${API_BASE}/api/v1/documents/my-documents/`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setDocuments(d?.results ?? (Array.isArray(d) ? d : []))),
      apiFetch(`${API_BASE}/api/v1/transactions/my-invoices/`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setInvoices(d?.results ?? (Array.isArray(d) ? d : []))),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const paidWithPdf = invoices.filter((i) => i.status === "PAID" && i.pdf);

  return (
    <div className="p-4 md:p-12 w-full max-w-7xl mx-auto">

      {/* Header */}
      <header className="mb-12">
        <h2 className="font-serif font-bold text-on-surface mb-2 text-[32px] leading-10 md:text-[48px] md:leading-[56px]" style={{ letterSpacing: "-0.02em" }}>
          My Documents
        </h2>
        <p className="text-[18px] leading-7 text-on-surface-variant">
          Lease agreements, receipts, and files — all in one place.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Documents list */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8">Your Files</h3>
              <span className="text-[12px] leading-4 text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full font-medium">
                {loading ? "…" : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center px-6">
                <Image
                  src="/illustrations/spot-clipboard.png"
                  alt=""
                  width={100}
                  height={100}
                  className="mb-4 opacity-90"
                />
                <h4 className="font-serif text-[18px] leading-7 font-semibold text-on-surface mb-2">No documents yet</h4>
                <p className="text-[16px] leading-6 text-on-surface-variant max-w-sm mb-6">
                  Your lease agreement and files will appear here once your tenancy is confirmed.
                </p>
                <a
                  href="mailto:info@primefamilyhousing.com?subject=Document Request"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary text-[14px] tracking-[0.05em] font-semibold px-6 py-3 rounded-lg hover:bg-primary-container transition-colors active:scale-[0.98]"
                >
                  <Mail size={14} strokeWidth={2} />
                  Request a Document
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </section>

          {/* Payment Receipts */}
          {(loading || paidWithPdf.length > 0) && (
            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6">
              <div className="mb-6">
                <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8">Payment Receipts</h3>
                <p className="text-[14px] leading-5 text-on-surface-variant mt-1">Download PDF receipts for your paid invoices</p>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-14 rounded-lg bg-surface-container animate-pulse" />)}
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/60">
                  {paidWithPdf.map((inv) => (
                    <div key={inv.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                          <Receipt size={20} className="text-primary" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[16px] leading-6 font-semibold text-on-surface truncate">{inv.invoice_number}</p>
                          <p className="text-[12px] leading-4 text-on-surface-variant">{fmtDate(inv.issued_date)} · {fmt(inv.total)}</p>
                        </div>
                      </div>
                      <a
                        href={inv.pdf!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary border border-outline px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors shrink-0 active:scale-[0.98]"
                      >
                        <Download size={13} />
                        PDF
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Side column ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Info card */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-4">
              <FolderOpen size={20} className="text-primary" strokeWidth={1.8} />
            </div>
            <h3 className="font-serif font-semibold text-on-surface text-[18px] leading-7 mb-2">Managed by your property team</h3>
            <p className="text-[14px] leading-5 text-on-surface-variant">
              Lease agreements, receipts, and verification documents are uploaded by
              PrimeFamilyHousing staff once your tenancy is set up. Need a specific document?
              Email us and we&apos;ll handle it promptly.
            </p>
            <a
              href="mailto:info@primefamilyhousing.com?subject=Document Request"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary mt-4 hover:underline"
            >
              <Mail size={13} />
              info@primefamilyhousing.com
            </a>
          </section>

          {/* Urgent CTA — image-card style like the dashboard */}
          <section className="bg-forest-deep rounded-xl shadow-sm p-6">
            <p className="text-[16px] leading-6 text-on-primary/80 mb-1">Need a document urgently?</p>
            <h3 className="font-serif font-semibold text-on-primary text-[24px] leading-8 mb-4">Our Team is Ready.</h3>
            <p className="text-[12px] leading-4 text-on-primary/60 mb-5">We respond within 1 business day.</p>
            <a
              href="mailto:info@primefamilyhousing.com?subject=Urgent Document Request"
              className="w-full flex items-center justify-center gap-2 bg-earth-beige text-on-secondary-container text-[14px] tracking-[0.05em] font-semibold px-4 py-3 rounded-lg hover:bg-surface transition-colors active:scale-[0.98]"
            >
              <Mail size={14} strokeWidth={2} />
              Email Our Team
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
