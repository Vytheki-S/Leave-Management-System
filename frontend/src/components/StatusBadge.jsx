const styles = {
  pending: 'bg-[#f59e0b18] text-[#fbbf24] ring-[#f59e0b30]',
  approved: 'bg-[#16a34a18] text-[#4ade80] ring-[#16a34a30]',
  rejected: 'bg-[#ef444418] text-[#f87171] ring-[#ef444430]',
  cancelled: 'bg-[#2a2a2a] text-[#6b7280] ring-[#333333]',
};

function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();
  const style = styles[normalized] || 'bg-[#2a2a2a] text-[#9ca3af] ring-[#333333]';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${style}`}>
      {normalized || 'unknown'}
    </span>
  );
}

export default StatusBadge;
