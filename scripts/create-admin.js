import bcrypt from 'bcryptjs'; import {db,init} from '../backend/src/db.js'; await init();
const {ADMIN_NAME='Admin',ADMIN_EMAIL,ADMIN_PASSWORD}=process.env;
if(!ADMIN_EMAIL||!ADMIN_PASSWORD||ADMIN_PASSWORD.length<8) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars)');
await db().execute({sql:"INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin') ON CONFLICT(email) DO UPDATE SET role='admin',password_hash=excluded.password_hash",args:[ADMIN_NAME,ADMIN_EMAIL.toLowerCase(),await bcrypt.hash(ADMIN_PASSWORD,10)]});
console.log('Admin ready:',ADMIN_EMAIL);
