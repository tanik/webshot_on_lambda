'use strict';
const path = require('path')
const fs = require('fs')
const aws = require("aws-sdk")
const sharp = require('sharp')

const phantom = path.join(__dirname, "node_modules/phantomjs-prebuilt/bin/phantomjs")
const exec = require("child_process").exec;

exports.handler = (event, context, callback) => {
  exec("rm -rf /tmp/fontconfig; cp -r fontconfig /tmp/.; /tmp/fontconfig/usr/bin/fc-cache -fs", (error, stdout, stderr) => {
    if(error){
      console.error(`font setting error: ${error}, stdout: ${stdout}, stderr: ${stderr}`)
    }
    const fontPath = '/tmp/fontconfig/usr/lib/';
    const scriptPath = path.join(__dirname, "webshot.js");
    console.log(`LD_LIBRARY_PATH=${fontPath}  ${phantom} ${scriptPath} ${event.url}`)
    exec(`LD_LIBRARY_PATH=${fontPath}  ${phantom} ${scriptPath} ${event.url}`, (error, stdout, stderr) => {
      if (error) {
        const resp = {state: "failure", message: `phantom exec error: ${error}, stdout: ${stdout}, stderr: ${stderr}`}
        callback(error, resp)
        return
      }
      const title = fs.readFileSync('/tmp/title.txt', 'utf-8')
      const image_path = '/tmp/full.png';
      const params = {
        Bucket: event.bucket,
        Key: `websites/images/${event.id}.png`,
        Body: fs.createReadStream(image_path),
        ContentType: "image/png",
        CacheControl: "max-age=86400",
        ACL: "public-read",
      }
      new aws.S3().upload(params, (error, data) => {
        if (error) {
          const resp = {state: "failure", message: `image upload error: ${error}`}
          callback(error, resp);
          return
        }
        const thumb_path = '/tmp/thumb.png';
        const resized_path = '/tmp/thumb_resized.png';
        sharp.cache(false)
        sharp(thumb_path)
          .resize(200, 200)
          .max()
          .toFile(resized_path, (error) => {
            if (error) {
              const resp = {state: "failure", message: `resize error: ${error}`}
              callback(error, resp);
              return
            }
            const params = {
              Bucket: event.bucket,
              Key: `websites/thumbnails/${event.id}.png`,
              Body: fs.createReadStream(resized_path),
              ContentType: "image/png",
              CacheControl: "max-age=86400",
              ACL: "public-read",
            }
            new aws.S3().upload(params, (error, data) => {
              if (error) {
                const resp = {state: "failure", message: `thumbnail upload error: ${error}`}
                callback(error, resp);
              }else{
                const resp = {
                  state: "success",
                  title: title,
                  image: `websites/images/${event.id}.png`,
                  thumbnail: `websites/thumbnails/${event.id}.png`,
                }
                callback(error, resp)
              }
            });
          })
      });
    });
  });
};
