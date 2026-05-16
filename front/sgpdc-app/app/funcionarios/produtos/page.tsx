"use client";

import { apiFetch } from "@/lib/api";
import SearchableSelect from "@/components/SearchableSelect";
import Link from "next/link";
import { useEffect, useState } from "react";

type Produto = {
  id: number;
  nome: string;
  descricao: string | null;
  valor_unitario: number;
  status: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    nome: "",
    descricao: "",
    valor_unitario: "",
    status: "ATIVO",
  });

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/vendas/produtos?incluir_inativos=true");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao carregar produtos");
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar produtos");
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
      await loadProdutos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar operação");
    } finally {
      setProcessing(false);
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({ nome: "", descricao: "", valor_unitario: "", status: "ATIVO" });
  };

  const saveProduct = () => runAction("Produto salvo com sucesso.", async () => {
    const path = editingProductId ? `/api/vendas/produtos/${editingProductId}` : "/api/vendas/produtos";
    const payload = {
      nome: productForm.nome,
      descricao: productForm.descricao,
      valor_unitario: Number(productForm.valor_unitario),
      ...(editingProductId ? { status: productForm.status } : {}),
    };
    const response = await apiFetch(path, {
      method: editingProductId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao salvar produto");
    resetProductForm();
  });

  const editProduct = (produto: Produto) => {
    setEditingProductId(produto.id);
    setProductForm({
      nome: produto.nome,
      descricao: produto.descricao || "",
      valor_unitario: String(produto.valor_unitario),
      status: produto.status,
    });
  };

  const inactivateProduct = (produto: Produto) => runAction("Produto inativado com sucesso.", async () => {
    const response = await apiFetch(`/api/vendas/produtos/${produto.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao inativar produto");
  });

  return (
    <div className="min-h-screen bg-white text-[#2B2B2B] font-sans">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#6A4FBF]">Receitas extras</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1F2A5A]">Produtos</h1>
          </div>
          <Link href="/funcionarios/vendas" className="inline-flex items-center rounded-full border border-[#1F2A5A] bg-white px-5 py-3 text-sm font-semibold text-[#1F2A5A] transition hover:border-[#6A4FBF] hover:text-[#6A4FBF]">
            Ir para vendas
          </Link>
        </div>

        {success && <div className="mb-6 rounded-lg bg-[#6A4FBF]/10 p-4 text-sm text-[#6A4FBF]">{success}</div>}
        {error && <div className="mb-6 rounded-lg bg-[#E61E4D]/10 p-4 text-sm text-[#E61E4D]">{error}</div>}

        <section className="mb-8 rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Cadastro</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">{editingProductId ? "Editar produto" : "Novo produto"}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Nome" value={productForm.nome} onChange={(value) => setProductForm((prev) => ({ ...prev, nome: value }))} placeholder="Uniforme" />
            <Field label="Descrição" value={productForm.descricao} onChange={(value) => setProductForm((prev) => ({ ...prev, descricao: value }))} placeholder="Tamanho, cor ou observação" />
            <Field label="Valor unitário" value={productForm.valor_unitario} onChange={(value) => setProductForm((prev) => ({ ...prev, valor_unitario: value }))} placeholder="0.00" />
            {editingProductId ? (
              <Select label="Status" value={productForm.status} onChange={(value) => setProductForm((prev) => ({ ...prev, status: value }))} options={[["ATIVO", "Ativo"], ["INATIVO", "Inativo"]]} placeholder="Status" />
            ) : (
              <div>
                <p className="mb-2 text-sm font-medium text-[#1F2A5A]">Status</p>
                <p className="rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm font-semibold text-[#1F2A5A]">ATIVO</p>
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={processing} onClick={saveProduct} className="rounded-full bg-[#E61E4D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F04A6A] disabled:opacity-50">
              Salvar produto
            </button>
            {editingProductId && (
              <button type="button" onClick={resetProductForm} className="rounded-full bg-[#6A4FBF]/10 px-5 py-3 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                Cancelar edição
              </button>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#6A4FBF]">Consulta</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1F2A5A]">Produtos cadastrados ({produtos.length})</h2>
          </div>

          {loading ? (
            <p className="text-sm text-[#2B2B2B]/70">Carregando produtos...</p>
          ) : produtos.length === 0 ? (
            <p className="text-sm text-[#2B2B2B]/70">Nenhum produto cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB] text-left text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Produto</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Valor</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#1F2A5A]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="bg-white hover:bg-[#F2F2F2]">
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#1F2A5A]">{produto.nome}</p>
                        <p className="mt-1 text-xs text-[#4B5563]">{produto.descricao || "-"}</p>
                      </td>
                      <td className="px-4 py-4">{currency.format(produto.valor_unitario)}</td>
                      <td className="px-4 py-4">{produto.status}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => editProduct(produto)} className="rounded-full bg-[#6A4FBF]/10 px-3 py-1 text-xs text-[#6A4FBF] transition hover:bg-[#6A4FBF]/20">
                            Editar
                          </button>
                          {produto.status === "ATIVO" && (
                            <button type="button" onClick={() => inactivateProduct(produto)} className="rounded-full bg-[#E61E4D]/10 px-3 py-1 text-xs text-[#E61E4D] transition hover:bg-[#E61E4D]/20">
                              Inativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; placeholder: string }) {
  return <SearchableSelect label={label} value={value} onChange={onChange} options={options} placeholder={placeholder} inputClassName="bg-[#F9FAFB]" />;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-3xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20" placeholder={placeholder} />
    </div>
  );
}
