import {bus, proxy, log, error} from '@theatersoft/bus'
import {config, THEATERSOFT_CONFIG_HOME} from './config'

const
    {promisify} = require('util'),
    Nedb = require('nedb'),
    webpush = require('web-push'),
    db = new Nedb({filename: `${THEATERSOFT_CONFIG_HOME}/session.db`, autoload: true}),
    cache = {},
    uuid = () => '00000000-0000-4000-8000-000000000000'.replace(/0/g, () => (0 | Math.random() * 16).toString(16)),
    manager = bus.proxy('/Bus'),
    idOfReq = req => req.headers.cookie && req.headers.cookie.slice(0, 4) === 'sid=' && req.headers.cookie.slice(4)

db.ensureIndex({fieldName: 'id', unique: true})

db.countAsync = promisify(db.count)
db.findAsync = promisify(db.find)
db.findOneAsync = promisify(db.findOne)
db.updateAsync = promisify(db.update)

export function check (id) {
    return !bus.root ? manager.check(id) :
        !id ? Promise.resolve(false) :
            cache[id] ? Promise.resolve(true) :
                db.findOneAsync({id}).then(session => !!session)
}

export function checkSession (req) {
    if (!config.host.root)
        return Promise.resolve(true)
    return check(idOfReq(req))
        .then(res => (!res && error('failed session check', req.ip, req.headers['user-agent']), res))
}

export function createSession (name, ip, ua) {
    const id = uuid()
    cache[id] = true
    db.insert({name, id, ip, ua, time: Date.now()})
    db.countAsync({}).then(count => log('db.count', count))
    return id
}

export const rpc = {
    Login (args, res, req) {
        if (args.length == 1 && args[0] === config.config.password) {
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
    async start (vapidDetails) {
        this.vapidDetails = vapidDetails
        log('starting Push', vapidDetails)
        await bus.registerObject('Push', this)
    }

    register (id, subscription) {
        log('Push.register', id, subscription)
        return db.updateAsync({id}, {$set: subscription})
    }

    unregister(subscription) {
        
    }

    sendPush (message) {
        db.findAsync({endpoint: {$exists: true}})
            .then(subs =>
                subs.forEach(sub => {
                    webpush.sendNotification(sub, message, {vapidDetails: this.vapidDetails})
                        .catch(e => (log('web-push failed', sub), e))
                        .then(res => log(res))
                })
            )
    }
}

config.started
    .then(() => push.start(config.config.webpush))

