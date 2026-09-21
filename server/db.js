import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  statement_timeout: 10000,
  query_timeout: 12000,
  application_name: 'jhustin-store'
});

pool.on('error', err => console.error('Unexpected database pool error', err));

export async function tx(fn){ 
  const c=await pool.connect(); 
  try{ 
    await c.query('BEGIN'); 
    const v=await fn(c); 
    await c.query('COMMIT'); 
    return v; 
  } 
  catch(e) { 
    await c.query('ROLLBACK'); 
    throw e; 
  } 
  finally { 
    c.release(); 
  } 
}
