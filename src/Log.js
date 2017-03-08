var
    Nedb = require('nedb'),
    home = process.env.HOME + '/.config/theatersoft/',
    filename = function() {return home + 'log.db'},
    db,
    hostname = require('os').hostname(),
    add = function (o) {
        console.log('db.insert',o)
        db.insert(o)
        db.count({},function(e,d){console.log('db.count',d)})
    }

db = new Nedb({filename: filename(), autoload: true})

module.exports = {
    rpc: {
        find: function (args) {
            return new Promise(function(resolve, reject) {
                db.find(args[0], function (err, docs) {
                    if (err)
                        reject(err)
                    else
                        resolve(docs)
                })
            })
        }
    },
    log: function () { // console.log replacement
        add({
            time: Date.now(),
            host: hostname,
            source: 'log',
            arguments: JSON.stringify(Array.prototype.slice.call(arguments, 0))
        })
    },
    db: db
}