const { Client } = require("pg");
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
client.connect();
client.query("SELECT * FROM antibayan ORDER BY posted_at")
    .then(async res => {
        const total = res.rowCount;
        if (total > 3000){
            const lines = total - 2000;
            await client.query(
                "DELETE FROM antibayan WHERE ctid IN " +
                    "(SELECT ctid FROM antibayan ORDER BY posted_at ASC LIMIT $1);",
                [lines]);
            console.log(`deleted ${lines} first lines`);
            await client.query("VACUUM;");
        }
        else
        {
            console.log("nothing to delete");
        }
        client.end();
    });
