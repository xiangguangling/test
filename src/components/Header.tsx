export default function Header({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`relative flex-shrink-0 px-4 md:px-6 border-b border-border-subtle overflow-visible ${compact ? 'py-2 mb-1' : 'py-3 mb-2'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[160px] bg-gradient-to-r from-accent-orange/4 via-accent-blue/3 to-accent-cyan/4 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[1600px] mx-auto flex items-center justify-between">
        {/* 左侧：Logo 区 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-orange to-accent-orange/60 flex items-center justify-center shadow-lg shadow-accent-orange/20">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[11px] text-text-muted tracking-widest uppercase leading-none">Education Monitor</p>
            <p className="text-[10px] text-text-muted/60 leading-none mt-0.5">温州市 · 2026</p>
          </div>
        </div>

        {/* 中间：标题 */}
        <div className="flex flex-col items-center gap-0.5">
          <h1 className={`font-extrabold tracking-wider text-center leading-tight text-white ${compact ? 'text-[1.25rem] md:text-[1.5rem]' : 'text-[1.5rem] md:text-[2rem]'}`}>
            义务教育标准化学校监测
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-accent-orange/40" />
            <h2 className={`font-medium text-text-secondary text-center leading-tight tracking-wide ${compact ? 'text-[0.85rem]' : 'text-[1rem]'}`}>
              数据可视化看板
            </h2>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-accent-orange/40" />
          </div>
        </div>

        {/* 右侧：状态指示 */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
            </span>
            <span className="text-[11px] text-text-muted tracking-wide">实时监测中</span>
          </div>
        </div>
      </div>
    </header>
  );
}
