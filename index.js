'use strict';
const Danbooru = require('danbooru');
const request = require('request-promise-native');

const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;
const token = process.env.TG_TOKEN;
const chatID = "@tiddies2d";

async function getTiddies(){
    var tiddies = [];
    const booru = new Danbooru(login + ":" + password);
    var posts =[];
    var page = await booru.posts({ limit: 200, page: 0, tags: "solo breasts 1girl -loli score:>50" });
    posts.push(...page);
    page = await booru.posts({ limit: 200, page: 1, tags: "solo breasts 1girl -loli score:>50" });
    posts.push(...page);
    page = await booru.posts({ limit: 200, page: 2, tags: "solo breasts 1girl -loli score:>50" });
    posts.push(...page);
    for (let i = 0; i < 5; i++) {
        const index = Math.floor(Math.random() * posts.length);
        const post = posts[index];
        const url = booru.url(post.large_file_url);
        tiddies.push(url.href);
    }
    var artist = await booru.get('/artists/'+posts[0].tag_string_artist+'.json');
    console.log(artist);
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
            "/sendPhoto?photo=" + encodeURIComponent(element)+
            "&chat_id=" + chatID;
            console.log(url);
            await request(url);
//            await promise;
        } catch (error) {
            console.error(error);            
        }
    }
});