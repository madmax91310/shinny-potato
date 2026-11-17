// Bound raster memory without changing the logical layout or dropping rows.
export function fitImageCanvas(width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Dimensions d’image invalides.')
 const scale=Math.min(1,16000/width,16000/height,Math.sqrt(32_000_000/(width*height)))
 return {width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale)),scale}
}
