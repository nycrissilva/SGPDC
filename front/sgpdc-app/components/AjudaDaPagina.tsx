"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import TourGuia from "@/components/TourGuia";
import { obterTourDaRota } from "@/lib/ajuda";

export default function AjudaDaPagina() {
  const pathname = usePathname();
  const tour = obterTourDaRota(pathname);

  useEffect(() => {
    if (!tour) return;

    const marcarAlvos = () => {
      const escopo = document.querySelector<HTMLElement>("[data-help-scope]");
      if (!escopo) return;

      escopo.querySelector("h1")?.setAttribute("data-help", `${tour.id}-titulo`);
      escopo.querySelector("form")?.setAttribute("data-help", `${tour.id}-formulario`);
      escopo.querySelector("table")?.setAttribute("data-help", `${tour.id}-lista`);

      const acao = escopo.querySelector<HTMLElement>("a[href]:not([data-help]), button:not([data-tour-button]):not([data-help])");
      acao?.setAttribute("data-help", `${tour.id}-acao`);
    };

    marcarAlvos();
    const observer = new MutationObserver(marcarAlvos);
    const escopo = document.querySelector("[data-help-scope]");
    if (escopo) observer.observe(escopo, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname, tour]);

  if (!tour) return null;

  return (
    <TourGuia
      passos={tour.passos}
      autoStartKey={pathname === "/funcionarios" ? "sgpdc-tour-dashboard-concluido" : undefined}
    />
  );
}
