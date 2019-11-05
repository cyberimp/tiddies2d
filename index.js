'use strict';
let Danbooru;
Danbooru = require('danbooru');
const request = require('request-promise-native');
const querystring = require('querystring');
const {Client} = require('pg');


const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;
const token = process.env.TG_TOKEN;
const chatID = "@tiddies2d";

function containsObject(obj, list) {
    for (let i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

async function getTiddies() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    let tiddies = [];
    const booru = new Danbooru(login + ":" + password);

    client.connect();

    let posts = [];
    for (let j = 0; j < 2; j++) {
        let promises = [];

        for (let i = j * 20; i < (j + 1) * 20; i++) {
            promises.push(booru.posts({limit: 200, page: i, tags: "solo breasts 1girl -loli score:>50"})
                .then(result => {
                    if (Array.isArray(result))
                        posts.push(...result);
                }).catch(error => {
                    console.error(error);
                }));
        }

        for (let i = 0; i < promises.length; i++) {
            await promises[i];
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
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
            } while (res.rows.length > 0 || containsObject(post,tiddies));
//        const url = booru.url(post.large_file_url);
            tiddies.push(post);
        }
    } catch (error) {
        console.error(error);
    } finally {
        client.end();
    }
    return tiddies;
}

function clearUnderscore(str) {
    return str.replace(/ /g, "\n").replace(/_/g, " ")
}

async function addTiddies(post) {
    const postID = post.id;
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    client.connect();
    let query = "INSERT INTO antibayan(id,posted_at) VALUES($1,NOW());";
    client.query(query, [postID]).then(result => {
        console.log(result);
    }, err => {
        console.error(err)
    }).finally(() => {
        client.end();
    });
    return Promise.resolve();
}

async function postTiddies(post) {
    const postUrl = post.large_file_url;
    const postArtist = post.tag_string_artist;
    const postCopyright = post.tag_string_copyright;
    const postCharacter = post.tag_string_character;
    const extension = postUrl.split(".").pop();
    let command = "Photo";
    if (extension === "mp4" || extension === "gif")
        command = "Video";

    let paramsObj = {};
    paramsObj[command.toLowerCase()] = postUrl;
    paramsObj.caption = "*Artist:* `" + clearUnderscore(postArtist) + "`\n" +
        "*Origin:* `" + clearUnderscore(postCopyright) + "`" +
        ((postCharacter !== "") ?
            "\n*Character:* `" + clearUnderscore(postCharacter) + "`"
            : "");
    paramsObj.parse_mode = "Markdown";
    paramsObj.chat_id = chatID;
    let params = querystring.stringify(paramsObj);
    const url = "https://api.telegram.org/bot" + token +
        "/send" + command + "?" + params;
    console.log(url);
    return request(url).then(res => {
        let parsed = JSON.parse(res);
        if (parsed.ok === true) {
            addTiddies(post);
        }
        else {
            console.error("not added!");
            console.log(res);
        }
    });
}

getTiddies().then(async (tiddies) => {
    for (let i = 0; i < tiddies.length; i++) {
        const element = tiddies[i];
        try {
            postTiddies(element).then(res => {
                console.log(res)
            }, err => {
                console.error(err)
            });
        } catch (error) {
            console.error(error);
        }
    }
});