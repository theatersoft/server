process.on('unhandledRejection', e => console.log(e))
const argv = require('minimist')(process.argv.slice(2))
require('./index').start(argv)
