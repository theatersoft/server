import {bus, executor, proxy, log} from '@theatersoft/bus'
import {THEATERSOFT_CONFIG_HOME} from './config'

const
    fs = require('fs'),
    file = `${THEATERSOFT_CONFIG_HOME}/settings.json`,
    read = () => JSON.parse(fs.readFileSync(file, 'utf8')),
    write = json => (fs.writeFileSync(file, JSON.stringify(json, null, '  '), 'utf-8'), json)

export class Settings {
    constructor () {
        this.started = executor()
        bus.started()
            .then(() => {
                (bus.root ? Promise.resolve(read()) : proxy('Settings').getState())
                    .then(state => {
                        this.state = state
                        this.started.resolve(state)
                        if (bus.root) bus.registerObject('Settings', this)
                            .then(obj => this.obj = obj)
                    })
            })
    }

    static get started () {return this.started.promise}

    static get () {return this.state}

    getState () {return this.state}

    setState (state) {
        this.state = write(Object.assign({}, this.state, state))
        this.obj.signal('state', this.state)
    }
}

new Settings()