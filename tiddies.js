"use strict";
let Danbooru;
Danbooru = require("danbooru");
const fs = require("fs");
const request = require("request-promise-native");
const querystring = require("querystring");
const { Client } = require("pg");

const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;
const token = process.env.TG_TOKEN;

function containsObject (obj, list) {
    let result = false;
    list.forEach((elem) => {
        if (elem.id === obj.id) {
            result = true;
        }
    });
    return result;
}

function badExtension(str){
    const good = ["gif", "jpg", "jpeg", "png", "mp4"];
    const ext = str.split(".").pop();
    return (!good.includes(ext));
}

async function getTiddies (num, chatID = "", antibayan = true, cache = false) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });
    const tiddies = [];
    const booru = new Danbooru(login + ":" + password);

    if (antibayan)
        client.connect();

    let posts = [];
    const MAX = 3;
    let fail = false;

    if (cache)
        try {
            const content = fs.readFileSync("cache.dat",{flag: "r", encoding: "utf8"});
            posts = JSON.parse(content);
        }
        catch(err){
            const paramsObj = {};
            paramsObj.chat_id = chatID;
            paramsObj.text = "Я сплююю, ня~ Можно ещё минуточку поспать, можно, можно, можно?";
            const params = querystring.stringify(paramsObj);
            const url = "https://api.telegram.org/bot" + token +
				"/sendMessage?" + params;
            request(url);
            fail = true;
        }
    if (!cache||fail) {
        for (let j = 0; j < MAX; j++) {
            const promises = [];

            for (let i = j * 15; i < (j + 1) * 15; i++) {
                promises.push(
                    booru.posts({limit: 100, page: i, tags: "solo breasts 1girl -loli score:>50"})
                        .then(
                            result => {
                                if (Array.isArray(result)) {
                                    posts.push(...result);
                                } else {
                                    console.log(result.message);
                                }
                            },
                            error => {
                                if ("message" in error)
                                    console.error(error.message);
                            }
                        )
                );
            }
            //we need to wait at least 1 sec between API calls
            promises.push(new Promise(resolve => setTimeout(resolve, 10)));

            await Promise.all(promises);
        }
        if (cache){
            try {
                fs.writeFile("cache.dat", JSON.stringify(posts),{mode: 0o222, flag: "wx"}, () =>{
                    fs.chmod("cache.dat",0o555, (err) => {
                        if (err)
                            console.error(err);
                    });
                });
            }
            catch(err){
                console.error(err);
            }
        }
    }

    console.log(`found ${posts.length} pairs!`);

    for (let i = 0; i < num; i++) {
        let post = {large_file_url: ""};
        let res;
        do {
            const index = Math.floor(Math.random() * posts.length);
            post = posts[index];
            if (antibayan) {
                const query = "SELECT id FROM antibayan WHERE id = $1;";
                res = await client.query(query, [post.id]);
            }
            else {
                res = {rows: []};
            }
        } while (res.rows.length > 0 || containsObject(post, tiddies) || badExtension(post.large_file_url));
        tiddies.push(post);
    }
    if (antibayan)
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
 *          {tag_string_character:string}} post - Danbooru post
 * @param {string} chatID - chat to post into
 * @param {boolean} [add=true] - add to database
 */
function postTiddies (post, chatID, add = true) {
    const postUrl = post.large_file_url;
    const postArtist = clearUnderscore(post.tag_string_artist);
    const postCopyright = clearUnderscore(post.tag_string_copyright);
    const postCharacter = clearUnderscore(post.tag_string_character);
    const extension = postUrl.split(".").pop();
    let command = "Photo";
    if (extension === "mp4" || extension === "gif") { command = "Video"; }

    const paramsObj = {};
    paramsObj[command.toLowerCase()] = postUrl;
    paramsObj.caption = `*Artist:* \`${postArtist}\`` +
		`\n*Origin:* \`${postCopyright}\`` +
		((postCharacter !== "") ? `\n*Character:* \`${postCharacter}\`` : "");
    paramsObj.parse_mode = "Markdown";
    paramsObj.chat_id = chatID;
    const params = querystring.stringify(paramsObj);
    const url = "https://api.telegram.org/bot" + token +
		"/send" + command + "?" + params;
    console.log(url.replace(token,"API_TOKEN"));
    request(url).then(res => {
        const parsed = JSON.parse(res.toString());
        if (parsed.ok){
            if (add)
                addTiddies(post);
        } else {
            console.error("not added!");
            console.log(res);
        }
    }).catch((err) => console.error(err));
}

function doJob(num, chatID, antibayan= true, cache = false){
    getTiddies(num, chatID, antibayan, cache).then((pairs) =>
        pairs.forEach(post => postTiddies(post, chatID, antibayan)));
}

module.exports = doJob;
