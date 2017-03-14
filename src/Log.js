import Nedb from 'nedb'
import {THEATERSOFT_CONFIG_HOME} from './Config'

const
    host = require('os').hostname(),
    filename = `${THEATERSOFT_CONFIG_HOME}/log.db`,
    db = new Nedb({filename, autoload: true}),
    add = o => {
        console.log('db.insert',o)
        db.insert(o)
        db.count({},function(e,d){console.log('db.count',d)})
    }

console.log('nedb', filename)

export default {
    rpc: {
        find (args) {
            return new Promise((resolve, reject) =>
                db.find(args[0], (err, docs) => err ? reject(err) : resolve(docs)))
        }
    },
    log () { // console.log replacement
        add({
            time: Date.now(),
            host,
            source: 'log',
            arguments: JSON.stringify(Array.prototype.slice.call(arguments, 0))
        })
    },
    db
}