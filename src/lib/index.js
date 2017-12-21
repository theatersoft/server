import {LocalServiceManager} from  '../localServiceManager'
export {LocalServiceManager}

import {bus, setTime} from '@theatersoft/bus'

export function startLocalService (service, enabled = true) {
    setTime(true)
    bus.start()
        .then(async () => {
            const options = service instanceof Object
                ? service
                : await bus.proxy('Config').getServiceOptions(service)
            const {name} = options
            options.enabled = enabled
            const lsm = new LocalServiceManager(name, {[name]: {options}})
            process
                .on('SIGINT', () => process.exit())
                .on('exit', () => lsm.stopService(name))
        })
}
