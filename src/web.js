import {log} from '@theatersoft/bus'
import fs from 'fs'
import path from 'path'
import {checkSession} from './session'

export default function web (express, app) {
    const
        client = path.dirname(require.resolve('@theatersoft/client')),
        root = p =>path.join(client, p),
        DEV = process.env.NODE_ENV === 'development'
    log('Client', client)
    if (!DEV) {
        app.all(/dev/, (req, res, next) => {
            checkSession(req).then(found => {
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
