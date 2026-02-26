const fs = require('fs');
const file = 'src/components/ReservationsDashboard.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.split('\\"').join('"');
fs.writeFileSync(file, c);
console.log('Fixed ', file);
