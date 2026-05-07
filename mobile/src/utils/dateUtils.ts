const DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStartOfWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addWeeks(date: Date, weeks: number) {
  return addDays(date, weeks * 7);
}

export function getWeekRange(start: Date) {
  return {
    inicio: toISODate(start),
    fim: toISODate(addDays(start, 6)),
  };
}

export function formatDateBR(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function getDiaSemana(date = new Date()) {
  return DIAS[date.getDay()];
}

export function normalizeWeekday(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function sameWeekday(a = "", b = "") {
  return normalizeWeekday(a).includes(normalizeWeekday(b).split("-")[0]);
}

export function formatTime(value?: string) {
  if (!value) return "--:--";
  return value.slice(0, 5);
}
