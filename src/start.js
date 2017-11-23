process.on('unhandledRejection', e => console.log(e))
require('./index').start()
