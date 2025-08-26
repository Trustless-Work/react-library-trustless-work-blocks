export const formatCurrency = (value: number, currency: string) => {
  return `${currency} ${value.toFixed(2)}`;
};

export function formatTimestamp(ts?: {
  _seconds: number;
  _nanoseconds: number;
}) {
  if (!ts) return "-";
  const d = new Date(ts._seconds * 1000);
  return d.toLocaleString();
}

export function formatAddress(address: string) {
  return `${address.slice(0, 10)}...${address.slice(-4)}`;
}

export function formatRole(role: string) {
  return role
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function formatText(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
