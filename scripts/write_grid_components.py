#!/usr/bin/env python3
"""Write 2x2 grid analysis components for the dashboard."""

import os
from pathlib import Path

base = Path(__file__).resolve().parent.parent / 'src' / 'components'

# ============================================================
# RegionalAnalysis.tsx
# ============================================================
regional_tsx = r'''import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import gsap from 'gsap';
import type { DashboardData } from '../types';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const SN: Record<string, string> = {
  'B1.1-\u00a9\u516c\u5171\u6559\u5b66\u7528\u623f\u5f97\u5206\u7387': '\u516c\u5171\u6559\u5b66\u7528\u623f',
  'B5.1-\u00a9\u751f\u673a\u6bd4\u5f97\u5206\u7387': '\u751f\u673a\u6bd4',
  'C2.3-\u2460\u5f97\u5206\u7387': '\u4e2d\u9ad8\u7ea7\u804c\u79f0',
  'B1.1-\u00a9\u4e13\u7528\u6559\u5ba4\u9762\u79ef\u5f97\u5206\u7387': '\u4e13\u7528\u6559\u5ba4\u9762\u79ef',
  'C1.1-\u2460\u5f97\u5206\u7387': '\u6559\u804c\u5de5\u6570',
  'C1.2-\u2460\u5f97\u5206\u7387': '\u751f\u5e08\u6bd4',
  'B2.1-\u00a9\u6821\u56ed\u751f\u6d3b\u670d\u52a1\u7528\u623f\u5f97\u5206\u7387': '\u751f\u6d3b\u7528\u623f',
  'C4.1-\u2460\u5f97\u5206\u7387': '\u97f3\u4f53\u7f8e\u6559\u5e08',
  'B1.2-\u00a9\u751f\u5747\u7528\u5730\u9762\u79ef\u5f97\u5206\u7387': '\u7528\u5730\u9762\u79ef',
  'B2.1-\u2460\u6821\u56ed\u529e\u516c\u7528\u623f\u9762\u79ef\u5f97\u5206\u7387': '\u529e\u516c\u7528\u623f',
  'B5.1-\u00a9\u5e08\u673a\u6bd4\u5f97\u5206\u7387': '\u5e08\u673a\u6bd4',
  'B7.1-\u2460\u751f\u5747\u7eff\u5730\u9762\u79ef\u5f97\u5206\u7387': '\u7eff\u5730\u9762\u79ef',
  'B1.2-\u2460\u751f\u5747\u6821\u820d\u5efa\u7b51\u9762\u79ef\u5f97\u5206\u7387': '\u6821\u820d\u9762\u79ef',
  'B3.1-\u2460\u751f\u5747\u56fe\u4e66\u518c\u6570\u5f97\u5206\u7387': '\u56fe\u4e66\u518c\u6570',
};

export default function RegionalAnalysis({ data }: { data: DashboardData }) {
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const r3 = useRef<HTMLDivElement>(null);
  const r4 = useRef<HTMLDivElement>(null);
  const ct = useRef<HTMLDivElement>(null);

  useEffect(() => { gsap.fromTo(ct.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power3.out' }); }, []);

  // Shared chart init helper
  const initChart = (ref: React.RefObject<HTMLDivElement | null>, opt: echarts.EChartsCoreOption) => {
    useEffect(() => {
      if (!ref.current) return;
      const c = echarts.init(ref.current, 'dark');
      c.setOption(opt);
      const h = () => c.resize();
      window.addEventListener('resize', h);
      return () => { window.removeEventListener('resize', h); c.dispose(); };
    }, []);
  };

  // C1: Grouped bar
  const areas = ['\u57ce\u5e02', '\u53bf\u949f', '\u519c\u6751'];
  const keys = ['B1.1-\u00a9\u516c\u5171\u6559\u5b66\u7528\u623f\u5f97\u5206\u7387','B5.1-\u00a9\u751f\u673a\u6bd4\u5f97\u5206\u7387','C2.3-\u2460\u5f97\u5206\u7387','B1.1-\u00a9\u4e13\u7528\u6559\u5ba4\u9762\u79ef\u5f97\u5206\u7387','C1.1-\u2460\u5f97\u5206\u7387','C1.2-\u2460\u5f97\u5206\u7387','B2.1-\u00a9\u6821\u56ed\u751f\u6d3b\u670d\u52a1\u7528\u623f\u5f97\u5206\u7387','C4.1-\u2460\u5f97\u5206\u7387'];
  const colors = ['#4da8ff','#00d4ff','#a855f7'];
  initChart(r1, {
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'rgba(22,27,46,0.95)',borderColor:'rgba(255,255,255,0.1)',textStyle:{color:'#e8eaed',fontSize:11}},
    legend:{data:areas,bottom:0,textStyle:{color:'#9aa0b0',fontSize:10}},
    grid:{left:'3%',right:'4%',top:'8%',bottom:'14%',containLabel:true},
    xAxis:{type:'category',data:keys.map(k=>SN[k]||k),axisLabel:{color:'#9aa0b0',fontSize:9,rotate:30},axisTick:{show:false}},
    yAxis:{type:'value',max:1,axisLabel:{color:'#9aa0b0',fontSize:9,formatter:(v:number)=>(v*100).toFixed(0)+'%'},splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}}},
    series:areas.map((a,i)=>({name:a,type:'bar',barWidth:'22%',barGap:'8%',itemStyle:{borderRadius:[3,3,0,0],color:colors[i]+'cc'},data:keys.map(k=>+(data.urban_rural_analysis[a]?.[k]??0).toFixed(3))})),
  });

  // C2: City - Rural difference
  const diffs = Object.keys(SN).map(k=>{const city=data.urban_rural_analysis['\u57ce\u5e02']?.[k]??0;const rural=data.urban_rural_analysis['\u519c\u6751']?.[k]??0;return{name:SN[k]||k,diff:city-rural,city,rural};}).sort((a,b)=>a.diff-b.diff);
  initChart(r2, {
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'rgba(22,27,46,0.95)',borderColor:'rgba(255,255,255,0.1)',textStyle:{color:'#e8eaed',fontSize:11},formatter:(p:any)=>{const pa=p as {name:string;value:number}[];if(!pa?.length)return'';const d=diffs.find(x=>x.name===pa[0].name);return d?`<b>${d.name}</b><br/>\u57ce\u5e02: ${(d.city*100).toFixed(1)}%<br/>\u519c\u6751: ${(d.rural*100).toFixed(1)}%<br/>\u5dee\u5f02: <b>${(d.diff*100).toFixed(1)}%</b>`:'';}},
    grid:{left:'3%',right:'8%',top:'3%',bottom:'3%',containLabel:true},
    xAxis:{type:'value',axisLabel:{color:'#9aa0b0',fontSize:9,formatter:(v:number)=>(v*100).toFixed(0)+'%'},splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}}},
    yAxis:{type:'category',data:diffs.map(d=>d.name),axisLabel:{color:'#9aa0b0',fontSize:9},axisLine:{show:false},axisTick:{show:false}},
    series:[{type:'bar',barWidth:12,data:diffs.map(d=>({value:d.diff,itemStyle:{borderRadius:d.diff>0?[0,3,3,0]:[3,0,0,3],color:d.diff>0?new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#4da8ff'},{offset:1,color:'#00d4ff'}]):new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#ff9f43'},{offset:1,color:'#ff5c5c'}])}}))}],
  });

  // C3: Rural bottom 10
  const ruralWorst = Object.entries(data.urban_rural_analysis['\u519c\u6751']||{}).filter(([k])=>SN[k]).map(([k,v])=>({name:SN[k]||k,rate:v})).sort((a,b)=>a.rate-b.rate).slice(0,10);
  initChart(r3, {
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'rgba(22,27,46,0.95)',borderColor:'rgba(255,255,255,0.1)',textStyle:{color:'#e8eaed',fontSize:11}},
    grid:{left:'3%',right:'8%',top:'3%',bottom:'3%',containLabel:true},
    xAxis:{type:'value',max:1,axisLabel:{color:'#9aa0b0',fontSize:9,formatter:(v:number)=>(v*100).toFixed(0)+'%'},splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}}},
    yAxis:{type:'category',data:ruralWorst.map(d=>d.name).reverse(),axisLabel:{color:'#9aa0b0',fontSize:9},axisLine:{show:false},axisTick:{show:false},inverse:true},
    series:[{type:'bar',barWidth:12,data:ruralWorst.reverse().map(d=>({value:d.rate,itemStyle:{borderRadius:[0,4,4,0],color:new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#ff5c5c'},{offset:1,color:'#ff9f43'}])}})),label:{show:true,position:'right',color:'#e8eaed',fontSize:9,formatter:(p:{value:number})=>(p.value*100).toFixed(0)+'%'}}],
  });

  // C4: Avg score comparison
  const areaStats = areas.map(a=>data.by_urban_rural[a]||{avg_score:0});
  initChart(r4, {
    backgroundColor:'transparent',
    tooltip:{trigger:'axis',backgroundColor:'rgba(22,27,46,0.95)',borderColor:'rgba(255,255,255,0.1)',textStyle:{color:'#e8eaed',fontSize:11}},
    grid:{left:'3%',right:'4%',top:'8%',bottom:'3%',containLabel:true},
    xAxis:{type:'category',data:areas,axisLabel:{color:'#e8eaed',fontSize:11},axisTick:{show:false}},
    yAxis:{type:'value',name:'\u603b\u5206',min:38,max:44,nameTextStyle:{color:'#9aa0b0',fontSize:9},axisLabel:{color:'#9aa0b0',fontSize:9},splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}}},
    series:areaStats.map((s,i)=>({type:'bar',name:areas[i],data:[{value:s.avg_score,itemStyle:{borderRadius:[6,6,0,0],color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:colors[i]},{offset:1,color:colors[i]+'44'}])}}],barWidth:'35%',barGap:'10%',label:{show:true,position:'top',color:'#e8eaed',fontSize:12,fontWeight:'bold',formatter:'{c}'}})),
  });

  return (
    <div ref={ct} className="h-full p-3">
      <div className="grid grid-cols-2 gap-3" style={{ height: 'calc(100vh - 140px)' }}>
        {[
          {r:r1,t:'\u57ce\u5e02 vs \u53bf\u949f vs \u519c\u6751 \u00b7 \u5173\u952e\u6307\u6807\u5bf9\u6bd4',i:'\ud83d\udcca',c:'#4da8ff',p:'\u84dd\u8272=\u57ce\u5e02 \u9752\u8272=\u53bf\u949f \u7d2b\u8272=\u519c\u6751'},
          {r:r2,t:'\u57ce\u4e61\u5dee\u5f02\u56fe\u8c31 \u00b7 \u57ce\u5e02\u2212\u519c\u6751\u5dee\u503c',i:'\u2194\ufe0f',c:'#00d4ff',p:'\u84dd\u8272=\u57ce\u5e02\u5360\u4f18 \u7ea2\u6a59\u8272=\u519c\u6751\u5360\u4f18'},
          {r:r3,t:'\u519c\u6751\u5b66\u6821\u6700\u77ed\u677fTOP10',i:'\ud83c\udf3e',c:'#ff9f43',p:'\u519c\u6751\u5b66\u6821\u516c\u5171\u6559\u5b66\u7528\u623f\u5f97\u5206\u7387\u4ec524.5%'},
          {r:r4,t:'\u4e09\u5927\u533a\u57df\u5e73\u5747\u603b\u5206\u5bf9\u6bd4',i:'\ud83c\udfc6',c:'#a855f7',p:`\u57ce\u5e02${areaStats[0].avg_score?.toFixed(1)} \u00b7 \u53bf\u949f${areaStats[1].avg_score?.toFixed(1)} \u00b7 \u519c\u6751${areaStats[2].avg_score?.toFixed(1)}`},
        ].map((item,i)=>(
          <div key={i} className="card-border p-3 flex flex-col" style={{minHeight:0}}>
            <h3 className="text-xs font-semibold text-text-primary mb-1.5 flex items-center gap-1.5 flex-shrink-0">
              <span style={{color:item.c}}>{item.i}</span><span>{item.t}</span>
            </h3>
            <div className="flex-1 relative" style={{minHeight:0}}><div ref={item.r} style={{width:'100%',height:'100%'}} /></div>
            <p className="text-[10px] text-text-muted text-center mt-1 flex-shrink-0">{item.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
'''

with open(os.path.join(base, 'RegionalAnalysis.tsx'), 'w', encoding='utf-8') as f:
    f.write(regional_tsx)
print('RegionalAnalysis.tsx written')
'''

print("Use replace_string_in_file approach instead - the unicode escapes are causing issues")
