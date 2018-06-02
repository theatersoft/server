import {bus, error} from '@theatersoft/bus'
import {Config} from './config'
import {checkSession} from './session'
import request from 'request'

const DEV = process.env.NODE_ENV === 'development'
import url from 'url'

const host = process.env.BUS && url.parse(process.env.BUS).host
let _urls
const urls = () => {
    if (_urls) return _urls
    _urls = {}
    Config.config.hosts.forEach(({name, host}) => {
        const capture = Config._getLocalService(`capture.${name}`, name, false)
        if (capture)
            capture.config.cameras.forEach(({name, device}) =>
            _urls[name] = `http://${host}:${(capture.config.port || 5400) + Number(device)}`)
    })
    return _urls
}

export default {
    get (req, res) {
        const url = bus.root ? urls()[req.params.name] : `https://${host}${req.originalUrl}`;
        if (url)
            (DEV ? Promise.resolve(true) : checkSession(req))
                .then(found => {
                    if (!found) return res.send(401)
                    request({url, method: "GET", headers: {cookie: req.headers.cookie}})
                        .on('error', e => error('imageProxy pipe error', cam, e))
                        .pipe(res)
                })
    }
}
