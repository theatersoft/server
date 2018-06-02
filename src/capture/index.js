import {Pipeline} from './imagePipeline'

const pipelines = []

process.on('exit', () => {
    pipelines.forEach(pipe => {
        pipe.destroy()
    })
})

export class Capture {
    async start ({config: {cameras, port = 5400}}) {
        cameras.forEach(cam =>
            cam.pipe = new Pipeline(cam.device, port))
    }

    async stop () {
        pipelines.forEach(pipe =>
            pipe.destroy())
    }
}