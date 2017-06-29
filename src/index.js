import {bus, executor, log, error, setTag} from '@theatersoft/bus'
import {check} from './session'
import {config, THEATERSOFT_CONFIG_HOME} from './config'
import web from './web'
import rpc from './rpc'
import imageProxy from './imageProxy'
import {createServer} from './letsencrypt'

const
    fs = require('fs'),
    read = n => {try {return fs.readFileSync(`${THEATERSOFT_CONFIG_HOME}/${n}`, 'utf8').trim()} catch (e) {}},
    port = Number(process.env.PORT),
    auth = process.env.AUTH,
    url = process.env.BUS,
    parent = url && {url, auth},
    server = executor(),
    children = port && {server: server.promise, check}

export function start () {
    setTag('Theatersoft')
    log({parent, children})

    bus.start({parent, children})
        .then(bus => {
            log(`Bus name is ${bus.name}`)
        })

    if (!port) log('Missing PORT (server not started)')
    port && config.started
        .then(() => {
            const
                https = require('https'),
                express = require('express'),
                app = express()
            web(express, app)
            app.set('json replacer', (key, value) => typeof value === 'function' ? '()' : value)
            app.use(express.cookieParser())
            app.get('/theatersoft/rpc', rpc.get)
            app.post('/theatersoft/rpc', (req, res, next) => {
                req.headers['content-type'] = 'application/json';
                next()
            }, express.json(), rpc.post)
            app.get('/theatersoft/image/:name', imageProxy.get)

            const {letsencrypt} = config.config
            if (port === 443 && letsencrypt)
                server.resolve(createServer({app, ...letsencrypt}))
            else
                server.resolve(https.createServer({key: read('server.key'), cert: read('server.cer')}, app).listen(port))
            log('Listening on port ' + port)
        })

    config.started
        .then(() => {
            const {host: {services = []}, config: {configs = {}}} = config
            services.forEach(options => {
                if (options.enabled !== false) {
                    log(`Starting service ${options.name}`)
                    Object.assign(options.config, configs[options.name])
                    const service = require(options.module)[options.export]
                    new service().start(options)
                        .then(
                            () => log(`Started service ${options.name}`),
                            err => error(`Failed to start service ${options.name} ${err}`)
                        )
                }
            })
        })
}

export {createSession} from './session'
