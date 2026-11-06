import React from 'react';
import {AbsoluteFill,Composition,registerRoot} from 'remotion';
import {CrossGrid} from './CrossGrid';
import defaults from './example.json';
function Demo(p:typeof defaults){return <AbsoluteFill style={{background:'#0A0A0A',color:'#FAFAF9',fontFamily:'Arial,sans-serif'}}><CrossGrid gap={p.gap} stagger={p.stagger} reducedMotion={p.reducedMotion}><svg width="360" height="640" viewBox="0 0 360 640" preserveAspectRatio="none"><defs><linearGradient id="paper"><stop stopColor="#171717"/><stop offset="1" stopColor="#868686"/></linearGradient></defs><rect width="360" height="640" fill="url(#paper)"/><path d="M 250 0 L 360 0 L 160 640 L 70 640 Z" fill="#BBBBB5"/>{Array.from({length:12},(_,i)=><path key={i} d={`M 0 ${440+i*18} L 360 ${360+i*18}`} stroke="#0A0A0A" strokeWidth="3"/>)}</svg></CrossGrid><div style={{position:'absolute',top:32,left:24,fontSize:11,letterSpacing:2}}>GRID STUDY / 01</div><div style={{position:'absolute',top:245,left:24,right:24,fontSize:40,lineHeight:1.05,whiteSpace:'pre-line'}}>{p.headline}</div></AbsoluteFill>}
const Root=()=> <Composition id="CrossGrid" component={Demo} width={360} height={640} fps={30} durationInFrames={360} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:Math.round(props.duration*30)})}/>;
registerRoot(Root);
