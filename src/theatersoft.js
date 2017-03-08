'use strict'
const
    {bus, executor, log, setTag} = require('@theatersoft/bus'),
    fs = require('fs'),
    root = (() => {
        try {
            fs.accessSync(`${process.env.HOME}/.config/theatersoft/config.json`);
            return true
        } catch (e) {return false}
    })(),
    read = n => {try {return fs.readFileSync(`${process.env.HOME}/.config/theatersoft/${n}`, 'utf8').trim()} catch (e) {}},
    auth = process.env.AUTH || read('.auth'),
    url = process.env.BUS || read('.bus'),
    parent = !root && url && {url, auth},
    {check} = require('./Session'),
    server = executor(),
    Config = require('./Config')

setTag('Theatersoft')
log({parent, children: {server: 'Promise', check}})

bus.start({parent, children: {server: server.promise, check}})
    .then(bus => {
        console.log(`bus name is ${bus.name}`)
    })

root && Config.loaded
    .then(() => {
        const
            web = require('./Web'),
            rpc = require('./Rpc'),
            imageProxy = require('./ImageProxy'),
            https = require('https'),
            express = require('express'),
            app = express(),
            port = process.env.PORT || 443

        web.init(express, app)
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

        console.log('Listening on port ' + port)
    })

Config.loaded
    .then(() => {
        const {host: {services = []}, config: {configs = {}}} = Config
        services.forEach(options => {
            if (options.enabled !== false) {
                console.log(`starting service ${options.name}`)
                Object.assign(options.config, configs[options.name])
                const service = require(options.module)[options.export]
                new service().start(options)
                    .then(
                        () => console.log(`started service ${options.name}`),
                        err => console.log(`failed to start service ${options.name} ${err}`)
                    )
            }
        })
    })