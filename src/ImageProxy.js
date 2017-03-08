import config from './Config'
import session from './Session'

const
    request = require('request')
//        http = require('http'),

export default {
    get (req, res) {
        const cam = config.cameras[req.params.name]
        if (cam) {
            const url = 'http://' + config.hosts[cam.host].host + ':' + (5400 + Number(cam.device))

//                http.get(url, function (src) {
//                    src.pipe(res)
//                }).on('error', function(e) {
//                    console.log('imageProxy error', cam, e)
//                })

            session.checkSession(req)
                .then(found => {
                    if (!found)
                        return res.send(401)
                    request({
                        url,
                        method: "GET"
                    })
                        .on('error', e => {
                            console.log('imageProxy pipe error', cam, e)
                        })
                        .pipe(res)
                })
        }
    }
}
