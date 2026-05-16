"use client";

import { apiFetch } from "@/lib/api";
import { formatDateBR } from "@/lib/format";
import SearchableSelect from "@/components/SearchableSelect";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Espetaculo = {
  id: number;
  nome: string;
  data: string | null;
  descricao: string | null;
  status: string;
  total_coreografias: number;
};

const emptyEspetaculo = { nome: "", data: "", descricao: "", status: "ATIVO" };

export default function EspetaculosPage() {
  const [espetaculos, setEspetaculos] = useState<Espetaculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingEspetaculoId, setEditingEspetaculoId] = useState<number | null>(null);
  const [espetaculoForm, setEspetaculoForm] = useState(emptyEspetaculo);

  useEffect(() => {
    loadEspetaculos();
  }, []);

  const resumo = useMemo(() => {
    const ativos = espetaculos.filter((item) => item.status === "ATIVO").length;
    const coreografias = espetaculos.reduce((total, item) => total + Number(item.total_coreografias || 0), 0);
    return { ativos, coreografias };
  }, [espetaculos]);

  const loadEspetaculos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/espetaculos?incluir_inativos=true");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar espetáculos");
      setEspetaculos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar espetáculos");
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (message: string, action: () => Promise<void>) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      await action();
      setSuccess(message);
      await loadEspetaculos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar operação");
    } finally {
      setProcessing(false);
    }
  };

  const saveEspetaculo = () => runAction("Espetáculo salvo com sucesso.", async () => {
    const response = await apiFetch(editingEspetaculoId ? `/api/espetaculos/${editingEspetaculoId}` : "/api/espetaculos", {
      method: editingEspetaculoId ? "PUT" : "POST",
      body: JSON.stringify(espetaculoForm),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao salvar espetáculo");
    setEditingEspetaculoId(null);
    setEspetaculoForm(emptyEspetaculo);
  });

  const editEspetaculo = (item: Espetaculo) => {
    setEditingEspetaculoId(item.id);
    setEspetaculoForm({
      nome: item.nome,
      data: item.data || "",
      descricao: item.descricao || "",
      status: item.status || "ATIVO",
    });
  };

  const inactivateEspetaculo = (item: Espetaculo) => runAction("Espetáculo inativado com sucesso.", async () => {
    let response = await apiFetch(`/api/espetaculos/${item.id}`, { method: "DELETE", body: JSON.stringify({ confirmar_cobrancas_pendentes: false }) });
    let data = await response.json();
    if (response.status === 409 && data.requer_confirmacao) {
      const confirmed = window.confirm("Existem cobranças de fantasia pendentes. Deseja inativar mesmo assim?");
      if (!confirmed) throw new Error("Inativação cancelada");
      response = await apiFetch(`/api/espetaculos/${item.id}`, { method: "DELETE", body: JSON.stringify({ confirmar_cobrancas_pendentes: true }) });
      data = await response.json();
    }
    if (!response.ok) throw new Error(data.error || "Erro ao inativar espetáculo");
  });

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Eventos artísticos</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Espetáculos</h1>
          </div>
          <Link href="/funcionarios/coreografias" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Gerenciar coreografias
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <SummaryCard label="Espetáculos ativos" value={String(resumo.ativos)} />
          <SummaryCard label="Coreografias vinculadas" value={String(resumo.coreografias)} />
        </div>

        <section className="mb-8 rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <FormHeader overline="Cadastro" title={editingEspetaculoId ? "Editar espetáculo" : "Novo espetáculo"} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome" value={espetaculoForm.nome} onChange={(value) => setEspetaculoForm((prev) => ({ ...prev, nome: value }))} placeholder="Festival de fim de ano" />
            <Field label="Data" type="date" value={espetaculoForm.data} onChange={(value) => setEspetaculoForm((prev) => ({ ...prev, data: value }))} placeholder="dd/mm/aaaa" />
            <Field label="Descrição" value={espetaculoForm.descricao} onChange={(value) => setEspetaculoForm((prev) => ({ ...prev, descricao: value }))} placeholder="Observações do evento" />
            {editingEspetaculoId ? (
              <Select label="Status" value={espetaculoForm.status} onChange={(value) => setEspetaculoForm((prev) => ({ ...prev, status: value }))} options={[["ATIVO", "Ativo"], ["INATIVO", "Inativo"]]} placeholder="Status" />
            ) : <ReadOnly label="Status" value="ATIVO" />}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton disabled={processing} onClick={saveEspetaculo}>Salvar espetáculo</PrimaryButton>
            {editingEspetaculoId && <SecondaryButton onClick={() => { setEditingEspetaculoId(null); setEspetaculoForm(emptyEspetaculo); }}>Cancelar</SecondaryButton>}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <FormHeader overline="Consulta" title={`Espetáculos cadastrados (${espetaculos.length})`} />
          {loading ? <p className="text-sm text-[#4B5563]">Carregando...</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {espetaculos.map((item) => (
                <div key={item.id} className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#1F2A5A]">{item.nome}</p>
                      <p className="mt-1 text-sm text-[#4B5563]">{formatDate(item.data)} - {item.status} - {item.total_coreografias} coreografia(s)</p>
                      <p className="mt-1 text-sm text-[#4B5563]">{item.descricao || "-"}</p>
                    </div>
                    <div className="flex gap-2">
                      <SmallButton onClick={() => editEspetaculo(item)}>Editar</SmallButton>
                      {item.status === "ATIVO" && <DangerSmallButton onClick={() => inactivateEspetaculo(item)}>Inativar</DangerSmallButton>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[#E5E7EB] bg-[#F9FAFB] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-[#6A4FBF]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#1F2A5A]">{value}</p>
    </div>
  );
}

function FormHeader({ overline, title }: { overline: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">{overline}</p>
      <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder={placeholder} />
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; placeholder: string }) {
  return <SearchableSelect label={label} value={value} onChange={onChange} options={options} placeholder={placeholder} />;
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#1F2A5A]">{label}</p>
      <p className="rounded-3xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#1F2A5A]">{value}</p>
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">{children}</button>;
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">{children}</button>;
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">{children}</button>;
}

function DangerSmallButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20">{children}</button>;
}

function formatDate(value: string | null) {
  return formatDateBR(value);
}
