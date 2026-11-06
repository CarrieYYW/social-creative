// Original generic implementation of a cross-first 3x3 matte. No creator assets/presets.
function ease(q){q=Math.max(0,Math.min(1,q));return q*q*(3-2*q);}
function cellsAt({frame,fps,duration,gap=2,stagger=3,reducedMotion=false,width=360,height=640}){
 if(![frame,fps,duration,gap,stagger,width,height].every(Number.isFinite)||frame<0||fps<=0||duration<=0||gap<0||gap>=Math.min(width,height)/3||stagger<0)throw Error('Invalid matte geometry or timing.');
 const t=frame/fps*12/duration,order=[4,3,5,1,7,0,2,6,8],cw=width/3,ch=height/3;
 return Array.from({length:9},(_,i)=>{const rank=order.indexOf(i),start=rank<5?.15+rank*stagger/fps:2+(rank-5)*stagger/fps;
 const end=rank>=5?9+(8-rank)*stagger/fps:9.7+(4-rank)*stagger/fps;
 const progress=reducedMotion?1:Math.min(ease((t-start)/.2),1-ease((t-end)/.2));
 return {index:i,x:i%3*cw+gap/2,y:Math.floor(i/3)*ch+gap/2,width:cw-gap,height:ch-gap,progress};});
}
module.exports={cellsAt};
