import {bus, debug} from '@theatersoft/bus'
import {LocalServiceManager} from  '../localServiceManager'

export {LocalServiceManager}

export function startLocalService (options) {
    bus.start().then(() => {
        const
            {name} = options,
            lsm = new LocalServiceManager(name, {[name]: {options}})
        process
            .on('SIGINT', () => process.exit())
            .on('exit', () => lsm.stopService(name))
    })
}