"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useCallback, useEffect } from "react";

type TourGuiaProps = {
  passos: DriveStep[];
  autoStartKey?: string;
  className?: string;
};

export default function TourGuia({ passos, autoStartKey, className = "" }: TourGuiaProps) {
  const iniciarTour = useCallback(() => {
    const passosDisponiveis = passos.filter((passo) => {
      if (!passo.element) return true;
      if (typeof passo.element === "string") return Boolean(document.querySelector(passo.element));
      if (typeof passo.element === "function") return Boolean(passo.element());
      return passo.element.isConnected;
    });

    if (passosDisponiveis.length === 0) return;

    driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Próximo",
      prevBtnText: "Anterior",
      doneBtnText: "Concluir",
      overlayOpacity: 0.6,
      smoothScroll: true,
      steps: passosDisponiveis,
    }).drive();
  }, [passos]);

  useEffect(() => {
    if (!autoStartKey || window.localStorage.getItem(autoStartKey)) return;

    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(autoStartKey, "true");
      iniciarTour();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [autoStartKey, iniciarTour]);

  return (
    <button
      type="button"
      onClick={iniciarTour}
      data-tour-button
      data-help="botao-ajuda"
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-[#6A4FBF] bg-white px-4 py-2.5 text-sm font-semibold text-[#6A4FBF] transition hover:bg-[#6A4FBF] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6A4FBF]/40 ${className}`}
      aria-label="Abrir tutorial desta página"
    >
      <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">?</span>
      Ajuda
    </button>
  );
}
