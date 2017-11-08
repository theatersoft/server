import {bus, proxy, log, error} from '@theatersoft/bus'
import {Config} from './config'

Config.started
    .then(config => {
        const
            {services = []} = Config.host,
            {configs = {}} = config
        services.forEach(options => {
            if (options.enabled !== false) {
                log(`Starting service ${options.name}`)
                Object.assign(options.config, configs[options.name])
                try {
                    const service = require(options.module)[options.export]
                    new service().start(options)
                        .then(
                            () => log(`Started service ${options.name}`),
                            e => error(`Failed to start service ${options.name} ${e}`)
                        )
                } catch (e) {
                    error(`Failed to start service ${options.name} ${e}`)
                }
            }
        })
    })