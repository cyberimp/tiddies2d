'use strict';
let Danbooru;
Danbooru = require('danbooru');

const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;

async function getTiddies(){
    let tiddies = [];
    const booru = new Danbooru(login + ":" + password);
    let posts =[];
    for (let i = 0; i < 6; i++) {
        const page = await booru.posts({ limit: 200, page: i, tags: "solo breasts 1girl -loli score:>50" });
        posts.push(...page);
    }
    console.log("array length:",posts.length);
    console.log("first post format:", posts[0]);
    for (let i = 0; i < 5; i++) {
        const index = Math.floor(Math.random() * posts.length);
        const post = posts[index];
        const url = booru.url(post.large_file_url);
        tiddies.push(url.href);
    }
    return tiddies;
}
getTiddies().then(async (tiddies) => {
  console.log(tiddies)
});
