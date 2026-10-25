import fs from 'fs';
process.env.JWT_SECRET='test-secret'; process.env.DATABASE_URL='file:test.db';
for (const f of ['test.db','test.db-wal','test.db-shm']) fs.rmSync(f,{force:true});
