import {LocalServiceManager} from  '../localServiceManager'
export {LocalServiceManager}

import {bus, setTime, setTag} from '@theatersoft/bus'

export function startLocalService (options) {
    const {name} = options
    setTime(true)
    setTag(name)
    bus.start().then(() => {
        const lsm = new LocalServiceManager(name, {[name]: {options}})
        process
            .on('SIGINT', () => process.exit())
            .on('exit', () => lsm.stopService(name))
    })
}