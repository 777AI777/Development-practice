export function getUserInitial(name: string | undefined, fallback = ""): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
