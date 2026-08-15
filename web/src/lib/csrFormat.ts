export function csrStatusColor(status: string): { bg: string; fg: string } {
  switch (status) {
    case "pending":
      return { bg: "#FEF3C7", fg: "#B45309" };
    case "confirmed":
      return { bg: "#EFF6FF", fg: "#1D4ED8" };
    case "active":
    case "in_progress":
      return { bg: "#FEFCE8", fg: "#A16207" };
    case "completed":
      return { bg: "#F0FDF4", fg: "#166534" };
    case "cancelled":
      return { bg: "#FEE2E2", fg: "#B91C1C" };
    case "sponsored":
      return { bg: "var(--sdg-civic-light)", fg: "var(--sdg-civic)" };
    default:
      return { bg: "#F3F4F6", fg: "#4B5563" };
  }
}

export function csrStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}