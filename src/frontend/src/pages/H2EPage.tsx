import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Box,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileDown,
  FileSignature,
  History,
  Package,
  PackageMinus,
  PackagePlus,
  Rocket,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  quantity: number;
}

interface WithdrawalItem {
  productName: string;
  quantity: number;
}

interface WithdrawalRecord {
  id: number;
  beneficiaryName: string;
  date: string;
  items: WithdrawalItem[];
}

// ── LocalStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = "h2e_products";
const WITHDRAWALS_KEY = "h2e_withdrawals";

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadWithdrawals(): WithdrawalRecord[] {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WithdrawalRecord[];
  } catch {
    return [];
  }
}

function saveWithdrawals(withdrawals: WithdrawalRecord[]): void {
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(withdrawals));
}

function nextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((p) => p.id)) + 1;
}

// ── HTML escape ───────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── PDF Export – Estoque ──────────────────────────────────────────────────────

function exportStockToPdf(products: Product[]): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const rows = products
    .map(
      (p) => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px;">${escapeHtml(p.name)}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center; font-weight: 600;">${p.quantity}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>H2E – Controle de Estoque</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #7c3aed; }
    .logo { width: 52px; height: 52px; background: linear-gradient(135deg, #4f1d96, #7c3aed); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .logo-text { color: white; font-size: 22px; font-weight: 900; }
    .title { font-size: 28px; font-weight: 800; color: #1a0533; letter-spacing: -0.5px; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .meta { margin-bottom: 28px; padding: 16px; background: #f8f4ff; border-radius: 8px; border-left: 4px solid #7c3aed; }
    .meta p { font-size: 13px; color: #4b5563; margin-bottom: 4px; }
    .meta strong { color: #1a0533; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: linear-gradient(135deg, #1a0533, #7c3aed); }
    thead th { padding: 12px 16px; color: white; font-size: 13px; font-weight: 600; text-align: left; }
    thead th:last-child { text-align: center; }
    tbody tr:nth-child(even) { background: #f9f7ff; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
    .total-row td { padding: 12px 16px; font-weight: 700; font-size: 14px; background: #f3eeff; border-top: 2px solid #7c3aed; }
    .total-row td:last-child { text-align: center; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo"><span class="logo-text">H2</span></div>
      <div>
        <div class="title">H2E – Controle de Estoque</div>
        <div class="subtitle">Relatório de Estoque</div>
      </div>
    </div>
    <div class="meta">
      <p><strong>Data de exportação:</strong> ${dateStr}</p>
      <p><strong>Hora:</strong> ${timeStr}</p>
      <p><strong>Total de produtos:</strong> ${products.length}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Nome do Produto</th>
          <th>Quantidade</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td>TOTAL EM ESTOQUE</td>
          <td>${products.reduce((a, p) => a + p.quantity, 0)}</td>
        </tr>
      </tbody>
    </table>
    <div class="footer">
      Gerado automaticamente pelo sistema H2E – Controle de Estoque &nbsp;|&nbsp;
      Exportado em ${dateStr} às ${timeStr}
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  openPrintWindow(html, `h2e-estoque-${dateStr.replace(/\//g, "-")}.html`);
}

// ── PDF Export – Comprovante de Retirada ──────────────────────────────────────

function exportWithdrawalToPdf(record: WithdrawalRecord): void {
  const recordDate = new Date(record.date);
  const dateStr = recordDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = recordDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemRows = record.items
    .map(
      (item, i) => `
      <tr style="${i % 2 === 1 ? "background: #f9f7ff;" : ""}">
        <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px;">${escapeHtml(item.productName)}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center; font-weight: 600;">${item.quantity}</td>
      </tr>`,
    )
    .join("");

  const totalQty = record.items.reduce((a, i) => a + i.quantity, 0);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>H2E – Comprovante de Retirada #${record.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 3px solid #7c3aed; }
    .logo { width: 52px; height: 52px; background: linear-gradient(135deg, #4f1d96, #7c3aed); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-text { color: white; font-size: 22px; font-weight: 900; }
    .header-text .title { font-size: 24px; font-weight: 800; color: #1a0533; letter-spacing: -0.5px; }
    .header-text .subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .doc-id { margin-left: auto; text-align: right; font-size: 12px; color: #9ca3af; }
    .doc-id strong { font-size: 16px; color: #7c3aed; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; margin-bottom: 10px; }
    .beneficiary-box { margin-bottom: 24px; padding: 16px 20px; background: #f8f4ff; border-radius: 10px; border-left: 4px solid #7c3aed; }
    .beneficiary-name { font-size: 20px; font-weight: 700; color: #1a0533; margin-bottom: 4px; }
    .beneficiary-meta { font-size: 13px; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    .table-wrap { border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    thead tr { background: linear-gradient(135deg, #1a0533, #7c3aed); }
    thead th { padding: 12px 16px; color: white; font-size: 13px; font-weight: 600; text-align: left; }
    thead th:last-child { text-align: center; }
    .total-row td { padding: 12px 16px; font-weight: 700; font-size: 14px; background: #f3eeff; border-top: 2px solid #7c3aed; }
    .total-row td:last-child { text-align: center; color: #4f1d96; }
    .signature-section { margin-top: 32px; padding: 24px; border: 1px dashed #c4b5fd; border-radius: 12px; background: #fefcff; }
    .declaration { font-size: 13px; color: #4b5563; font-style: italic; margin-bottom: 28px; line-height: 1.6; padding-bottom: 16px; border-bottom: 1px solid #e9e3ff; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .sig-block { display: flex; flex-direction: column; gap: 8px; }
    .sig-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .sig-line { border-bottom: 1px solid #1a1a2e; padding-bottom: 4px; min-height: 40px; }
    .sig-name { font-size: 12px; color: #9ca3af; margin-top: 4px; }
    .sig-date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .date-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .date-line { border-bottom: 1px solid #1a1a2e; padding-bottom: 4px; min-height: 32px; }
    .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo"><span class="logo-text">H2</span></div>
      <div class="header-text">
        <div class="title">H2E – Controle de Estoque</div>
        <div class="subtitle">Comprovante de Retirada de Materiais</div>
      </div>
      <div class="doc-id">
        Nº do Comprovante<br/>
        <strong>#${String(record.id).padStart(4, "0")}</strong>
      </div>
    </div>

    <div class="section-title">Dados do Beneficiário</div>
    <div class="beneficiary-box">
      <div class="beneficiary-name">${escapeHtml(record.beneficiaryName)}</div>
      <div class="beneficiary-meta">Data da retirada: <strong>${dateStr}</strong> às <strong>${timeStr}</strong></div>
    </div>

    <div class="section-title">Itens Retirados</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item / Produto</th>
            <th style="text-align:center">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr class="total-row">
            <td>TOTAL DE ITENS RETIRADOS</td>
            <td style="text-align:center">${totalQty} un.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="signature-section">
      <div class="section-title" style="margin-bottom:14px">Declaração e Assinatura</div>
      <div class="declaration">
        Declaro que recebi os itens acima relacionados em perfeito estado, conferindo as quantidades e condições de cada produto, estando de acordo com o descrito neste comprovante.
      </div>
      <div class="sig-grid">
        <div class="sig-block">
          <div class="sig-label">Assinatura do Beneficiário</div>
          <div class="sig-line"></div>
          <div class="sig-name">${escapeHtml(record.beneficiaryName)}</div>
        </div>
        <div class="sig-block">
          <div class="sig-label">Responsável pela Entrega</div>
          <div class="sig-line"></div>
          <div class="sig-name">Nome / Matrícula</div>
        </div>
      </div>
      <div class="sig-date-grid">
        <div>
          <div class="date-label">Data: _____ / _____ / ___________</div>
        </div>
        <div>
          <div class="date-label">Horário: _______ : _______</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Documento gerado por H2E – Controle de Estoque &nbsp;|&nbsp; ${dateStr} às ${timeStr}
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  openPrintWindow(
    html,
    `h2e-retirada-${String(record.id).padStart(4, "0")}-${escapeHtml(record.beneficiaryName.replace(/\s+/g, "-").toLowerCase())}.html`,
  );
}

function openPrintWindow(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── Starfield SVG ─────────────────────────────────────────────────────────────

function StarField() {
  const stars = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    cx: Math.random() * 100,
    cy: Math.random() * 100,
    r: Math.random() * 1.4 + 0.3,
    opacity: Math.random() * 0.7 + 0.2,
    animClass: i % 3 === 0 ? "star-1" : i % 3 === 1 ? "star-2" : "star-3",
  }));

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {stars.map((s) => (
        <circle
          key={s.id}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="oklch(0.92 0.04 295)"
          opacity={s.opacity}
          className={s.animClass}
        />
      ))}
    </svg>
  );
}

// ── Card style helper ─────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "oklch(0.13 0.06 295 / 0.85)",
  backdropFilter: "blur(16px)",
  border: "1px solid oklch(0.30 0.12 295 / 0.5)",
  boxShadow:
    "0 8px 32px oklch(0.08 0.04 295 / 0.8), inset 0 1px 0 oklch(0.40 0.14 295 / 0.2)",
};

const inputStyle: React.CSSProperties = {
  background: "oklch(0.10 0.04 295 / 0.8)",
  border: "1px solid oklch(0.28 0.10 295 / 0.6)",
  color: "oklch(0.92 0.04 295)",
};

function CardIconBox({
  children,
  hue = 295,
}: {
  children: React.ReactNode;
  hue?: number;
}) {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
      style={{
        background: `oklch(0.22 0.12 ${hue} / 0.8)`,
        border: `1px solid oklch(0.40 0.18 ${hue} / 0.4)`,
      }}
    >
      {children}
    </div>
  );
}

function GradientTitle({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background:
          "linear-gradient(135deg, oklch(0.90 0.06 295), oklch(0.78 0.20 295))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function H2EPage() {
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [withdrawals, setWithdrawals] =
    useState<WithdrawalRecord[]>(loadWithdrawals);

  // Cadastro form state
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [addLoading] = useState(false);

  // Nova retirada state
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [withdrawSelectId, setWithdrawSelectId] = useState<string>("");
  const [withdrawItemQty, setWithdrawItemQty] = useState("");
  const [pendingItems, setPendingItems] = useState<WithdrawalItem[]>([]);
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  // History section
  const [historyOpen, setHistoryOpen] = useState(true);

  // Persist to localStorage whenever products/withdrawals change
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveWithdrawals(withdrawals);
  }, [withdrawals]);

  const totalItems = products.reduce((a, p) => a + p.quantity, 0);

  // ── Cadastrar produto ────────────────────────────────────────────────────────
  const handleAddProduct = useCallback(() => {
    const name = newName.trim();
    const qtyRaw = newQty.trim();

    if (!name) {
      toast.error("Informe o nome do produto.");
      return;
    }
    if (qtyRaw === "") {
      toast.error("Informe a quantidade inicial.");
      return;
    }
    const qty = Number.parseInt(qtyRaw, 10);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("Informe uma quantidade válida (número ≥ 0).");
      return;
    }

    const newProduct = { id: nextId(products), name, quantity: qty };
    setProducts((prev) => [...prev, newProduct]);
    setNewName("");
    setNewQty("");
    toast.success(`Produto "${name}" cadastrado com sucesso!`);
  }, [newName, newQty, products]);

  // ── Deletar produto ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (id: number, name: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      // Remove from pending withdrawal if listed
      setPendingItems((prev) => prev.filter((i) => i.productName !== name));
      if (withdrawSelectId === String(id)) setWithdrawSelectId("");
      toast.success(`Produto "${name}" excluído.`);
    },
    [withdrawSelectId],
  );

  // ── Adicionar item à lista de retirada ───────────────────────────────────────
  const handleAddWithdrawItem = useCallback(() => {
    const id = Number.parseInt(withdrawSelectId, 10);
    const qty = Number.parseInt(withdrawItemQty, 10);

    if (!withdrawSelectId) {
      toast.error("Selecione um produto para adicionar.");
      return;
    }
    if (Number.isNaN(qty) || qty < 1) {
      toast.error("Informe uma quantidade válida (≥ 1).");
      return;
    }

    const product = products.find((p) => p.id === id);
    if (!product) {
      toast.error("Produto não encontrado.");
      return;
    }

    // Calculate already-pending quantity for this product
    const alreadyPending = pendingItems
      .filter((i) => i.productName === product.name)
      .reduce((a, i) => a + i.quantity, 0);

    if (qty + alreadyPending > product.quantity) {
      toast.error("Quantidade insuficiente em estoque.", {
        description: `Disponível: ${product.quantity - alreadyPending} un. (${alreadyPending > 0 ? `${alreadyPending} já adicionadas` : ""})`,
      });
      return;
    }

    // Merge with existing pending item for same product
    setPendingItems((prev) => {
      const existing = prev.find((i) => i.productName === product.name);
      if (existing) {
        return prev.map((i) =>
          i.productName === product.name
            ? { ...i, quantity: i.quantity + qty }
            : i,
        );
      }
      return [...prev, { productName: product.name, quantity: qty }];
    });

    setWithdrawSelectId("");
    setWithdrawItemQty("");
    toast.success(`"${product.name}" adicionado à retirada.`);
  }, [withdrawSelectId, withdrawItemQty, products, pendingItems]);

  // ── Remover item da lista pendente ───────────────────────────────────────────
  const handleRemovePendingItem = useCallback((productName: string) => {
    setPendingItems((prev) =>
      prev.filter((i) => i.productName !== productName),
    );
  }, []);

  // ── Finalizar retirada ───────────────────────────────────────────────────────
  const handleFinalizeWithdrawal = useCallback(() => {
    const name = beneficiaryName.trim();
    if (!name) {
      toast.error("Informe o nome do beneficiário.");
      return;
    }
    if (pendingItems.length === 0) {
      toast.error("Adicione ao menos um item à retirada.");
      return;
    }

    // Capture values before any state updates
    const itemsSnapshot = [...pendingItems];
    const itemCount = itemsSnapshot.length;

    setFinalizeLoading(true);

    // Deduct quantities from stock
    setProducts((prev) =>
      prev.map((p) => {
        const item = itemsSnapshot.find((i) => i.productName === p.name);
        if (!item) return p;
        return { ...p, quantity: p.quantity - item.quantity };
      }),
    );

    // Save withdrawal record
    const newRecord: WithdrawalRecord = {
      id: 0, // will be replaced below
      beneficiaryName: name,
      date: new Date().toISOString(),
      items: itemsSnapshot,
    };

    setWithdrawals((prev) => {
      const withId = { ...newRecord, id: nextId(prev) };
      return [withId, ...prev];
    });

    // Reset form
    setBeneficiaryName("");
    setPendingItems([]);
    setWithdrawSelectId("");
    setWithdrawItemQty("");
    setFinalizeLoading(false);

    toast.success("Retirada finalizada com sucesso!", {
      description: `${itemCount} item(ns) retirado(s) para ${name}.`,
    });
  }, [beneficiaryName, pendingItems]);

  // ── Deletar registro de retirada ─────────────────────────────────────────────
  const handleDeleteWithdrawal = useCallback((id: number) => {
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));
    toast.success("Registro de retirada excluído.");
  }, []);

  // ── Export PDF – stock ───────────────────────────────────────────────────────
  const handleExportStock = useCallback(() => {
    if (products.length === 0) {
      toast.error("Nenhum produto para exportar.");
      return;
    }
    exportStockToPdf(products);
    toast.success(
      "Relatório gerado! Uma nova janela foi aberta para impressão.",
    );
  }, [products]);

  // ── Export PDF – withdrawal ──────────────────────────────────────────────────
  const handleExportWithdrawal = useCallback((record: WithdrawalRecord) => {
    exportWithdrawalToPdf(record);
    toast.success(
      "Comprovante gerado! Uma nova janela foi aberta para impressão.",
    );
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Galaxy background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url('/assets/generated/h2e-galaxy-bg.dim_1920x1080.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.08 0.05 295 / 0.75) 0%, oklch(0.06 0.04 295 / 0.85) 100%)",
        }}
      />
      {/* Starfield */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <StarField />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full px-4 py-5 sm:py-6"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.10 0.06 295 / 0.95) 0%, transparent 100%)",
            borderBottom: "1px solid oklch(0.35 0.12 295 / 0.3)",
          }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.30 0.18 295), oklch(0.55 0.25 310))",
                  boxShadow:
                    "0 0 20px oklch(0.62 0.22 295 / 0.5), 0 0 40px oklch(0.55 0.25 310 / 0.2)",
                }}
              >
                <Rocket className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                <Sparkles
                  className="absolute -top-1 -right-1 h-3 w-3"
                  style={{ color: "oklch(0.85 0.18 80)" }}
                />
              </div>
              <div>
                <h1
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-none"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.90 0.08 295), oklch(0.78 0.22 295), oklch(0.72 0.22 310))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  H2E
                </h1>
                <p
                  className="text-xs sm:text-sm font-medium tracking-widest uppercase"
                  style={{ color: "oklch(0.65 0.14 295)" }}
                >
                  Controle de Estoque
                </p>
              </div>
            </div>

            {/* Stats badges */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: "oklch(0.18 0.08 295 / 0.8)",
                  border: "1px solid oklch(0.35 0.12 295 / 0.5)",
                }}
              >
                <Box
                  className="h-3.5 w-3.5"
                  style={{ color: "oklch(0.75 0.20 295)" }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "oklch(0.85 0.10 295)" }}
                >
                  {products.length} produto{products.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div
                className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: "oklch(0.18 0.08 295 / 0.8)",
                  border: "1px solid oklch(0.35 0.12 295 / 0.5)",
                }}
              >
                <Package
                  className="h-3.5 w-3.5"
                  style={{ color: "oklch(0.72 0.22 310)" }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "oklch(0.85 0.10 295)" }}
                >
                  {totalItems} un. total
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Top row: Cadastro + Export side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ── Cadastro de Produto ──────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="h-full" style={cardStyle}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                      <CardIconBox hue={295}>
                        <PackagePlus
                          className="h-4 w-4"
                          style={{ color: "oklch(0.78 0.20 295)" }}
                        />
                      </CardIconBox>
                      <GradientTitle>Cadastrar Produto</GradientTitle>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="product-name"
                        className="text-sm font-medium"
                        style={{ color: "oklch(0.75 0.10 295)" }}
                      >
                        Nome do produto
                      </Label>
                      <Input
                        id="product-name"
                        placeholder="Ex: Parafuso 3/8 polegadas..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddProduct()
                        }
                        style={inputStyle}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="product-qty"
                        className="text-sm font-medium"
                        style={{ color: "oklch(0.75 0.10 295)" }}
                      >
                        Quantidade inicial
                      </Label>
                      <Input
                        id="product-qty"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddProduct()
                        }
                        style={inputStyle}
                      />
                    </div>
                    <Button
                      onClick={handleAddProduct}
                      disabled={addLoading}
                      className="w-full font-semibold transition-all"
                      style={{
                        background: addLoading
                          ? "oklch(0.35 0.14 295 / 0.6)"
                          : "linear-gradient(135deg, oklch(0.42 0.22 295), oklch(0.55 0.25 310))",
                        color: "white",
                        border: "none",
                        boxShadow: addLoading
                          ? "none"
                          : "0 0 16px oklch(0.55 0.22 295 / 0.4)",
                      }}
                    >
                      {addLoading ? (
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 animate-spin rounded-full border-2"
                            style={{
                              borderColor:
                                "oklch(0.75 0.14 295 / 0.3) oklch(0.75 0.14 295 / 0.3) oklch(0.75 0.14 295 / 0.3) oklch(0.90 0.06 295)",
                            }}
                          />
                          Cadastrando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <PackagePlus className="h-4 w-4" />
                          Cadastrar Produto
                        </span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* ── Exportar Estoque ─────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col gap-4"
              >
                <Card style={cardStyle}>
                  <CardContent className="pt-6">
                    <p
                      className="text-sm mb-4 leading-relaxed"
                      style={{ color: "oklch(0.68 0.10 295)" }}
                    >
                      Exporte o relatório completo do estoque atual em formato
                      PDF para impressão ou arquivamento.
                    </p>
                    <Button
                      onClick={handleExportStock}
                      disabled={products.length === 0}
                      className="w-full font-semibold transition-all"
                      style={{
                        background:
                          products.length === 0
                            ? "oklch(0.16 0.06 295 / 0.6)"
                            : "linear-gradient(135deg, oklch(0.28 0.14 295), oklch(0.42 0.22 310), oklch(0.35 0.18 295))",
                        color:
                          products.length === 0
                            ? "oklch(0.40 0.06 295)"
                            : "white",
                        border:
                          products.length === 0
                            ? "1px solid oklch(0.24 0.08 295 / 0.4)"
                            : "1px solid oklch(0.45 0.18 295 / 0.5)",
                        boxShadow:
                          products.length === 0
                            ? "none"
                            : "0 0 20px oklch(0.50 0.20 295 / 0.30)",
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        Exportar Estoque em PDF
                        {products.length > 0 && (
                          <span
                            className="text-xs rounded-full px-2 py-0.5 font-normal"
                            style={{
                              background: "oklch(0.55 0.22 295 / 0.3)",
                              border: "1px solid oklch(0.65 0.18 295 / 0.4)",
                            }}
                          >
                            {products.length} produto
                            {products.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ── Tabela de Produtos ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card style={cardStyle}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                      <CardIconBox hue={200}>
                        <Package
                          className="h-4 w-4"
                          style={{ color: "oklch(0.75 0.18 200)" }}
                        />
                      </CardIconBox>
                      <span
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.90 0.06 295), oklch(0.75 0.18 200))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        Estoque
                      </span>
                      {products.length > 0 && (
                        <span
                          className="text-xs font-normal rounded-full px-2.5 py-0.5"
                          style={{
                            background: "oklch(0.20 0.10 295 / 0.8)",
                            border: "1px solid oklch(0.35 0.14 295 / 0.5)",
                            color: "oklch(0.75 0.18 295)",
                            WebkitTextFillColor: "oklch(0.75 0.18 295)",
                          }}
                        >
                          {products.length}
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
                        style={{
                          background: "oklch(0.16 0.06 295 / 0.8)",
                          border: "1px solid oklch(0.28 0.10 295 / 0.4)",
                        }}
                      >
                        <Package
                          className="h-7 w-7"
                          style={{ color: "oklch(0.45 0.12 295)" }}
                        />
                      </div>
                      <p
                        className="text-base font-medium"
                        style={{ color: "oklch(0.65 0.10 295)" }}
                      >
                        Nenhum produto cadastrado ainda
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "oklch(0.45 0.06 295)" }}
                      >
                        Use o formulário acima para adicionar produtos ao
                        estoque.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow
                            style={{
                              borderBottom:
                                "1px solid oklch(0.25 0.08 295 / 0.6)",
                            }}
                          >
                            <TableHead
                              className="font-semibold text-xs uppercase tracking-wider pl-6"
                              style={{ color: "oklch(0.58 0.14 295)" }}
                            >
                              Nome do Produto
                            </TableHead>
                            <TableHead
                              className="font-semibold text-xs uppercase tracking-wider text-center"
                              style={{ color: "oklch(0.58 0.14 295)" }}
                            >
                              Quantidade
                            </TableHead>
                            <TableHead
                              className="font-semibold text-xs uppercase tracking-wider text-center pr-6"
                              style={{ color: "oklch(0.58 0.14 295)" }}
                            >
                              Ações
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <tr
                              key={product.id}
                              className="group transition-colors"
                              style={{
                                borderBottom:
                                  "1px solid oklch(0.20 0.06 295 / 0.4)",
                              }}
                            >
                              <TableCell
                                className="pl-6 py-3 font-medium"
                                style={{ color: "oklch(0.88 0.06 295)" }}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full flex-shrink-0"
                                    style={{
                                      background:
                                        product.quantity === 0
                                          ? "oklch(0.65 0.22 27)"
                                          : product.quantity < 5
                                            ? "oklch(0.72 0.18 80)"
                                            : "oklch(0.65 0.18 155)",
                                    }}
                                  />
                                  {product.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span
                                  className="inline-flex items-center justify-center rounded-lg px-3 py-1 text-sm font-bold min-w-[52px]"
                                  style={{
                                    background:
                                      product.quantity === 0
                                        ? "oklch(0.20 0.08 27 / 0.6)"
                                        : product.quantity < 5
                                          ? "oklch(0.22 0.08 80 / 0.6)"
                                          : "oklch(0.18 0.08 295 / 0.8)",
                                    border:
                                      product.quantity === 0
                                        ? "1px solid oklch(0.50 0.18 27 / 0.5)"
                                        : product.quantity < 5
                                          ? "1px solid oklch(0.55 0.16 80 / 0.5)"
                                          : "1px solid oklch(0.35 0.14 295 / 0.5)",
                                    color:
                                      product.quantity === 0
                                        ? "oklch(0.72 0.20 27)"
                                        : product.quantity < 5
                                          ? "oklch(0.78 0.18 80)"
                                          : "oklch(0.82 0.16 295)",
                                  }}
                                >
                                  {product.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="text-center pr-6 py-3">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                      style={{
                                        color: "oklch(0.65 0.18 27)",
                                      }}
                                      aria-label={`Excluir ${product.name}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent
                                    style={{
                                      background: "oklch(0.14 0.06 295)",
                                      border:
                                        "1px solid oklch(0.28 0.10 295 / 0.8)",
                                      color: "oklch(0.92 0.04 295)",
                                    }}
                                  >
                                    <AlertDialogHeader>
                                      <AlertDialogTitle
                                        style={{
                                          color: "oklch(0.92 0.04 295)",
                                        }}
                                      >
                                        Excluir produto?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription
                                        style={{
                                          color: "oklch(0.65 0.08 295)",
                                        }}
                                      >
                                        Tem certeza que deseja excluir{" "}
                                        <strong
                                          style={{
                                            color: "oklch(0.82 0.14 295)",
                                          }}
                                        >
                                          "{product.name}"
                                        </strong>{" "}
                                        com{" "}
                                        <strong
                                          style={{
                                            color: "oklch(0.82 0.14 295)",
                                          }}
                                        >
                                          {product.quantity}
                                        </strong>{" "}
                                        unidade(s) em estoque? Esta ação não
                                        pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        style={{
                                          background:
                                            "oklch(0.18 0.06 295 / 0.8)",
                                          border:
                                            "1px solid oklch(0.28 0.08 295 / 0.6)",
                                          color: "oklch(0.82 0.08 295)",
                                        }}
                                      >
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(product.id, product.name)
                                        }
                                        style={{
                                          background:
                                            "linear-gradient(135deg, oklch(0.45 0.22 27), oklch(0.55 0.20 15))",
                                          color: "white",
                                          border: "none",
                                        }}
                                      >
                                        Sim, excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </tr>
                          ))}
                        </TableBody>
                      </Table>
                      {products.length > 0 && (
                        <div
                          className="flex items-center justify-between px-6 py-3"
                          style={{
                            borderTop: "1px solid oklch(0.22 0.08 295 / 0.5)",
                            background: "oklch(0.10 0.04 295 / 0.4)",
                          }}
                        >
                          <span
                            className="text-xs"
                            style={{ color: "oklch(0.55 0.08 295)" }}
                          >
                            {products.length} produto
                            {products.length !== 1 ? "s" : ""} registrado
                            {products.length !== 1 ? "s" : ""}
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "oklch(0.72 0.14 295)" }}
                          >
                            Total:{" "}
                            <span style={{ color: "oklch(0.82 0.18 295)" }}>
                              {totalItems}
                            </span>{" "}
                            unidades
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Nova Retirada ─────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card style={cardStyle}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <CardIconBox hue={310}>
                      <ClipboardList
                        className="h-4 w-4"
                        style={{ color: "oklch(0.78 0.22 310)" }}
                      />
                    </CardIconBox>
                    <span
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.90 0.06 295), oklch(0.78 0.22 310))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Nova Retirada
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Beneficiary */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="beneficiary-name"
                      className="text-sm font-medium flex items-center gap-1.5"
                      style={{ color: "oklch(0.75 0.10 295)" }}
                    >
                      <UserCheck
                        className="h-3.5 w-3.5"
                        style={{ color: "oklch(0.68 0.18 310)" }}
                      />
                      Retirada para:
                    </Label>
                    <Input
                      id="beneficiary-name"
                      placeholder="Nome completo do beneficiário..."
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Divider */}
                  <div
                    className="h-px w-full"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, oklch(0.32 0.12 295 / 0.5), transparent)",
                    }}
                  />

                  {/* Add item row */}
                  <div className="space-y-3">
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "oklch(0.58 0.12 295)" }}
                    >
                      Adicionar item à retirada
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <select
                          value={withdrawSelectId}
                          onChange={(e) => setWithdrawSelectId(e.target.value)}
                          className="w-full rounded-md px-3 py-2 text-sm"
                          style={{
                            ...inputStyle,
                            height: "40px",
                            outline: "none",
                            cursor: "pointer",
                          }}
                        >
                          <option value="">Escolha um produto...</option>
                          {products
                            .filter((p) => p.quantity > 0)
                            .map((p) => {
                              const alreadyPending = pendingItems
                                .filter((i) => i.productName === p.name)
                                .reduce((a, i) => a + i.quantity, 0);
                              const available = p.quantity - alreadyPending;
                              return (
                                <option
                                  key={p.id}
                                  value={String(p.id)}
                                  disabled={available <= 0}
                                  style={{
                                    background: "oklch(0.14 0.06 295)",
                                    color: "oklch(0.92 0.04 295)",
                                  }}
                                >
                                  {p.name} ({available} disp.)
                                </option>
                              );
                            })}
                        </select>
                      </div>
                      <div className="flex gap-2 sm:w-auto">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Qtd."
                          value={withdrawItemQty}
                          onChange={(e) => setWithdrawItemQty(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddWithdrawItem()
                          }
                          className="w-24 flex-shrink-0"
                          style={inputStyle}
                        />
                        <Button
                          onClick={handleAddWithdrawItem}
                          disabled={products.length === 0}
                          className="flex-shrink-0 font-semibold"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.38 0.18 310), oklch(0.50 0.24 295))",
                            color: "white",
                            border: "none",
                            boxShadow: "0 0 12px oklch(0.45 0.20 310 / 0.4)",
                          }}
                        >
                          <PackageMinus className="h-4 w-4 mr-1.5" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Pending items list */}
                  {pendingItems.length > 0 && (
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        border: "1px solid oklch(0.30 0.14 310 / 0.5)",
                        background: "oklch(0.10 0.05 310 / 0.4)",
                      }}
                    >
                      <div
                        className="px-4 py-2.5 flex items-center justify-between"
                        style={{
                          borderBottom: "1px solid oklch(0.25 0.10 310 / 0.4)",
                          background: "oklch(0.14 0.07 310 / 0.6)",
                        }}
                      >
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "oklch(0.72 0.18 310)" }}
                        >
                          Itens na retirada ({pendingItems.length})
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "oklch(0.55 0.12 310)" }}
                        >
                          Total:{" "}
                          {pendingItems.reduce((a, i) => a + i.quantity, 0)} un.
                        </span>
                      </div>
                      <div className="divide-y divide-[oklch(0.22_0.08_310_/_0.3)]">
                        {pendingItems.map((item) => (
                          <div
                            key={item.productName}
                            className="flex items-center justify-between px-4 py-2.5 group"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                style={{
                                  background: "oklch(0.72 0.20 310)",
                                }}
                              />
                              <span
                                className="text-sm font-medium"
                                style={{ color: "oklch(0.86 0.06 295)" }}
                              >
                                {item.productName}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-sm font-bold rounded-md px-2.5 py-0.5"
                                style={{
                                  background: "oklch(0.20 0.10 310 / 0.6)",
                                  border:
                                    "1px solid oklch(0.35 0.16 310 / 0.5)",
                                  color: "oklch(0.78 0.20 310)",
                                }}
                              >
                                {item.quantity} un.
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemovePendingItem(item.productName)
                                }
                                className="h-6 w-6 flex items-center justify-center rounded-md transition-opacity hover:scale-110"
                                style={{
                                  color: "oklch(0.65 0.18 27)",
                                  opacity: 1,
                                }}
                                aria-label={`Remover ${item.productName}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Finalize button */}
                  <Button
                    onClick={handleFinalizeWithdrawal}
                    disabled={
                      finalizeLoading ||
                      pendingItems.length === 0 ||
                      !beneficiaryName.trim()
                    }
                    className="w-full font-semibold transition-all"
                    size="lg"
                    style={{
                      background:
                        finalizeLoading ||
                        pendingItems.length === 0 ||
                        !beneficiaryName.trim()
                          ? "oklch(0.20 0.06 295 / 0.6)"
                          : "linear-gradient(135deg, oklch(0.35 0.20 310), oklch(0.48 0.26 295))",
                      color:
                        pendingItems.length === 0 || !beneficiaryName.trim()
                          ? "oklch(0.42 0.06 295)"
                          : "white",
                      border:
                        pendingItems.length === 0 || !beneficiaryName.trim()
                          ? "1px solid oklch(0.24 0.08 295 / 0.4)"
                          : "1px solid oklch(0.48 0.22 310 / 0.5)",
                      boxShadow:
                        pendingItems.length === 0 || !beneficiaryName.trim()
                          ? "none"
                          : "0 0 24px oklch(0.48 0.24 310 / 0.35)",
                    }}
                  >
                    {finalizeLoading ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 animate-spin rounded-full border-2"
                          style={{
                            borderColor:
                              "oklch(0.75 0.14 295 / 0.3) oklch(0.75 0.14 295 / 0.3) oklch(0.75 0.14 295 / 0.3) oklch(0.90 0.06 295)",
                          }}
                        />
                        Finalizando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5" />
                        Finalizar Retirada
                        {pendingItems.length > 0 && beneficiaryName.trim() && (
                          <span
                            className="text-xs rounded-full px-2 py-0.5 font-normal"
                            style={{
                              background: "oklch(0.55 0.22 310 / 0.3)",
                              border: "1px solid oklch(0.65 0.18 310 / 0.4)",
                            }}
                          >
                            {pendingItems.length} item
                            {pendingItems.length !== 1 ? "ns" : ""}
                          </span>
                        )}
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Histórico de Retiradas ───────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card style={cardStyle}>
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                      <CardIconBox hue={260}>
                        <History
                          className="h-4 w-4"
                          style={{ color: "oklch(0.78 0.18 260)" }}
                        />
                      </CardIconBox>
                      <span
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.90 0.06 295), oklch(0.78 0.18 260))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        Histórico de Retiradas
                      </span>
                      {withdrawals.length > 0 && (
                        <span
                          className="text-xs font-normal rounded-full px-2.5 py-0.5"
                          style={{
                            background: "oklch(0.20 0.10 295 / 0.8)",
                            border: "1px solid oklch(0.35 0.14 295 / 0.5)",
                            color: "oklch(0.75 0.18 295)",
                            WebkitTextFillColor: "oklch(0.75 0.18 295)",
                          }}
                        >
                          {withdrawals.length}
                        </span>
                      )}
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen((v) => !v)}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                      style={{
                        background: "oklch(0.18 0.08 295 / 0.6)",
                        border: "1px solid oklch(0.32 0.12 295 / 0.5)",
                        color: "oklch(0.68 0.14 295)",
                      }}
                    >
                      {historyOpen ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" /> Recolher
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" /> Expandir
                        </>
                      )}
                    </button>
                  </div>
                </CardHeader>

                {historyOpen && (
                  <div className="overflow-hidden">
                    <CardContent className="pt-4 p-0">
                      {withdrawals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 px-4">
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                            style={{
                              background: "oklch(0.16 0.06 295 / 0.8)",
                              border: "1px solid oklch(0.28 0.10 295 / 0.4)",
                            }}
                          >
                            <History
                              className="h-6 w-6"
                              style={{ color: "oklch(0.45 0.12 295)" }}
                            />
                          </div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "oklch(0.58 0.08 295)" }}
                          >
                            Nenhuma retirada registrada ainda
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "oklch(0.42 0.06 295)" }}
                          >
                            As retiradas finalizadas aparecerão aqui.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow
                                style={{
                                  borderBottom:
                                    "1px solid oklch(0.25 0.08 295 / 0.6)",
                                  borderTop:
                                    "1px solid oklch(0.22 0.08 295 / 0.4)",
                                }}
                              >
                                <TableHead
                                  className="font-semibold text-xs uppercase tracking-wider pl-6"
                                  style={{ color: "oklch(0.58 0.14 295)" }}
                                >
                                  Nº
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-xs uppercase tracking-wider"
                                  style={{ color: "oklch(0.58 0.14 295)" }}
                                >
                                  Data / Hora
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-xs uppercase tracking-wider"
                                  style={{ color: "oklch(0.58 0.14 295)" }}
                                >
                                  Beneficiário
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-xs uppercase tracking-wider text-center"
                                  style={{ color: "oklch(0.58 0.14 295)" }}
                                >
                                  Itens
                                </TableHead>
                                <TableHead
                                  className="font-semibold text-xs uppercase tracking-wider text-center pr-6"
                                  style={{ color: "oklch(0.58 0.14 295)" }}
                                >
                                  Ações
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {withdrawals.map((record) => {
                                const d = new Date(record.date);
                                const dateStr = d.toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                });
                                const timeStr = d.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                                const totalQty = record.items.reduce(
                                  (a, it) => a + it.quantity,
                                  0,
                                );
                                return (
                                  <tr
                                    key={record.id}
                                    className="group transition-colors"
                                    style={{
                                      borderBottom:
                                        "1px solid oklch(0.20 0.06 295 / 0.4)",
                                    }}
                                  >
                                    <TableCell
                                      className="pl-6 py-3"
                                      style={{
                                        color: "oklch(0.55 0.12 295)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      #{String(record.id).padStart(4, "0")}
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div
                                        className="text-xs"
                                        style={{
                                          color: "oklch(0.75 0.08 295)",
                                        }}
                                      >
                                        {dateStr}
                                      </div>
                                      <div
                                        className="text-xs"
                                        style={{
                                          color: "oklch(0.55 0.08 295)",
                                        }}
                                      >
                                        {timeStr}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <span
                                        className="text-sm font-medium"
                                        style={{
                                          color: "oklch(0.88 0.06 295)",
                                        }}
                                      >
                                        {record.beneficiaryName}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center py-3">
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span
                                          className="text-xs font-bold rounded-md px-2 py-0.5"
                                          style={{
                                            background:
                                              "oklch(0.20 0.10 260 / 0.6)",
                                            border:
                                              "1px solid oklch(0.35 0.14 260 / 0.5)",
                                            color: "oklch(0.78 0.18 260)",
                                          }}
                                        >
                                          {record.items.length} produto
                                          {record.items.length !== 1 ? "s" : ""}
                                        </span>
                                        <span
                                          className="text-xs"
                                          style={{
                                            color: "oklch(0.50 0.08 295)",
                                          }}
                                        >
                                          {totalQty} un.
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center pr-6 py-3">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleExportWithdrawal(record)
                                          }
                                          className="h-8 gap-1.5 text-xs font-medium transition-all hover:scale-105"
                                          style={{
                                            background:
                                              "oklch(0.18 0.10 260 / 0.6)",
                                            border:
                                              "1px solid oklch(0.35 0.14 260 / 0.5)",
                                            color: "oklch(0.75 0.18 260)",
                                          }}
                                        >
                                          <FileSignature className="h-3.5 w-3.5" />
                                          Relatório
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                              style={{
                                                color: "oklch(0.65 0.18 27)",
                                              }}
                                              aria-label="Excluir registro"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent
                                            style={{
                                              background:
                                                "oklch(0.14 0.06 295)",
                                              border:
                                                "1px solid oklch(0.28 0.10 295 / 0.8)",
                                              color: "oklch(0.92 0.04 295)",
                                            }}
                                          >
                                            <AlertDialogHeader>
                                              <AlertDialogTitle
                                                style={{
                                                  color: "oklch(0.92 0.04 295)",
                                                }}
                                              >
                                                Excluir registro?
                                              </AlertDialogTitle>
                                              <AlertDialogDescription
                                                style={{
                                                  color: "oklch(0.65 0.08 295)",
                                                }}
                                              >
                                                Deseja excluir o registro da
                                                retirada de{" "}
                                                <strong
                                                  style={{
                                                    color:
                                                      "oklch(0.82 0.14 295)",
                                                  }}
                                                >
                                                  {record.beneficiaryName}
                                                </strong>
                                                ? O estoque{" "}
                                                <strong
                                                  style={{
                                                    color:
                                                      "oklch(0.72 0.20 27)",
                                                  }}
                                                >
                                                  não será restaurado
                                                </strong>
                                                .
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel
                                                style={{
                                                  background:
                                                    "oklch(0.18 0.06 295 / 0.8)",
                                                  border:
                                                    "1px solid oklch(0.28 0.08 295 / 0.6)",
                                                  color: "oklch(0.82 0.08 295)",
                                                }}
                                              >
                                                Cancelar
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleDeleteWithdrawal(
                                                    record.id,
                                                  )
                                                }
                                                style={{
                                                  background:
                                                    "linear-gradient(135deg, oklch(0.45 0.22 27), oklch(0.55 0.20 15))",
                                                  color: "white",
                                                  border: "none",
                                                }}
                                              >
                                                Sim, excluir
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </TableCell>
                                  </tr>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </main>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer
          className="py-4 px-4 text-center text-xs"
          style={{
            color: "oklch(0.40 0.06 295)",
            borderTop: "1px solid oklch(0.20 0.06 295 / 0.3)",
          }}
        >
          &copy; {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.55 0.14 295)" }}
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
