import session from './Session'
import {log} from '@theatersoft/bus'

const
    fs = require('fs'),
    path = require('path'),
    client = path.dirname(require.resolve('@theatersoft/client')),
    root = p =>path.join(client, p),
    DEV = process.env.NODE_ENV === 'development'

log('client', client)

export default function web (express, app) {
    if (!DEV) {
        app.all(/dev/, (req, res, next) => {
            session.checkSession(req).then(found => {
                if (!found) return res.send(401)
                next()
            })
        })
    }
    app.get('/', (req, res) => {
        log('get /')
        res.sendfile(root('index.html'))
    })
    app.use('/', express.static(root('')))
}
