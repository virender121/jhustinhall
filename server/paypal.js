import crypto from 'node:crypto';

const base=()=>process.env.PAYPAL_ENV==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
function required(n){
    if(!process.env[n]) 
        throw new Error(`${n} is required`); 
    return process.env[n];}
async function paypalFetch(path, options={}){ 
    const controller=new AbortController(); 
    const timer=setTimeout(()=>controller.abort(),12000); 
    try{
        return await fetch(`${base()}${path}`,{...options,signal:controller.signal});
    } finally{
        clearTimeout(timer);
    } 
}
async function accessToken(){ 
    const auth=Buffer.from(`${required('PAYPAL_CLIENT_ID')}:${required('PAYPAL_CLIENT_SECRET')}`).toString('base64'); 
    const r=await paypalFetch('/v1/oauth2/token',{
        method:'POST',
        headers:{Authorization:`Basic ${auth}`, 'Content-Type':'application/x-www-form-urlencoded'},
        body:'grant_type=client_credentials'}); 
        if(!r.ok) throw new Error(`PayPal authentication failed (${r.status})`); 
        return (await r.json()).access_token; 
        }
async function authed(path,{
    method='GET',
    body,
    requestId}={}){ 
        const token=await accessToken(); 
        const headers={
            Authorization:`Bearer ${token}`,
            'Content-Type':'application/json',
            'Prefer':'return=representation'
        }; 
        if(requestId) headers['PayPal-Request-Id']=requestId; 
        const r=await paypalFetch(path,{
            method,
            headers,
            body:body?JSON.stringify(body):undefined
        }); 
        const data=await r.json().catch(()=>({})); 
        if(!r.ok){
            const e=new Error(`PayPal request failed (${r.status})`);
            e.status=r.status;
            e.details=data;
            throw e;
        } 
        return data; 
    }
export async function createPayPalOrder({
    orderNumber,
    totalCents,
    currency,
    items}){ 
        const app=required('APP_URL').replace(/\/$/,''); 
        return authed('/v2/checkout/orders',{
            method:'POST',
            requestId:`create-${orderNumber}`,
            body:{
                intent:'CAPTURE',
                purchase_units:[{
                    reference_id:orderNumber,
                    custom_id:orderNumber,
                    amount:{
                        currency_code:currency,
                        value:(totalCents/100).toFixed(2),
                        breakdown:{
                            item_total:{
                                currency_code:currency,
                                value:(totalCents/100).toFixed(2)
                            }
                        }
                    },
                    items:items.map(i=>({
                        name:i.name.slice(0,127),
                        sku:i.product_id.slice(0,127),
                        quantity:String(i.quantity),
                        category:'PHYSICAL_GOODS',
                        unit_amount:{currency_code:currency,value:(i.unit_price_cents/100).toFixed(2)}
                    }))}],
                payment_source:{
                    paypal:{
                        experience_context:{
                            user_action:'PAY_NOW',
                            shipping_preference:'GET_FROM_FILE',
                            return_url:`${app}/api/paypal/return`,
                            cancel_url:`${app}/checkout.html?cancelled=1`
                        }
                    }
                }}}); }
export const getPayPalOrder=id=>authed(`/v2/checkout/orders/${encodeURIComponent(id)}`);
export const capturePayPalOrder=(id,requestId)=>authed(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`,{
    method:'POST',
    requestId});
export async function verifyWebhook(headers,event){ 
    const token=await accessToken(); 
    const body={
        transmission_id:headers['paypal-transmission-id'],
        transmission_time:headers['paypal-transmission-time'],
        cert_url:headers['paypal-cert-url'],
        auth_algo:headers['paypal-auth-algo'],
        transmission_sig:headers['paypal-transmission-sig'],
        webhook_id:required('PAYPAL_WEBHOOK_ID'),
        webhook_event:event
    };
    const r=await paypalFetch('/v1/notifications/verify-webhook-signature',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok) return false;
    return (await r.json()).verification_status==='SUCCESS';
}
export function safeEqual(a,b){ 
    const x=Buffer.from(String(a)),y=Buffer.from(String(b)); 
    return x.length===y.length && crypto.timingSafeEqual(x,y); 
}
