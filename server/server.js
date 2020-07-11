const PORT = 3000;

const bodyParser = require('body-parser')
const fs = require('fs')

const session = require('express-session')
const FileStore = require('session-file-store')(session)
const { v4: uuid } = require('uuid')

const bcrypt = require('bcrypt')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const mongo = require('mongodb').MongoClient({ useUnifiedTopology: true })
const userDB = 'mongodb://localhost:27017/users_db'

const app = require('express')()
app.listen(PORT, () => {
    console.log(`Server listening at port ${PORT}`)
})

passport.use(new LocalStrategy({ usernameField: "username" }, (username, password, done) => {
    try{
        mongo.connect(userDB, (connection_err, db) => {
            if (connection_err) throw connection_err
    
            db.collection('users').find({"username": username}).toArray((query_err, query_res) => {
                if (query_err) throw query_err
                if (query_res[0] === undefined || query_res[0] === null){
                    console.log('user undefined')
                    return done(null, false)
                }

                if(bcrypt.compare(query_res[0].password, password)){
                    console.log('passwords match')
                    return done(null, query_res[0])
                }else{
                    console.log('passwords do not match')
                    return done(null, false)
                }
            })
        })
    }catch(error){
        return done(error)
    }
}))

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})
// const http = require('http').Server(app).listen(3000)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    genid: req => {return uuid()},
    secret: 'mystery',
    store: new FileStore(),
    resave: false,
    saveUninitialized: true 
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', (req, res) => {
    if(req.isAuthenticated()){
        fs.readFile('./client/routes/index.html', (err, data) => {
            if (err) throw err;
            res.write(data)
            res.end()
        })
    }else{
        res.redirect('/login')
    }
})

// LOGIN ----------------------------------------
app.get('/login', (req, res) => {
    console.log(req.isAuthenticated() ? 'user authenticated' : 'user not authenticated')
    if(req.isAuthenticated()){
        console.log('redirect to /')
        res.redirect('/')
    }else{
        fs.readFile('./client/routes/login.html', (err, data) => {
            if (err) throw err

            res.write(data)
            res.end()
        })
    }
})

app.post('/login', (req, res) => {
    passport.authenticate('local', (err, user) => {
        if (err) throw err

        if(user){
            req.login(user, err => {
                if (err) throw err
    
                console.log(`User '${user.username}' has logged in`)
                res.redirect('/')
            })
        }else{
            res.redirect('/login')
        }       
    })(req, res)
})

// SIGNUP ----------------------------------------
app.get('/signup', (req, res) => {
    if(req.isAuthenticated()){
        res.redirect('/')
    }else{
        fs.readFile('./client/routes/signup.html', (err, data) => {
            res.write(data)
            res.end()
        })
    }
})

app.post('/signup', (req, res) => {
    const username = req.body.username
    const password = req.body.password

    console.log(`${username}\n${password}`)

    try{
        mongo.connect(userDB, (connection_err, db) => {
            if (connection_err) throw connection_err

            db.collection('users').find({"username": username}).toArray(async (query_err, query_res) => {
                if (query_err) throw query_err
                if (query_res[0] === undefined || query_res[0] == null){
                    const hashedPassword = await bcrypt.hash(password, 10)
                    
                    db.collection('users').insertOne({username: username, password: hashedPassword}, (err) => {
                        if (err) throw err

                        res.redirect('/login')
                    })
                }else{
                    res.redirect('/signup')
                }
            })
        })
    }catch(error){
        console.log(error)
    }  
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    console.log(`User ${req.user.username} has logged out`)
    res.redirect('/')
})