interface DataTableProps {
  title?: string;
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
  rows: Record<string, string | number>[];
  className?: string;
}

export default function DataTable({ title, columns, rows, className = '' }: DataTableProps) {
  return (
    <div className={`chart-card animate-fade-in-up ${className}`} style={{ overflow: 'auto' }}>
      {title && (
        <div className="chart-card-header">
          <div className="chart-card-title">{title}</div>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ textAlign: col.align || 'left' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
