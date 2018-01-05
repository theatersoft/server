import {LocalServiceManager} from  '../localServiceManager'
export {LocalServiceManager}

import {bus, setTime} from '@theatersoft/bus'

export function startLocalService (_service, enabled = true) {
    setTime(true)
    bus.start()
        .then(async () => {
            const service = _service instanceof Object
                ? _service
                : await bus.proxy('Config').getService(_service)
            const {name} = service
            service.enabled = enabled
            const lsm = new LocalServiceManager(name, {[name]: service})
            process
                .on('SIGINT', () => process.exit())
                .on('exit', () => lsm.stopService(name))
        })
}
