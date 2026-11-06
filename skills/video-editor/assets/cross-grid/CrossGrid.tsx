import React,{useId} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {cellsAt} from './cross-grid.cjs';
export function CrossGrid({children,gap=2,stagger=3,reducedMotion=false}:{children:React.ReactNode;gap?:number;stagger?:number;reducedMotion?:boolean}){
 const frame=useCurrentFrame(),{fps,width,height,durationInFrames}=useVideoConfig(),id='grid'+useId().replace(/:/g,'');
 const cells=cellsAt({frame,fps,width,height,duration:durationInFrames/fps,gap,stagger,reducedMotion});
 return <><svg width="0" height="0" aria-hidden="true"><defs><clipPath id={id} clipPathUnits="userSpaceOnUse">{cells.map((c:any)=><rect key={c.index} width={c.width} height={c.height} transform={`translate(${c.x} ${c.y+c.height*(1-c.progress)}) scale(1 ${c.progress})`}/>)}</clipPath></defs></svg><AbsoluteFill style={{clipPath:`url(#${id})`}}>{children}</AbsoluteFill></>;
}
