"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SearchableSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
  inputClassName?: string;
  searchOnType?: boolean;
  showAllOnFocus?: boolean;
};

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  disabled = false,
  emptyText = "Nenhum resultado encontrado",
  inputClassName = "bg-white",
  searchOnType = false,
  showAllOnFocus = true,
}: SearchableSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(() => {
    const selectedOption = options.find(([optionValue]) => optionValue === value);
    return selectedOption ? selectedOption[1] || selectedOption[0] || "" : "";
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return options;
    return options.filter(([optionValue, optionLabel]) => normalize(optionLabel || optionValue || "").includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectOption = (optionValue: string, optionLabel: string) => {
    onChange(optionValue);
    setQuery(optionLabel);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-[#1F2A5A]">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={open ? query : selectedLabel || (searchOnType ? value : "")}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (searchOnType) onChange(nextQuery);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery(showAllOnFocus ? "" : selectedLabel || (searchOnType ? value : ""));
            setOpen(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-3xl border border-[#E5E7EB] px-4 py-3 pr-11 text-sm outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20 disabled:cursor-not-allowed disabled:opacity-60 ${inputClassName}`}
        />
        <button
          type="button"
          aria-label={open ? "Fechar opções" : "Abrir opções"}
          disabled={disabled}
          onClick={() => {
            setQuery(showAllOnFocus ? "" : selectedLabel || (searchOnType ? value : ""));
            setOpen((current) => !current);
          }}
          className="absolute inset-y-0 right-3 flex items-center text-[#1F2A5A] disabled:cursor-not-allowed"
        >
          <span className="block h-2.5 w-2.5 border-b-2 border-r-2 border-current transition" style={{ transform: open ? "rotate(225deg)" : "rotate(45deg)" }} />
        </button>
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[#1F2A5A]/30 bg-white py-1 text-sm shadow-lg">
          {placeholder && (
            <button
              type="button"
              onClick={() => selectOption("", "")}
              className={`block w-full px-4 py-2 text-left transition hover:bg-[#E61E4D]/10 ${value === "" ? "bg-[#2567C9] font-semibold text-white hover:bg-[#2567C9]" : "text-[#1F2A5A]"}`}
            >
              {placeholder}
            </button>
          )}
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-[#4B5563]">{emptyText}</div>
          ) : filteredOptions.map(([optionValue, optionLabel], index) => (
            <button
              key={`${optionValue}-${index}`}
              type="button"
              onClick={() => selectOption(optionValue, optionLabel || optionValue)}
              className={`block w-full px-4 py-2 text-left transition hover:bg-[#E61E4D]/10 ${value === optionValue ? "bg-[#2567C9] font-semibold text-white hover:bg-[#2567C9]" : "text-[#1F2A5A]"}`}
            >
              {optionLabel || optionValue}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
