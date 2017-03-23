import {log} from '@theatersoft/bus'
import config from './config'
import session from './session'

const
    https = require('https'),
    targets = Object.assign({
            Session: session.rpc,
            Rpc: {
                get () {
                    log('Rpc.get')
                    return targets
                }
            }
        }
        //require('./ChildProcess')
    ),
    invoke = (host, method, args, res, req) => {
        let s = method && method.split('.'),
            target
        if (s.length === 2) {
            target = s[0]
            method = s[1]
        } else if (s.length === 3) {
            host = s[0]
            target = s[1]
            method = s[2]
        } else
            return res.send({error: 'method error'})

//        log(req.headers.cookie, target, method, args)

        if (target === 'Session' && method === 'Login')
            return res.send({result: session.rpc.Login(args, res, req)})

        session.checkSession(req).then(found => {
            if (!found)
                return res.send(401)

            let p
            if (host && host !== config.hostname)
                p = request(host, target, method, args)
            else {
                if (!targets[target])
                    return res.send({error: 'target not found'})
                else if (!targets[target][method])
                    return res.send({error: 'method not found'})
                p = targets[target][method](args, res)
            }

            if (p && p.then) {
                p.then(result => res.send({result}), error => res.send({error}))
            } else {
                res.send({result: p})
            }
        })
    }

export default {
    get (req, res) {invoke(req.query.host, req.query.method, req.query.args && JSON.parse(req.query.args), res, req)},
    post (req, res) {invoke(req.body.host, req.body.method, req.body.args, res, req)}
}
