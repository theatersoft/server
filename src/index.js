import {bus, executor, log, error, setTag, setTime} from '@theatersoft/bus'
import {check} from './session'
import {Config, THEATERSOFT_CONFIG_HOME} from './config'
import web from './web'
import rpc from './rpc'
import imageProxy from './imageProxy'
import {createServer} from './letsencrypt'
import './settings'
import {LocalServiceManager} from './lib'
import {ServiceManager} from './serviceManager'

const
    fs = require('fs'),
    read = n => {try {return fs.readFileSync(`${THEATERSOFT_CONFIG_HOME}/${n}`, 'utf8').trim()} catch (e) {}},
    port = Number(process.env.PORT),
    auth = process.env.AUTH,
    url = process.env.BUS,
    parent = url && {url, auth},
    server = executor(),
    children = port && {server: server.promise, check}

export function start ({time = false}) {
    setTag('Theatersoft')
    setTime(time)
    log({parent, children})

    bus.start({parent, children})
        .then(bus => {
            log(`Bus name is ${bus.name}`)
        })

    if (!port) log('Web server not started (PORT not set)')
    port && Config.started
        .then(config => {
            const
                https = require('https'),
                express = require('express'),
                cookieParser = require('cookie-parser'),
                app = express()
            try {
                web(express, app)
                app.set('json replacer', (key, value) => typeof value === 'function' ? '()' : value)
                app.use(cookieParser())
                app.get('/theatersoft/rpc', rpc.get)
                app.post('/theatersoft/rpc', (req, res, next) => {
                    req.headers['content-type'] = 'application/json';
                    next()
                }, express.json(), rpc.post)
                app.get('/theatersoft/image/:name', imageProxy.get)

                const letsencrypt = {port, ...config.letsencrypt}
                if (port && config.letsencrypt && port === letsencrypt.port)
                    server.resolve(createServer({app, port, ...letsencrypt}))
                else
                    server.resolve(https.createServer({key: read('server.key'), cert: read('server.cer')}, app).listen(port))
                log('Listening on port ' + port)
            }
            catch (e) {
                error('Failed to start web server', e)
            }
        })
}

Config.started
    .then(config => {
        if (bus.root) new ServiceManager()
        if (Config.host.services) new LocalServiceManager(
            Config.hostname,
            Config.host.services
                .reduce((o, service) => (o[service.name] = {...service, config: {...service.config, ...config.configs[service.name]}
                }, o), {})
        )
    })

export {createSession} from './session'
