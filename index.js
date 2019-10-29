'use strict';
const Danbooru = require('danbooru');

const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;

const booru = new Danbooru(login + ":" + password);
const posts = await booru.posts({ tags: "solo areolae 1girl -loli" });
const index = Math.floor(Math.random() * posts.length);
const post = posts[index];
const url = booru.url(post.file_url);
console.log(url);