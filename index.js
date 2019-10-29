'use strict';
const Danbooru = require('danbooru');
const request = require('request-promise-native');

const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;
const token = process.env.TG_TOKEN;
const chatID = process.env.TG_CHAT;

async function getTiddies(){
    var tiddies = [];
    const booru = new Danbooru(login + ":" + password);
    const posts = await booru.posts({ tags: "solo areolae 1girl -loli" });
    for (let i = 0; i < 5; i++) {
        const index = Math.floor(Math.random() * posts.length);
        const post = posts[index];
        const url = booru.url(post.file_url);
        tiddies.push(url.href);
    }
    return tiddies;
}
getTiddies().then(async (tiddies) => {
    for (let i = 0; i < tiddies.length; i++) {
        const element = tiddies[i];
        await request("https://api.telegram.org/bot"+ token +
        "/sendPhoto?chat_id='" + chatID +
        "'&photo=" + encodeURIComponent(element));
    }
});