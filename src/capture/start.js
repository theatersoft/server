'use strict'
require('@theatersoft/server/lib').startLocalService({
    module: '@theatersoft/server/capture/capture',
    export: 'Capture',
    name: `capture.${require('os').hostname()}`
})