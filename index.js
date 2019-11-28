const token = process.env.TG_TOKEN;
const port = process.env.PORT;

const express = require("express");
// const request = require("request");
const app = express();
const bodyParser = require("body-parser");
const tiddies = require("./tiddies");

app.use(bodyParser.json());

// app.get("/setup", (req, res)=>{
//     request("https://api.telegram.org/bot"+ token +
//      "/setWebhook?url="+encodeURIComponent("https://tiddies2d.herokuapp.com/" + token));
//     res.sendStatus(200);
// });

app.post("/"+token, (req, res)=>{
    res.sendStatus(200);
    if ("message" in req.body && "text" in req.body.message && req.body.message.text.startsWith("/tits")) {
        let chatID = req.body.message.chat.id;
        tiddies(1, chatID, false);
    }
});

app.listen(port, () => {
    console.log(`listening for hooks on port ${port}!`);
});