import { useEffect, useRef } from 'react';

export default function DandelionViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    const coreRadius = 20;
    let dandelions: any[] = [];
    let globalScale = 0;
    let isHovered = false;
    let activeNode: any = null;
    let time = 0;
    let animId = 0;

    const rawData = [
      { name: '区县1', a: 10.90, b: 18.37, c: 12.48 },
      { name: '区县2', a: 9.89, b: 16.73, c: 11.22 },
      { name: '区县3', a: 10.79, b: 18.76, c: 12.37 },
      { name: '区县4', a: 10.94, b: 17.98, c: 11.92 },
      { name: '区县5', a: 10.93, b: 18.03, c: 12.33 },
      { name: '区县6', a: 10.99, b: 18.35, c: 11.97 },
      { name: '区县7', a: 10.94, b: 18.18, c: 12.15 },
      { name: '区县8', a: 10.87, b: 19.15, c: 12.20 },
      { name: '区县9', a: 10.95, b: 18.45, c: 11.39 },
      { name: '区县10', a: 10.98, b: 18.30, c: 11.77 },
      { name: '区县11', a: 10.97, b: 17.97, c: 12.14 },
      { name: '区县12', a: 11.00, b: 18.88, c: 12.19 },
    ];

    let maxScore = -1;
    let highestScoreDistrictName = '';
    rawData.forEach(d => {
      (d as any).score = d.a + d.b + d.c;
      if ((d as any).score > maxScore) {
        maxScore = (d as any).score;
        highestScoreDistrictName = d.name;
      }
    });

    function resize() {
      const parent = canvas!.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || window.innerHeight;
      cx = width * 0.45;
      cy = height * 0.52;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = width + 'px';
      canvas!.style.height = height + 'px';
      ctx!.scale(dpr, dpr);
    }

    function initData() {
      dandelions = [];
      const maxBallRadius = Math.min(width, height) * 0.23;
      const INNER_LAYER_RADIUS = maxBallRadius * 0.35;
      const OUTER_LAYER_RADIUS = maxBallRadius * 0.75;

      const sortedData = [...rawData].sort((a, b) => (a as any).score - (b as any).score);
      const innerLayerData = sortedData.slice(0, 6);
      const outerLayerData = sortedData.slice(6, 12);

      const outerScores = outerLayerData.map(d => (d as any).score);
      const minOuterScore = Math.min(...outerScores);
      const maxOuterScore = Math.max(...outerScores);
      const outerSpan = maxOuterScore - minOuterScore || 1;

      const processedData = [
        ...innerLayerData.map((d, i) => ({ ...d, layer: 'inner', localIdx: i, total: 6 })),
        ...outerLayerData.map((d, i) => ({ ...d, layer: 'outer', localIdx: i, total: 6 })),
      ];

      processedData.forEach((item: any, uIdx: number) => {
        let baseAngle = (item.localIdx / item.total) * Math.PI * 2;
        if (item.layer === 'outer') baseAngle += Math.PI / 15;

        let baseRadius = item.layer === 'inner' ? INNER_LAYER_RADIUS : OUTER_LAYER_RADIUS;
        const mappedRadius = baseRadius + (item.score % 1) * 8;

        let baseColor = '145, 206, 191';
        if (item.layer === 'inner') baseColor = '112, 175, 160';
        if (item.name === highestScoreDistrictName) baseColor = '214, 122, 118';

        const fluffs: any[] = [];
        const dimensions = [
          { key: 'a', label: 'a均分', count: 18, max: 11.0 },
          { key: 'b', label: 'b均分', count: 18, max: 19.5 },
          { key: 'c', label: 'c均分', count: 18, max: 13.0 },
        ];

        dimensions.forEach(dim => {
          const val = item[dim.key];
          const rawRatio = Math.min(1.0, Math.max(0.01, val / dim.max));
          let baseSizeForDim: number;
          if (item.layer === 'inner') {
            baseSizeForDim = 1.5 + Math.pow(rawRatio, 3.2) * 8.5;
          } else {
            const relativeRankRatio = (item.score - minOuterScore) / outerSpan;
            const contrastFactor = Math.pow(relativeRankRatio, 2.5);
            baseSizeForDim = 5.0 + contrastFactor * 50.0;
          }

          for (let j = 0; j < dim.count; j++) {
            const fluffAngleOffset = (Math.random() - 0.5) * 2.5;
            const lenOffset = dim.key === 'b' ? 7 : (dim.key === 'c' ? -4 : 0);
            let baseLen = item.layer === 'inner' ? 16 : 28;
            if (item.layer === 'outer') {
              const relativeRankRatio = (item.score - minOuterScore) / outerSpan;
              baseLen += relativeRankRatio * 16;
            }
            const fluffLength = Math.max(2, (3 + Math.random() * baseLen) + lenOffset);
            const randomScale = 0.5 + Math.random() * 0.8;
            fluffs.push({
              type: dim.key, label: dim.label, val: val, ratio: rawRatio,
              angleOffset: fluffAngleOffset, length: fluffLength,
              baseSize: Math.max(1.0, item.layer === 'inner' ? Math.min(12, baseSizeForDim * randomScale) : Math.min(75, baseSizeForDim * randomScale)),
              phaseShift: uIdx * 1.5 + fluffs.length * 0.05,
              curve: (Math.random() - 0.5) * 0.12,
            });
          }
        });

        dandelions.push({
          name: item.name, score: item.score, a: item.a, b: item.b, c: item.c,
          layer: item.layer, baseAngle, radius: mappedRadius, baseColor, fluffs,
        });
      });
    }

    let lastFrameTime = 0;
    const FRAME_INTERVAL = 42; // ~24fps, 给 ECharts 留足帧预算

    function draw(timestamp: number) {
      if (timestamp - lastFrameTime < FRAME_INTERVAL) {
        animId = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = timestamp;

      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // 居中标题
      ctx.save();
      ctx.fillStyle = '#1a2a2a';
      ctx.font = 'bold 18px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('十二区县指标概览', width / 2, 4);
      ctx.restore();

      if (globalScale < 1) globalScale += 0.012;
      time += isHovered ? 0.003 : 0.014;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + width * 0.18, cy + height * 0.22, width * 0.75, height * 1.05);
      ctx.strokeStyle = '#165246';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * globalScale, 0, Math.PI * 2);
      ctx.fillStyle = '#0f3d34';
      ctx.fill();

      dandelions.forEach((d: any) => {
        let currentAngle = d.baseAngle;
        if (d.layer === 'inner') {
          currentAngle += Math.sin(time * 0.65 + d.radius * 0.03) * 0.06;
        } else {
          currentAngle += Math.cos(time * 0.32 + d.radius * 0.01) * 0.14;
        }

        const currentR = d.radius * globalScale;
        const endX = cx + Math.cos(currentAngle) * currentR;
        const endY = cy + Math.sin(currentAngle) * currentR;

        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(endX, endY);
        ctx!.strokeStyle = d.layer === 'inner' ? 'rgba(22, 82, 70, 0.22)' : 'rgba(22, 82, 70, 0.03)';
        ctx!.lineWidth = d.layer === 'inner' ? 0.9 : 0.6;
        ctx!.stroke();

        d.fluffs.forEach((fluff: any, idx: number) => {
          const breatheFactor = 1.0 + Math.sin(time + fluff.phaseShift) * 0.12;
          const currentSize = fluff.baseSize * breatheFactor * globalScale;
          const currentFluffLength = fluff.length * (1.0 + Math.sin(time + fluff.phaseShift) * 0.06) * globalScale;
          const fAngle = currentAngle + fluff.angleOffset;
          const fx = endX + Math.cos(fAngle) * currentFluffLength;
          const fy = endY + Math.sin(fAngle) * currentFluffLength;

          const stemGrad = ctx!.createLinearGradient(endX, endY, fx, fy);
          const stemAlpha = d.layer === 'inner' ? 0.08 : 0.16;
          stemGrad.addColorStop(0, `rgba(${d.baseColor}, ${stemAlpha})`);
          stemGrad.addColorStop(0.3, `rgba(${d.baseColor}, 0.02)`);
          stemGrad.addColorStop(1, `rgba(${d.baseColor}, 0.002)`);

          ctx!.beginPath();
          ctx!.moveTo(endX, endY);
          const ctrlX = (endX + fx) * 0.5 + Math.sin(time + fluff.phaseShift) * fluff.curve * 12;
          const ctrlY = (endY + fy) * 0.5 + Math.cos(time + fluff.phaseShift) * fluff.curve * 12;
          ctx!.quadraticCurveTo(ctrlX, ctrlY, fx, fy);
          ctx!.strokeStyle = stemGrad;
          ctx!.lineWidth = d.layer === 'inner' ? 0.3 : 0.4;
          ctx!.stroke();

          ctx!.beginPath();
          ctx!.arc(fx, fy, currentSize, 0, Math.PI * 2);

          if (activeNode && activeNode.districtName === d.name && activeNode.seedIdx === idx) {
            ctx!.fillStyle = `rgba(${d.baseColor}, 0.95)`;
            ctx!.strokeStyle = 'rgba(15, 61, 52, 0.5)';
            ctx!.lineWidth = 1;
            ctx!.stroke();
          } else {
            const bubbleGrad = ctx!.createRadialGradient(
              fx - currentSize * 0.15, fy - currentSize * 0.15, currentSize * 0.05, fx, fy, currentSize,
            );
            let maxAlpha = d.layer === 'inner' ? 0.14 : 0.22;
            let alpha = maxAlpha * Math.pow(fluff.ratio, 1.8);
            if (alpha < 0.02) alpha = 0.02;
            bubbleGrad.addColorStop(0, `rgba(${d.baseColor}, 0.005)`);
            bubbleGrad.addColorStop(0.4, `rgba(${d.baseColor}, ${alpha * 0.18})`);
            bubbleGrad.addColorStop(0.88, `rgba(${d.baseColor}, ${alpha})`);
            bubbleGrad.addColorStop(1, `rgba(${d.baseColor}, 0.0)`);
            ctx!.fillStyle = bubbleGrad;
          }
          ctx!.fill();
          fluff.curX = fx; fluff.curY = fy; fluff.renderedSize = currentSize;
        });

        const maxFluffSize = Math.max(...d.fluffs.map((f: any) => f.baseSize));
        const textDist = maxFluffSize + (d.layer === 'inner' ? 14 : 40);
        const tx = cx + Math.cos(currentAngle) * (d.radius + textDist) * globalScale;
        const ty = cy + Math.sin(currentAngle) * (d.radius + textDist) * globalScale;

        ctx!.save();
        ctx!.translate(tx, ty);
        ctx!.textAlign = Math.cos(currentAngle) > 0 ? 'left' : 'right';
        if (d.name === highestScoreDistrictName) {
          ctx!.fillStyle = '#8a2b2b';
          ctx!.font = 'bold 13px -apple-system, sans-serif';
          ctx!.fillText(`★ ${d.name}`, 0, -3);
          ctx!.fillStyle = '#b86363';
          ctx!.font = 'bold 9px sans-serif';
          ctx!.fillText(`最高分 ${d.score.toFixed(2)} `, 0, 9);
        } else {
          ctx!.fillStyle = '#1a2a2a';
          ctx!.font = 'bold 12px -apple-system, sans-serif';
          ctx!.fillText(d.name, 0, -3);
          ctx!.fillStyle = d.layer === 'inner' ? '#a3988c' : '#5c7a73';
          ctx!.font = '9px sans-serif';
          ctx!.fillText(`总分 ${d.score.toFixed(2)}`, 0, 9);
        }
        ctx!.restore();
      });

      animId = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      isHovered = true;
      let minDist = 22;
      let foundSeed: any = null;
      let foundDistrict: any = null;
      let foundIdx = -1;
      dandelions.forEach((d: any) => {
        d.fluffs.forEach((fluff: any, idx: number) => {
          if (!fluff.curX) return;
          const dist = Math.hypot(fluff.curX - mouseX, fluff.curY - mouseY);
          if (dist < minDist) { minDist = dist; foundSeed = fluff; foundDistrict = d; foundIdx = idx; }
        });
      });
      if (foundSeed && foundDistrict) {
        activeNode = { districtName: foundDistrict.name, seedIdx: foundIdx };
        tooltip!.style.opacity = '1';
        tooltip!.style.left = `${e.clientX + 15}px`;
        tooltip!.style.top = `${e.clientY + 15}px`;
        const isTop = foundDistrict.name === highestScoreDistrictName ? ' <span style="color:#8a2b2b;font-weight:bold;">[全场最高分]</span>' : '';
        tooltip!.innerHTML = `<strong>${foundDistrict.name}</strong> (${foundDistrict.layer === 'inner' ? '内层低分' : '外层高分'})${isTop}<br/>
          <span style="color:#165246">█</span> 考核总均分: ${foundDistrict.score.toFixed(2)} 分<br/>
          <hr style="border:none;border-top:1px solid #e0dbcd;margin:5px 0;"/>
          当前粒子指标: <strong>${foundSeed.label}</strong><br/>
          该项指标实际得分: ${foundSeed.val.toFixed(2)} 分<br/>
          <span style="font-size:10px;color:#8c8c8c;">多维映射：a分(${foundDistrict.a}) | b分(${foundDistrict.b}) | c分(${foundDistrict.c})</span>`;
      } else {
        activeNode = null;
        tooltip!.style.opacity = '0';
      }
    }

    resize();
    initData();
    // 延迟启动 Canvas 动画，让 ECharts 图表先完成入场动画
    const startTimer = setTimeout(() => {
      animId = requestAnimationFrame(draw);
    }, 800);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', () => { isHovered = false; activeNode = null; tooltip.style.opacity = '0'; });
    const onResize = () => { resize(); initData(); };
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#ffffff' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div ref={tooltipRef} style={{
        position: 'absolute', padding: '10px 15px', background: 'rgba(255,255,255,0.96)',
        border: '1px solid #e0dbcd', boxShadow: '0 6px 25px rgba(0,0,0,0.04)',
        borderRadius: '4px', fontSize: '12px', color: '#333', pointerEvents: 'none',
        opacity: 0, zIndex: 100, lineHeight: 1.6,
      }} />
    </div>
  );
}
