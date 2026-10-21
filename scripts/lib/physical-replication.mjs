const physical=/physic|physisch|physique|direct replication/i
const synthetic=/synthe|swap|indirect/i
export function hasPhysicalPortfolio(method,referenceMethod,{issuer}={}){
 if(synthetic.test(method)||synthetic.test(referenceMethod))return false
 if(physical.test(method))return true
 // State Street's current exact-share table abbreviates the physical method
 // to "Optimised". Require the independently sourced physical fund facts too.
 return issuer==='ssga'&&/^Optimi[sz]ed$/i.test(method)&&physical.test(referenceMethod)
}
