/** Shared Tailwind classes for admin panel (dark theme) */
export const adminStyles = {
  pageTitle: "text-2xl font-display font-bold text-white",
  pageSubtitle: "text-gray-400 mt-1 text-sm",
  card: "bg-[#111111] rounded-2xl border border-[#222222]",
  cardPadding: "bg-[#111111] rounded-2xl border border-[#222222] p-4",
  input:
    "w-full px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#333333] text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm",
  select:
    "px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#333333] text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm",
  button:
    "px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#333333] text-white hover:bg-[#222222] transition-colors text-sm disabled:opacity-40",
  buttonPrimary: "px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm",
  buttonDanger: "px-4 py-2 rounded-xl bg-red-600/90 text-white hover:bg-red-600 transition-colors text-sm",
  table: "w-full text-sm text-gray-200",
  tableHead: "border-b border-[#222222] text-left text-gray-400 bg-[#0a0a0a]",
  tableRow: "border-b border-[#222222] last:border-0 hover:bg-[#1a1a1a]/50",
  statCard: "bg-[#111111] p-4 rounded-xl border border-[#222222]",
  errorBox: "flex items-center gap-2 p-4 bg-red-900/20 text-red-300 rounded-xl border border-red-800/50",
} as const;
