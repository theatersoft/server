import {log} from '@theatersoft/bus'
import config from './Config'
import session from './Session'

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

//        log.log(req.headers.cookie, target, method, args)

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
    },
    request = (host, target, method, args) => {
        log('request', host, target, method)
        return new Promise((resolve, reject) => {
            let
                data = JSON.stringify({method: target + '.' + method, args}),
                req = https.request({
                    hostname: config.Hosts[host].Ip,
                    port: 443,
                    path: '/theatersoft/rpc',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Content-Length': Buffer.byteLength(data),
                        'Accept': 'application/json'
                    },
                    rejectUnauthorized: false
                }, res => {
                    let result = ''
                    res.setEncoding('utf8')
//                    log('Rpc.request', res)
                    res.on('data', data => {
                        log('Rpc.request on ', data)
                        result += data
                    })
                    res.on('end', () => {
                        try {
                            result = JSON.parse(result)
                        } catch (_) {}
                        resolve(result && result.result)
                    })
                })
            req.on('error', e => {
                log(e)
                reject(e)
            })
            req.write(data)
            req.end()
        })
    }

export default {
    get (req, res) {invoke(req.query.host, req.query.method, req.query.args && JSON.parse(req.query.args), res, req)},
    post (req, res) {invoke(req.body.host, req.body.method, req.body.args, res, req)},
    request
    //TODO add target
}
