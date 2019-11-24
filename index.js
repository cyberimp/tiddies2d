"use strict";
let Danbooru;
Danbooru = require("danbooru");
const request = require("request-promise-native");
const querystring = require("querystring");
const { Client } = require("pg");

const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;
const token = process.env.TG_TOKEN;
const chatID =  "@"+process.env.TG_CHAT;

function containsObject (obj, list) {
    let result = false;
    list.forEach((elem) => {
        if (elem === obj) {
            result = true;
        }
    });
    return result;
}

async function getTiddies () {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });
    const tiddies = [];
    const booru = new Danbooru(login + ":" + password);

    client.connect();

    const posts = [];
    const MAX = 2;
    for (let j = 0; j < MAX; j++) {
        const promises = [];

        for (let i = j * 20; i < (j + 1) * 20; i++) {
            promises.push(
                booru.posts({ limit: 200, page: i, tags: "solo breasts 1girl -loli score:>50" })
                    .then(
                        result => {
                            if (Array.isArray(result)) {
                                posts.push(...result);
                            }
                        },
                        error => console.error(error)
                    )
            );
        }
        //we need to wait at least 1 sec between API calls
        promises.push(new Promise(resolve => setTimeout(resolve, 1000)));

        await Promise.all(promises);
    }

    for (let i = 0; i < 2; i++) {
        let post;
        let res;
        do {
            const index = Math.floor(Math.random() * posts.length);
            post = posts[index];
            const query = "SELECT id FROM antibayan WHERE id = $1;";
            res = await client.query(query, [post.id]);
        } while (res.rows.length > 0 || containsObject(post, tiddies));
        tiddies.push(post);
    }
    client.end();
    return tiddies;
}

function clearUnderscore (str) {
    return str.replace(/ /g, "\n").replace(/_/g, " ");
}

function addTiddies (post) {
    const postID = post.id;
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });
    client.connect();
    const query = "INSERT INTO antibayan(id,posted_at) VALUES($1,NOW());";
    /** @namespace result.rowCount **/
    client.query(query, [postID]).then(
        result => console.log("added rows: " + result.rowCount),
        err => console.error(err)
    ).finally(() => client.end());
}

/**
 * @param {{large_file_url:string},
 *          {tag_string_artist:string},
 *          {tag_string_copyright:string},
 *          {tag_string_character:string}} post
 */
function postTiddies (post) {
    const postUrl = post.large_file_url;
    const postArtist = clearUnderscore(post.tag_string_artist);
    const postCopyright = clearUnderscore(post.tag_string_copyright);
    const postCharacter = clearUnderscore(post.tag_string_character);
    const extension = postUrl.split(".").pop();
    let command = "Photo";
    if (extension === "mp4" || extension === "gif") { command = "Video"; }

    const paramsObj = {};
    paramsObj[command.toLowerCase()] = postUrl;
    paramsObj.caption = "*Artist:* `" + postArtist + "`\n" +
		"*Origin:* `" + postCopyright + "`" +
		((postCharacter !== "") ? "\n*Character:* `" + postCharacter + "`" : "");
    paramsObj.parse_mode = "Markdown";
    paramsObj.chat_id = chatID;
    const params = querystring.stringify(paramsObj);
    const url = "https://api.telegram.org/bot" + token +
		"/send" + command + "?" + params;
    console.log(url.replace(token,"API_TOKEN"));
    request(url).then(res => {
        const parsed = JSON.parse(res);
        if (parsed.ok) {
            addTiddies(post);
        } else {
            console.error("not added!");
            console.log(res);
        }
    }).catch((err) => console.error(err));
}

getTiddies().then((tiddies) =>
    tiddies.forEach(postTiddies));
