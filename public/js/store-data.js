window.Store={
 getCart(){try{return JSON.parse(localStorage.getItem('jh_cart'))||[]}catch{return[]}},
 setCart(c){localStorage.setItem('jh_cart',JSON.stringify(c));},
 add(id,qty=1){const c=this.getCart(),x=c.find(i=>i.productId===id);if(x)x.quantity+=qty;else c.push({productId:id,quantity:qty});this.setCart(c);},
 money(n,c='USD'){return new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(n)}
};
