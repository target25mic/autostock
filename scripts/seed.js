import {db,init} from '../backend/src/db.js'; await init();
if(process.env.NODE_ENV==='production') throw new Error('Refusing to seed sample data in production');
const n=Number((await db().execute('SELECT COUNT(*) n FROM vehicles')).rows[0].n); if(n) {console.log('Already seeded');process.exit(0);}
for(const v of [['Toyota','Camry','Sedan',26500,5],['Honda','CR-V','SUV',32000,3],['Ford','F-150','Truck',45000,2],['Tesla','Model 3','Sedan',40000,0],['BMW','X5','SUV',65000,4]])
  await db().execute({sql:'INSERT INTO vehicles(make,model,category,price,quantity) VALUES(?,?,?,?,?)',args:v});
console.log('Seeded');
