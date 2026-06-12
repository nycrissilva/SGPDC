"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  surface?: "muted" | "white";
};

export default function PasswordField({
  label,
  surface = "muted",
  className = "",
  disabled,
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block">
      <span className="text-sm font-medium text-[#1F2A5A]">{label}</span>
      <div className="relative mt-2">
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={`w-full rounded-3xl border border-[#E5E7EB] ${surface === "white" ? "bg-white" : "bg-[#F9FAFB]"} px-4 py-3 pr-12 text-sm text-[#2B2B2B] outline-none transition focus:border-[#E61E4D] focus:ring-2 focus:ring-[#E61E4D]/20 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          onMouseDown={(event) => event.preventDefault()}
          disabled={disabled}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={showPassword}
          title={showPassword ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-3xl text-[#4B5563] transition hover:text-[#1F2A5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E61E4D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6S2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 6.15A10.7 10.7 0 0 1 12 6c6.25 0 9.75 6 9.75 6a17.7 17.7 0 0 1-2.15 2.8M6.2 7.7C3.65 9.5 2.25 12 2.25 12s3.5 6 9.75 6a10.6 10.6 0 0 0 3.05-.43M9.9 9.9a2.75 2.75 0 0 0 3.9 3.9" />
    </svg>
  );
}
