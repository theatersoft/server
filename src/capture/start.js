require('@theatersoft/server/lib').startLocalService({
    module: '@theatersoft/server/capture',
    export: 'Capture',
    name: `capture.${require('os').hostname()}`
})
