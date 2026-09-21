document.addEventListener('DOMContentLoaded',async()=>{
    try{
        const ps=await fetch('/api/products').then(r=>r.json());
        for(const p of ps){
            const card=document.querySelector(`[data-product-id="${CSS.escape(p.id)}"]`);
            if(!card)continue;
            const price=card.querySelector('.price');
            if(price)price.textContent=Store.money(p.price,p.currency);
            const name=card.querySelector('h3 a');
            if(name)name.textContent=p.name;
        }
    } catch(e) {
        console.error(e);
    }
});
