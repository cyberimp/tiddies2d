'use strict';
let Danbooru;
Danbooru = require('danbooru');
const request = require('request-promise-native');
const { Client } = require('pg');


const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;
const token = process.env.TG_TOKEN;
const chatID = "@tiddies2d";

async function getTiddies(){
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    let tiddies = [];
    const booru = new Danbooru(login + ":" + password);

    client.connect();

    let posts =[];
    for (let i = 0; i < 6; i++) {
        const page = await booru.posts({ limit: 200, page: i, tags: "solo breasts 1girl -loli score:>50" });
        posts.push(...page);
    }
    try {
        for (let i = 0; i < 5; i++) {
            let post;
            let res;
            do {
                const index = Math.floor(Math.random() * posts.length);
                post = posts[index];
                let query = "SELECT id FROM antibayan WHERE id =" + post.id + ";";
                res = await client.query(query);
            } while (res.rows.length > 0);
//        const url = booru.url(post.large_file_url);
            tiddies.push(post);
            let query = "INSERT INTO antibayan(id,posted_at) VALUES(" + post.id + ",NOW());";
            await client.query(query);
        }
    }
    catch (error){
        console.error(error);
    }
    finally {
        client.end();
    }
    return tiddies;
}
getTiddies().then(async (tiddies) => {
    // let promise = new Promise((resolve, reject) => {
    //     setTimeout(() => resolve("готово!"), 1000)
    //   });
    for (let i = 0; i < tiddies.length; i++) {
        const element = tiddies[i];
        try {
            const url = "https://api.telegram.org/bot"+ token +
                "/sendPhoto?photo=" + encodeURIComponent(element.large_file_url)+
                "&caption=" + encodeURIComponent("*Artist:* `" + element.tag_string_artist+"`\n"+
                                                "*Origin:* `"+ element.tag_string_copyright.replace(/ /g,"\n")
                                                        .replace(/_/g," ")+"`\n"+
                                                (element.tag_string_character !== "")?
                                                    "*Character:* `"+ element.tag_string_character.replace(/ /g,"\n")
                                                        .replace(/_/g," "):""
                                                +"`")+
                "&parse_mode=Markdown" +
                "&chat_id=" + chatID;
            console.log(url);
            await request(url);
//            await promise;
        } catch (error) {
            console.error(error);            
        }
    }
});