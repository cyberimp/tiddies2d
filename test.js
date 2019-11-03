'use strict';
let Danbooru;
Danbooru = require('danbooru');

const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;

async function getTiddies(){
    let tiddies = [];
    const booru = new Danbooru(login + ":" + password);
    let posts = [];
    let promices = [];

    for (let i = 0; i < 20; i++) {
        promices.push(booru.posts({ limit: 200, page: i, tags: "solo breasts 1girl -loli score:>50" })
            .then(result => {posts.push(...result)}).catch(error => {console.error(error)}));
    }

    for (let i=0; i<promices.length; i++){
        await promices[i];
    }
    console.log("kto prochel");

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("tot loh!");
    promices = [];
    for (let i = 20; i < 40; i++) {
        promices.push(booru.posts({ limit: 200, page: i, tags: "solo breasts 1girl -loli score:>50" })
            .then(result => {posts.push(...result)}).catch(error => {console.error(error)}));
    }

    for (let i=0; i<promices.length; i++){
        await promices[i];
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
