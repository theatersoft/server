import {bus, executor, proxy, log} from '@theatersoft/bus'
import {THEATERSOFT_CONFIG_HOME} from './config'

const
    fs = require('fs'),
    file = `${THEATERSOFT_CONFIG_HOME}/settings.json`,
    read = () => JSON.parse(fs.readFileSync(file, 'utf8')),
    write = json => (fs.writeFileSync(file, JSON.stringify(json, null, '  '), 'utf-8'), json),
    started = executor()

let instance
bus.started().then(() => instance = bus.root ? new Settings() : proxy('Settings'))

export class Settings {
    constructor () {
        if (instance) throw new Error()
        bus.started()
            .then(() => {
                this.state = read()
                started.resolve()
                bus.registerObject('Settings', this)
                    .then(obj => this.obj = obj)
            })
    }

    static get started () {return started.promise}

    static instance () {return instance}

    getState () {return this.state}

    setState (state) {
        this.state = write(Object.assign({}, this.state, state))
        this.obj.signal('state', this.state)
    }
}
