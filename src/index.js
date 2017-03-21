import {bus, executor, log, error, setTag} from '@theatersoft/bus'
import Session from './Session'
import Config, {THEATERSOFT_CONFIG_HOME} from './Config'
import web from './Web'
import rpc from './Rpc'
import imageProxy from './ImageProxy'

const
    fs = require('fs'),
    read = n => {try {return fs.readFileSync(`${THEATERSOFT_CONFIG_HOME}/${n}`, 'utf8').trim()} catch (e) {}},
    port = process.env.PORT,
    auth = process.env.AUTH,
    url = process.env.BUS,
    parent = url && {url, auth},
    {check} = Session,
    server = executor(),
    children = port && {server: server.promise, check}

setTag('Theatersoft')
log({parent, children})

bus.start({parent, children})
    .then(bus => {
        log(`Bus name is ${bus.name}`)
    })

if (!port) log('Missing PORT (server not started)')
port && Config.loaded
    .then(() => {
        const
            https = require('https'),
            express = require('express'),
            app = express()

        web(express, app)
        app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', req.get('origin') || '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Accept-Language, Accept-Encoding');
            res.setHeader('Access-Control-Allow-Credentials', true);
            if ('OPTIONS' == req.method) res.send(200)
            else next()
        })
        app.set('json replacer', (key, value) => typeof value === 'function' ? '()' : value)
        app.use(express.cookieParser())
        app.get('/theatersoft/rpc', rpc.get)
        app.post('/theatersoft/rpc', (req, res, next) => {
            req.headers['content-type'] = 'application/json';
            next()
        }, express.json(), rpc.post)
        app.get('/theatersoft/image/:name', imageProxy.get)

        server.resolve(https.createServer({
            key: read('server.key'), cert: read('server.cer')
        }, app).listen(port))

        log('Listening on port ' + port)
    })

Config.loaded
    .then(() => {
        const {host: {services = []}, config: {configs = {}}} = Config
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