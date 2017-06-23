import {bus, proxy, log, error} from '@theatersoft/bus'
import Config, {THEATERSOFT_CONFIG_HOME} from './config'

const
    Nedb = require('nedb'),
    db = new Nedb({filename: `${THEATERSOFT_CONFIG_HOME}/session.db`, autoload: true}),
    cache = {},
    add = o => {
        log('db.insert', o)
        db.insert(o)
        db.count({}, (e, d) => {log('db.count', d)})
    },
    find = q => new Promise((resolve, reject) =>
        db.find(q, (err, docs) => err ? reject(err) : resolve(docs.length > 0))),
    uuid = () =>
        "00000000-0000-4000-8000-000000000000".replace(/0/g, () => (0 | Math.random() * 16).toString(16)),
    manager = bus.proxy('/Bus'),
    idOfReq = req => req.headers.cookie && req.headers.cookie.slice(0, 4) === 'sid=' && req.headers.cookie.slice(4)

export function check (id) {
    return !bus.root ? manager.check(id) :
        !id ? Promise.resolve(false) :
            cache[id] ? Promise.resolve(true) :
                find({id})
}

export function checkSession (req) {
    if (!Config.host.root)
        return Promise.resolve(true)
    return check(idOfReq(req))
        .then(res => (!res && error('failed session check', req.ip, req.headers['user-agent']), res))
}

export function createSession (name, ip, ua) {
    const id = uuid()
    cache[id] = true
    add({name, id, ip, ua, time: Date.now()})
    return id
}

export const rpc = {
    Login (args, res, req) {
        if (args.length == 1 && args[0] === Config.config.password) {
            const sid = createSession(undefined, req.ip, req.headers['user-agent'])
            //log(sid)
            res.cookie('sid', sid, {
                // avoid duplicate cookie browser issues; don't specify an explicit domain
                // http://stackoverflow.com/questions/10751813/cookies-with-and-without-the-domain-specified-browser-inconsistency
                secure: true,
                maxAge: 31536000000
            })
            return true
        }
        return false
    }
}

const push = new class {
    async start (webpush) {
        this.webpush = webpush
        log('starting Push', webpush)
        await bus.registerObject('Push', this)
    }

    register (id, subscription) {
        console.log('Push.register', id, subscription)
    }

    sendPush () {
    }
}

Config.loaded
    .then(() => push.start(Config.config.webpush))

