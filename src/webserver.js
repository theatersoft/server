var 
    fs = require('fs'),
    path = require('path'),
    https = require('https'),
    express = require('express'),
    app = express(),
    web = require('./Web'),
    home = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.theatersoft/',
    port = process.env.PORT || 443

web.init(express, app)

https.createServer({
        key: fs.readFileSync(home +  'server.key', 'utf8'),
        cert: fs.readFileSync(home + 'server.cer', 'utf8')
    }, app)
    .listen(port);

console.log('Listening on port ', port)
