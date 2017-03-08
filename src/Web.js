'use strict'
const
    fs = require('fs'),
    path = require('path'),
    DEV = process.env.NODE_ENV === 'development',
    session = require('./Session'),
    client = path.join(process.cwd(), '../client'),
    root = p =>path.join(client, p)

console.log('client', client)

exports.init = (express, app) => {
    if (!DEV) {
        app.all(/dev/, (req, res, next) => {
            session.checkSession(req).then(found => {
                if (!found) return res.send(401)
                next()
            })
        })
    }
    app.get('/', (req, res) => {
        console.log('get /')
        res.sendfile(root('index.html'))
    })
    app.use('/', express.static(root('')))
}
