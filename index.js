const token = process.env.TG_TOKEN;
const port = process.env.PORT;

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const tiddies = require("./tiddies");

app.use(bodyParser.json());

app.post("/"+token, (req, res)=>{
    res.sendStatus(200);
    /** @namespace req.body.message.chat*/
    if ("message" in req.body && "text" in req.body.message  && req.body.message.text.startsWith("/tits")) {
        let chatID = req.body.message.chat.id;
        tiddies(1, chatID, false, true);
    }
});

app.listen(port, () => {
    console.log(`listening for hooks on port ${port}!`);
});