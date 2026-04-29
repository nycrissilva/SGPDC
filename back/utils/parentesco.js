const PARENTESCO_ALIASES = new Map([
    ["PAI", "PAI"],
    ["MAE", "MAE"],
    ["MÃE", "MAE"],
    ["MÃƒE", "MAE"],
    ["AVO", "AVO"],
    ["AVÓ", "AVO"],
    ["AVÃ“", "AVO"],
    ["AVÔ", "AVO"],
    ["AVÃ”", "AVO"],
    ["AVO PATERNA", "AVO_PATERNA"],
    ["AVÓ PATERNA", "AVO_PATERNA"],
    ["AVÃ“ PATERNA", "AVO_PATERNA"],
    ["AVOPATERNA", "AVO_PATERNA"],
    ["AVÓPATERNA", "AVO_PATERNA"],
    ["AVÃ“PATERNA", "AVO_PATERNA"],
    ["AVO PATERNO", "AVO_PATERNO"],
    ["AVÔ PATERNO", "AVO_PATERNO"],
    ["AVÃ” PATERNO", "AVO_PATERNO"],
    ["AVOPATERNO", "AVO_PATERNO"],
    ["AVÔPATERNO", "AVO_PATERNO"],
    ["AVÃ”PATERNO", "AVO_PATERNO"],
    ["AVO MATERNA", "AVO_MATERNA"],
    ["AVÓ MATERNA", "AVO_MATERNA"],
    ["AVÃ“ MATERNA", "AVO_MATERNA"],
    ["AVOMATERNA", "AVO_MATERNA"],
    ["AVÓMATERNA", "AVO_MATERNA"],
    ["AVÃ“MATERNA", "AVO_MATERNA"],
    ["AVO MATERNO", "AVO_MATERNO"],
    ["AVÔ MATERNO", "AVO_MATERNO"],
    ["AVÃ” MATERNO", "AVO_MATERNO"],
    ["AVOMATERNO", "AVO_MATERNO"],
    ["AVÔMATERNO", "AVO_MATERNO"],
    ["AVÃ”MATERNO", "AVO_MATERNO"],
    ["TIO", "TIO"],
    ["TIA", "TIA"],
    ["TUTOR", "TUTOR"],
]);

export function normalizarParentesco(parentesco) {
    if (!parentesco || typeof parentesco !== "string")
        return parentesco;

    const valor = parentesco.trim();
    const valorSemSeparador = valor.replace(/[_-]/g, " ");
    const chave = valor.toUpperCase().replace(/\s+/g, " ");
    const chaveSemSeparador = chave.replace(/[_-]/g, " ");

    return PARENTESCO_ALIASES.get(valor)
        || PARENTESCO_ALIASES.get(valorSemSeparador)
        || PARENTESCO_ALIASES.get(valorSemSeparador.replace(/\s+/g, ""))
        || PARENTESCO_ALIASES.get(chave)
        || PARENTESCO_ALIASES.get(chaveSemSeparador)
        || PARENTESCO_ALIASES.get(chaveSemSeparador.replace(/\s+/g, ""))
        || valor;
}
