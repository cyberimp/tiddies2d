const { Client } = require("pg");
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
const table = process.env.DB_TABLE;
client.connect();
client.query("SELECT * FROM $1 ORDER BY posted_at",[table])
    .then(res => {
        console.log(res.rowCount);
    });