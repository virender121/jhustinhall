import 'dotenv/config';
import express from 'express'; 
import helmet from 'helmet'; 
import path from 'node:path'; 
import crypto from 'node:crypto'; 
import {fileURLToPath} from 'node:url'; 
import {z} from 'zod'; 
import {pool,tx} from './db.js'; 
import {createPayPalOrder,capturePayPalOrder,getPayPalOrder,verifyWebhook} from './paypal.js';

const app=express(), __dirname=path.dirname(fileURLToPath(import.meta.url)); 
app.disable('x-powered-by'); 

if(process.env.TRUST_PROXY==='true') 
    app.set('trust proxy',1);

const isProd=process.env.NODE_ENV==='production';

app.use(helmet({
    contentSecurityPolicy:{
        directives:{
            defaultSrc:["'self'"],
            scriptSrc:["'self'",
            "'unsafe-inline'",
            "https://www.paypal.com",
            "https://www.paypalobjects.com"],
            styleSrc:["'self'","'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdnjs.cloudflare.com"],
            fontSrc:["'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "data:"],imgSrc:["'self'","data:","https:"],
                connectSrc:["'self'","https://www.paypal.com",
                    "https://api-m.paypal.com",
                    "https://api-m.sandbox.paypal.com"],
                    frameSrc:["'self'","https://www.paypal.com"],
                    objectSrc:["'none'"],
                    baseUri:["'self'"],
                    formAction:["'self'","https://www.paypal.com"],
                    frameAncestors:["'none'"],
                    upgradeInsecureRequests:isProd?[]:null
                }
            }}
        ));
app.use((req,res,next)=>{ 
    if(isProd && req.headers['x-forwarded-proto'] 
        && req.headers['x-forwarded-proto']!=='https') 
        return res.redirect(308,`https://${req.headers.host}${req.originalUrl}`); 
        next(); 
    });
const buckets=new Map(); 
function rateLimit({windowMs,max}){
    return(req,res,next)=>{
        const now=Date.now(),
        key=req.ip||req.socket.remoteAddress||'unknown';
        let b=buckets.get(key);
        if(!b||now>b.reset){
            b={count:0,reset:now+windowMs};
            buckets.set(key,b);
        } 
        if(++b.count>max){
            res.set('Retry-After',String(Math.ceil((b.reset-now)/1000)));
            return res.status(429).json({error:'Too many requests'});
        } 
        next();
    };
} 
setInterval(()=>{
    const n=Date.now();
    for(const[k,b]of buckets)
        if(n>b.reset)buckets.delete(k)},
    60000).unref();
app.use('/api/',rateLimit({
    windowMs:60000,
    max:120})); 
app.use('/api/paypal/create-order',
    rateLimit({
        windowMs:
        60000,max:12
    }));
app.use(express.json({
    limit:'32kb',
    type:'application/json'})); 
app.use(express.urlencoded({
    extended:false,
    limit:'16kb'}));

const clean=s=>String(s??'').trim();
 const Customer=z.object({
    first_name:z.string().trim().min(1).max(80),
    last_name:z.string().trim().min(1).max(80),
    email:z.string().trim().email().max(254),
    phone:z.string().trim().min(5).max(40),
    company:z.string().trim().max(120).optional().default(''),
    country:z.string().trim().length(2).optional(),
    address_1:z.string().trim().max(200).optional(),
    address_2:z.string().trim().max(200).optional(),
    city:z.string().trim().max(100).optional(),
    state:z.string().trim().max(100).optional(),
    postcode:z.string().trim().max(30).optional()}).strict(); 
const Shipping=z.record(
    z.string(),
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null()
    ])
).optional().default({}); 

const CartLine=z.object({
    productId:z.string().trim().min(1).max(100),
    quantity:z.coerce.number().int().min(1).max(20)
}).strict(); 
const Checkout=z.object({
    cart:z.array(CartLine).min(1).max(50),
    customer:Customer,
    shipping:Shipping,
    notes:z.string().trim().max(1000).optional().default('')
}).strict();
app.get('/api/products',async(req,res,next)=>{
    try{
        const {rows}=await pool.query('SELECT id,name,description,price_cents,currency,image,type FROM products WHERE active=true ORDER BY id');
        res.json(rows.map(p=>({...p,price:p.price_cents/100})));
    }
    catch(e){
        next(e)
    }
});
app.get('/api/products/:id', async(req,res,next)=>{
    try{
        const {rows}=await pool.query('SELECT id,name,description,price_cents,currency,image,type FROM products WHERE id=$1 AND active=true',[req.params.id]);
        if(!rows[0])return res.status(404).json({error:'Product not found'});
        res.json({
            ...rows[0],
            price:rows[0].price_cents/100
        });
    }
    catch(e){
        next(e)
    }});
