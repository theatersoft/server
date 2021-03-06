import {bus, proxy, log, error} from '@theatersoft/bus'
import {Config, THEATERSOFT_CONFIG_HOME} from './config'
import {Settings} from './settings'

const
    {promisify} = require('util'),
    Nedb = require('nedb'),
    webpush = require('web-push'),
    db = new Nedb({filename: `${THEATERSOFT_CONFIG_HOME}/session.db`, autoload: true}),
    cache = {},
    uuid = () => '00000000-0000-4000-8000-000000000000'.replace(/0/g, () => (0 | Math.random() * 16).toString(16)),
    manager = bus.proxy('/Bus'),
    idOfReq = req => req.headers.cookie && req.headers.cookie.split('; ').find(s=>s.startsWith('sid=')).slice(4)

db.ensureIndex({fieldName: 'id', unique: true})

db.countAsync = promisify(db.count)
db.findAsync = promisify(db.find)
db.findOneAsync = promisify(db.findOne)
db.updateAsync = promisify(db.update)

export class Session {
    async start ({webpush}) {
        this.vapidDetails = webpush
        log('starting Session', webpush)
        await bus.registerObject('Session', this)
    }

    registerSubscription (id, subscription) {
        return db.updateAsync({id}, {$set: {subscription}})
    }

    unregisterSubscription (id) {
        return db.updateAsync({id}, {$unset: {subscription: true}})
    }

    sendPush (message) {
        db.findAsync({subscription: {$exists: true}})
            .then(sessions =>
                sessions.forEach(({id, subscription}) => {
                    webpush.sendNotification(subscription, message, {vapidDetails: this.vapidDetails})
                        .catch(e => {
                            log('web-push failed', e, id, subscription)
                            if (e.statusCode === 410) this.unregisterSubscription(id)
                        })
                        .then(res => log(res))
                })
            )
    }

    createSession (name, ip, ua) {return (createSession(name, ip, ua))}

    getSessions () {return db.findAsync({})}
}

let session
Config.started.then(config => {
    if (bus.root) {
        session = new Session()
        session.start(config)
    } else
        session = bus.proxy('Session')
})

export function check (id) {
    return !bus.root ? manager.check(id) :
        !id ? Promise.resolve(false) :
            cache[id] ? Promise.resolve(true) :
                db.findOneAsync({id}).then(session => !!session)
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
    db.insert({name, id, ip, ua, time: Date.now()})
    db.countAsync({}).then(count => log('db.count', count))
    return id
}

export const rpc = {
    async Login (args, res, req) {
        const
            {pairing} = await Settings.instance.getState(),
            now = () => new Date().toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric'}).toLowerCase()
        if (pairing && args.length == 1 && args[0] === Config.config.password) {
            const sid = await session.createSession(undefined, req.ip, req.headers['user-agent'])
            //log(sid)
            res.cookie('sid', sid, {
                // avoid duplicate cookie browser issues; don't specify an explicit domain
                // http://stackoverflow.com/questions/10751813/cookies-with-and-without-the-domain-specified-browser-inconsistency
                secure: true,
                maxAge: 31536000000
            })
            session.sendPush(JSON.stringify({
                body: `New client paired at ${now()}`,
                icon: '/res/theatersoft-logo-round-accent.png'
            }))
            return true
        }
        const body = `Failed client pairing at ${now()} (${pairing ? 'passcode incorrect' : 'pairing disabled'})`
        log(body)
        session.sendPush(JSON.stringify({
            body,
            icon: '/res/theatersoft-logo-round-accent.png'
        }))
        return false
    }
}
