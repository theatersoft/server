import imagePipeline from './imagePipeline'
import {proxy} from '@theatersoft/bus'

const pipelines = []

process.on('exit', () => {
    pipelines.forEach(pipe => {
        pipe.destroy()
    })
})

export class Capture {
    start () {
        return proxy('Config').getHost()
            .then(host =>
                host.cameras.forEach(cam =>
                    cam.pipe = imagePipeline.create(cam.device)))
    }

    stop () {
        pipelines.forEach(pipe =>
            pipe.destroy())
    }
}