const { Client } = require("pg");
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
client.connect();
client.query("SELECT * FROM antibayan ORDER BY posted_at")
    .then(async res => {
        const total = res.rowCount;
        if (total > 1128){
            const lines = total - 1128;
            let del = await client.query("WITH q AS (SELECT * FROM antibayan ORDER BY posted_at ASC LIMIT $1) DELETE FROM q",[lines]);
            console.log(del);
        }
    });