app.post('/api/paypal/create-order',async(req,res,next)=>{
    let localOrder;
    try{
        const parsed=Checkout.safeParse(req.body);
        if(!parsed.success)return res.status(400).json({error:'Invalid checkout data'});
        const {cart,customer,shipping,notes}=parsed.data;
        const ids=[...new Set(cart.map(x=>x.productId))];
        const {rows:products}=await pool.query('SELECT id,name,price_cents,currency FROM products WHERE id=ANY($1::text[]) AND active=true',[ids]);
        const map=new Map(products.map(p=>[p.id,p]));
        const items=cart.map(l=>{const p=map.get(l.productId);
            if(!p)throw Object.assign(new Error('Invalid product'),{client:true});
            return{
                product_id:p.id,
                name:p.name,
                unit_price_cents:p.price_cents,
                quantity:l.quantity,
                currency:p.currency
            };
        });
        const currency=items[0].currency;if(items.some(i=>i.currency!==currency))return res.status(400).json({error:'Mixed currencies are not supported'});const totalCents=items.reduce((s,i)=>s+i.unit_price_cents*i.quantity,0);if(totalCents<=0)return res.status(400).json({error:'Invalid order total'});const orderNumber=`JH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
localOrder=await tx(async c=>{const {rows:[o]}=await c.query(`INSERT INTO orders(order_number,status,currency,total_cents,customer,shipping,notes) VALUES($1,'PENDING',$2,$3,$4,$5,$6) RETURNING id,order_number`,[orderNumber,currency,totalCents,customer,shipping,notes]);for(const i of items)await c.query('INSERT INTO order_items(order_id,product_id,name,unit_price_cents,quantity) VALUES($1,$2,$3,$4,$5)',[o.id,i.product_id,i.name,i.unit_price_cents,i.quantity]);return o;});
const pp=await createPayPalOrder({orderNumber,totalCents,currency,items});const approve=pp.links?.find(x=>x.rel==='payer-action'||x.rel==='approve')?.href;if(!approve)throw new Error('PayPal approval URL missing');await pool.query('UPDATE orders SET paypal_order_id=$1,updated_at=now() WHERE id=$2',[pp.id,localOrder.id]);res.status(201).json({orderNumber,paypalOrderId:pp.id,approveUrl:approve});}catch(e){if(localOrder?.id)await pool.query("UPDATE orders SET status='FAILED',updated_at=now() WHERE id=$1 AND paypal_order_id IS NULL",[localOrder.id]).catch(()=>{});if(e.client)return res.status(400).json({error:e.message});next(e);}});
app.get('/api/paypal/return',async(req,res)=>{const token=clean(req.query.token);if(!/^[A-Za-z0-9_-]{5,100}$/.test(token))return res.redirect('/checkout.html?error=missing_token');try{const {rows:[order]}=await pool.query('SELECT * FROM orders WHERE paypal_order_id=$1',[token]);if(!order)return res.redirect('/checkout.html?error=order_not_found');if(order.status==='PAID')return res.redirect(`/success.html?order=${encodeURIComponent(order.order_number)}`);const remote=await getPayPalOrder(token);const pu=remote.purchase_units?.[0];if(pu?.custom_id!==order.order_number||pu?.amount?.currency_code!==order.currency||pu?.amount?.value!==(order.total_cents/100).toFixed(2))throw new Error('PayPal order mismatch');const capture=await capturePayPalOrder(token,`capture-${order.order_number}`);const cap=capture.purchase_units?.[0]?.payments?.captures?.[0];if(!cap)throw new Error('Missing capture');const status=cap.status==='COMPLETED'?'PAID':cap.status==='PENDING'?'PAYMENT_PENDING':'FAILED';await pool.query('UPDATE orders SET status=$1,paypal_capture_id=COALESCE($2,paypal_capture_id),paid_at=CASE WHEN $1=\'PAID\' THEN COALESCE(paid_at,now()) ELSE paid_at END,updated_at=now() WHERE id=$3',[status,cap.id||null,order.id]);if(status!=='PAID')return res.redirect('/checkout.html?error=payment_pending');void sendToGHL(order.order_number);res.redirect(`/success.html?order=${encodeURIComponent(order.order_number)}`);}catch(e){console.error('PayPal return error',e.message);res.redirect('/checkout.html?error=payment_failed');}});
app.post('/api/paypal/webhook',async(req,res)=>{try{if(!req.body?.id||!req.body?.event_type)return res.sendStatus(400);if(!await verifyWebhook(req.headers,req.body))return res.sendStatus(401);const event=req.body;const inserted=await pool.query('INSERT INTO webhook_events(event_id,event_type,payload) VALUES($1,$2,$3) ON CONFLICT(event_id) DO NOTHING RETURNING event_id',[event.id,event.event_type,event]);if(!inserted.rowCount)return res.sendStatus(200);const resource=event.resource||{};const orderId=resource.supplementary_data?.related_ids?.order_id||resource.id;const captureId=event.event_type.startsWith('PAYMENT.CAPTURE.')?resource.id:null;if(event.event_type==='PAYMENT.CAPTURE.COMPLETED')await pool.query("UPDATE orders SET status='PAID',paypal_capture_id=COALESCE($1,paypal_capture_id),paid_at=COALESCE(paid_at,now()),updated_at=now() WHERE paypal_order_id=$2",[captureId,orderId]);else if(event.event_type==='PAYMENT.CAPTURE.PENDING')await pool.query("UPDATE orders SET status='PAYMENT_PENDING',updated_at=now() WHERE paypal_order_id=$1",[orderId]);else if(event.event_type==='PAYMENT.CAPTURE.DENIED')await pool.query("UPDATE orders SET status='FAILED',updated_at=now() WHERE paypal_order_id=$1",[orderId]);else if(event.event_type==='PAYMENT.CAPTURE.REFUNDED')await pool.query("UPDATE orders SET status='REFUNDED',updated_at=now() WHERE paypal_order_id=$1",[orderId]);await pool.query('UPDATE webhook_events SET processed_at=now() WHERE event_id=$1',[event.id]);res.sendStatus(200);}catch(e){console.error('Webhook error',e.message);res.sendStatus(500);}});
app.get('/api/orders/:number',rateLimit({windowMs:60000,max:30}),async(req,res,next)=>{try{const number=clean(req.params.number);if(!/^JH-[A-Z0-9-]{8,60}$/.test(number))return res.status(400).json({error:'Invalid order number'});const {rows:[o]}=await pool.query('SELECT order_number,status,currency,total_cents,created_at,paid_at FROM orders WHERE order_number=$1',[number]);if(!o)return res.status(404).json({error:'Order not found'});res.set('Cache-Control','no-store');res.json({...o,total:o.total_cents/100});}catch(e){next(e)}});
async function sendToGHL(orderNumber){if(process.env.GHL_ENABLED!=='true'||!process.env.GHL_WEBHOOK_URL)return;try{const {rows:[o]}=await pool.query('SELECT order_number,customer,total_cents,currency,status FROM orders WHERE order_number=$1',[orderNumber]);if(!o||o.status!=='PAID')return;const controller=new AbortController();setTimeout(()=>controller.abort(),5000).unref();await fetch(process.env.GHL_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'order.paid',order_number:o.order_number,customer:o.customer,total:o.total_cents/100,currency:o.currency}),signal:controller.signal});}catch(e){console.error('GHL delivery failed',e.message)}}
app.get('/health',async(req,res)=>{try{await pool.query('SELECT 1');res.json({ok:true});}catch{res.status(503).json({ok:false})}});
app.use(express.static(path.join(__dirname,'../public'),{dotfiles:'deny',etag:true,maxAge:isProd?'1h':0,index:false})); app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'../public/store.html')));
app.use((req,res)=>res.status(404).json({error:'Not found'})); app.use((err,req,res,next)=>{const id=crypto.randomUUID();console.error('Request error',id,err.message);res.status(500).json({error:'Internal server error',requestId:id});});
const port=Number(process.env.PORT||3000);const server=app.listen(port,()=>console.log(`Store listening on ${port}`));function shutdown(sig){console.log(`${sig}: shutting down`);server.close(async()=>{await pool.end();process.exit(0)});setTimeout(()=>process.exit(1),10000).unref();}process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));
