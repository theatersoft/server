import {bus, executor, proxy, log} from '@theatersoft/bus'
import {THEATERSOFT_CONFIG_HOME} from './config'

const
    fs = require('fs'),
    read = () => JSON.parse(fs.readFileSync(`${THEATERSOFT_CONFIG_HOME}/settings.json`, 'utf8')),
    started = executor()

let _settings

bus.started()
    .then(() => {
        (bus.root ? Promise.resolve(read()) : proxy('Settings').get())
            .then(settings_ => {
                _settings = settings_
                log('Settings', _settings)
                started.resolve(_settings)
                bus.root && bus.registerObject('Settings', new Settings())
            })
    })

export class Settings {
    static get started () {
        return started.promise
    }

    static get () {return _settings}

    get () {
        log('bus Settings.get')
        return _settings
    }
}
