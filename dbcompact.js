const { Client } = require("pg");
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
client.connect();
client.query("SELECT * FROM antibayan ORDER BY posted_at")
    .then(res => {
        console.log(res.rowCount);
    });