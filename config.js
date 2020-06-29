const MongoClient = require('mongodb').MongoClient({ useUnifiedTopology: true });

module.exports = config = {
    db: 'mongodb://localhost:27017/users_db',
    host: 'localhost',
    port: 8080,
    Mongo: MongoClient
}