'use strict'
require('shelljs/make')

module.exports =
{
    clean () {
        console.log('target.server-clean')
        rm('-rf', 'build/server')
        mkdir('-p', 'build/server')
    },

    stage (build) {
        console.log('target server-stage')
        ;[
            'src',
            'package.json',
            'node_modules',
            'install.sh',
            'system'
        ].map(n => ln('-sf', `${build.ROOT}server/${n}`, `${build.ROOT}build/server/${n}`))
    },

    all (build) {
        console.log('target server-all')
        this.clean(build)
        this.stage(build)
        return Promise.resolve()
    }
}