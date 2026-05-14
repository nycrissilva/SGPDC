export function formatDateBR(value?: string | null) {
  if (!value) return "-";

  const datePart = value.includes("T")
    ? value.split("T")[0]
    : value.includes(" ")
      ? value.split(" ")[0]
      : value;

  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function formatInputDate(value?: string | null) {
  if (!value) return "";

  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];

  const brDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return `${year}-${month}-${day}`;
  }

  return value;
}
