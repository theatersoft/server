import {bus, log, error} from '@theatersoft/bus'
import Config, {THEATERSOFT_CONFIG_HOME} from './Config'

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
    createSession = req => {
        var id = uuid()//.substr(0, 8)
        cache[id] = true
        add({
            id: id,
            time: Date.now(),
            ip: req.ip,
            ua: req.headers['user-agent']
        })
        return id
    }

export default {
    checkSession (req) {
        if (!Config.host.root)
            return Promise.resolve(true)

        const id = req.headers.cookie && req.headers.cookie.slice(0, 4) === 'sid=' && req.headers.cookie.slice(4),
            report = b => {
                if (!b)
                    error('failed session check', req.ip, req.headers['user-agent'])
                return b
            }
        return this.check(id).then(res => report(res))
    },

    check (id) {
        //log('bus.root', bus.root)
        return !id ? Promise.resolve(false) :
            id && cache[id] ? Promise.resolve(true) :
                find({id})
    },

    rpc: {
        Login (args, res, req) {
            if (args.length == 1 && args[0] === Config.config.password) {
                const sid = createSession(req)
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
}
