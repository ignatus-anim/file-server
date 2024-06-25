import pg from 'pg'
const { Pool } = pg;
import { config } from './config.js';

const pool = new Pool(config.db);

export default pool;
