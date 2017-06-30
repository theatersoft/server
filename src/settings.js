import {bus, executor, proxy, log} from '@theatersoft/bus'
import {THEATERSOFT_CONFIG_HOME} from './config'

const
    fs = require('fs'),
    file = `${THEATERSOFT_CONFIG_HOME}/settings.json`,
    read = () => JSON.parse(fs.readFileSync(file, 'utf8')),
    write = json => fs.writeFileSync(file, JSON.stringify(json, null, '  '), 'utf-8'),
    started = executor()

let state, obj

bus.started()
    .then(() => {
        (bus.root ? Promise.resolve(read()) : proxy('Settings').get())
            .then(settings_ => {
                state = settings_
                log('Settings', state)
                started.resolve(state)
                if (bus.root) obj = bus.registerObject('Settings', new Settings())
            })
    })

export class Settings {
    static get started () {
        return started.promise
    }

    static get () {return state}

    getState () {
        log('bus Settings.get')
        return state
    }

    setState (state_) {
        const t = Object.assign({}, state, state_)
        write(t)
        state = t
        obj.signal('state', state)
    }
}
