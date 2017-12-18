import {LocalServiceManager} from  '../localServiceManager'
export {LocalServiceManager}

import {bus, setTime, setTag} from '@theatersoft/bus'

export function startLocalService (service) {
    bus.start()
        .then(async () => {
            const options = service instanceof Object
                ? service
                : await bus.proxy('Config').getServiceOptions(service)
            const {name} = options
            setTime(true)
            setTag(name)
            const lsm = new LocalServiceManager(name, {[name]: {options}})
            process
                .on('SIGINT', () => process.exit())
                .on('exit', () => lsm.stopService(name))
        })
}
