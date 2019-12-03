"use strict";
/**
 * Tiddies seek and destroy^W post automata
 * @module ./tiddies
 */

let Danbooru;
Danbooru = require("danbooru");
const fs = require("fs");
const request = require("request-promise-native");
const querystring = require("querystring");
const { Client } = require("pg");

const login = process.env.BOORU_LOGIN;
const password = process.env.BOORU_KEY;
const token = process.env.TG_TOKEN;

/**
 * Danbooru post
 * @name post
 * @property {number} id
 * @property {URL} large_file_url
 * @property {string} tag_string_artist
 * @property {string} tag_string_copyright
 * @property {string} tag_string_character
 */

/**
 * checking if array already contains post
 * @param obj {post} - object to check by id
 * @param list {post[]} - array of objects
 * @returns {boolean}
 */
function containsObject (obj, list) {
    let result = false;
    list.forEach((elem) => {
        if (elem.id === obj.id) {
            result = true;
        }
    });
    return result;
}

/**
 * Check for extension of filename/url
 * @param str {string} - filename
 * @returns {boolean}
 */
function badExtension(str){
    const good = ["gif", "jpg", "jpeg", "png", "mp4"];
    const ext = str.split(".").pop();
    return (!good.includes(ext));
}

/**
 * Send text message to chat
 * @param {string} text - text to send
 * @param {number|string} chatID - id of chat
 */
function sendText(text, chatID){
    const paramsObj = {};
    paramsObj.chat_id = chatID;
    paramsObj.text = text;
    const params = querystring.stringify(paramsObj);
    const url = "https://api.telegram.org/bot" + token +
		"/sendMessage?" + params;
    request(url);
}

/**
 * Tries to merge two arrays
 * @param arr1{post[]} - array to merge into
 * @param arr2{post[]|*} - array to merge into or error object
 */
function mergeArrays(arr1, arr2){
    if (Array.isArray(arr2)) {
        arr1.push(...arr2);
    } else {
        console.log(arr2.message);
    }
}

/**
 * clears underscore and spaces in string
 * @param {string} str
 * @returns {string}
 */
function clearUnderscore (str) {
    return str.replace(/ /g, "\n").replace(/_/g, " ");
}

/**
 * Function that returns array of posts
 * @param num {number} - size of array
 * @param chatID {string|number} - chat to send await message
 * @param [antibayan=true] {boolean} - use antibayan table for post querying
 * @param [cache=false] {boolean} - use/save cache
 * @returns {Promise<post[]>} array of posts with tiddies
 */
async function getTiddies (num, chatID, antibayan = true, cache = false) {
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
            sendText("Я сплююю, ня~ Можно ещё минуточку поспать, можно, можно, можно?", chatID);
            fail = true;
        }
    if (!cache||fail) {
        for (let j = 0; j < MAX; j++) {
            const promises = [];

            for (let i = j * 15; i < (j + 1) * 15; i++) {
                promises.push(
                    booru.posts({limit: 100, page: i, tags: "solo breasts 1girl -loli score:>50"})
                        .then(
                            result => mergeArrays(posts, result),
                            error => {
                                if ("message" in error)
                                    console.error(error.message);
                            }
                        )
                );
            }
            promises.push(new Promise(resolve => setTimeout(resolve, 10)));

            await Promise.all(promises);
        }
        if (cache){
            try {
                fs.writeFile("cache.dat", JSON.stringify(posts),{mode: 0o222, flag: "wx"}, () =>{
                    fs.chmod("cache.dat",0o666, (err) => {
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

/**
 * Add post to database
 * @param {post} post
 */
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
 * post tiddies to chat
 * @param {post} post - Danbooru post
 * @param {string|number} chatID - chat to post into
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

/**
 * Main job of module of selecting tiddies from db and post them to chat
 * @param num {number} - number of tiddies
 * @param chatID {string|number} - chat to post to
 * @param [antibayan=true] {boolean} - use antibayan database
 * @param [cache=false] {boolean} - use hdd cache
 */
function doJob(num, chatID, antibayan= true, cache = false){
    getTiddies(num, chatID, antibayan, cache).then((pairs) =>
        pairs.forEach(post => postTiddies(post, chatID, antibayan)));
}

module.exports = doJob;
