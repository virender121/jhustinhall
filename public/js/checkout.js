document.addEventListener('DOMContentLoaded',async()=>{
 const form=document.getElementById('checkoutForm'), 
 empty=document.getElementById('checkoutEmpty'), 
 msg=document.getElementById('checkoutMessage'), 
 btn=document.getElementById('placeOrderButton'), 
 ship=document.getElementById('shipDifferent'), 
 shipFields=document.getElementById('shippingFields');
 const cart=Store.getCart(); 
 if(!cart.length){
    form.style.display='none';
    empty.style.display='block';
    return
}
 ship?.addEventListener('change',()=>shipFields.style.display=ship.checked?'block':'none');
 const products=await fetch('/api/products').then(r=>r.json()), 
 map=Object.fromEntries(products.map(p=>[p.id,p]));
 let total=0,currency='USD';
 const tbody=document.getElementById('checkoutProducts');
 tbody.innerHTML='';
 for(const line of cart){
    const p=map[line.productId];
    if(!p)continue;
    currency=p.currency;
    const lineTotal=p.price*line.quantity;
    total+=lineTotal;
    tbody.insertAdjacentHTML('beforeend',`<tr><td>${p.name} × ${line.quantity}</td>
        <td>${Store.money(lineTotal,p.currency)}</td>
        </tr>`)}
        document.getElementById('checkoutSubtotal').textContent=Store.money(total,currency);
        document.getElementById('checkoutTotal').textContent=Store.money(total,currency);
        document.getElementById('shippingAmount').textContent='Free';
 const q=new URLSearchParams(location.search);
 if(q.get('cancelled'))msg.textContent='PayPal payment was cancelled. Your cart is still saved.';
 if(q.get('error'))msg.textContent='Payment could not be completed. Please try again.';
 form.addEventListener('submit',async e=>{e.preventDefault();
    if(!form.checkValidity()){
        form.reportValidity();
        return
    }
    btn.disabled=true;
    msg.textContent='Connecting securely to PayPal…';
    const v=id=>document.getElementById(id)?.value?.trim()||'';
    const customer={
        first_name:v('billing_first_name'),
        last_name:v('billing_last_name'),
        company:v('billing_company'),
        country:v('billing_country'),
        address_1:v('billing_address_1'),
        address_2:v('billing_address_2'),
        city:v('billing_city'),
        state:v('billing_state'),
        postcode:v('billing_postcode'),
        phone:v('billing_phone'),
        email:v('billing_email')
    };
    const shipping=ship?.checked?{
        first_name:v('shipping_first_name'),
        last_name:v('shipping_last_name'),
        address:v('shipping_address'),
        city:v('shipping_city'),
        state:v('shipping_state'),
        postcode:v('shipping_postcode')
    }:customer;
    try{
        const r=await fetch('/api/paypal/create-order',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({
                cart,customer,shipping,notes:v('order_comments')})});
        const data=await r.json();if(!r.ok)throw new Error(data.error||'Checkout failed');location.href=data.approveUrl}catch(err){msg.textContent=err.message;btn.disabled=false}});
});
