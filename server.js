const express = require('express')
const bcrypt = require('bcrypt')
const fs = require('fs')

const config = require('./config.js');
const app = express()

app.use(express.json())
app.use(express.urlencoded())

process.on('unhandledRejection', (error) => {
    console.log('unhandledRejection', error.message);
});

app.get('/users', (req, res) => {
    try{
        config.Mongo.connect(config.db, (connection_err, db) => {
            if(connection_err) throw connection_err;

            db.collection('users').find({}).toArray((query_err, query_res) => {
                if (query_err) throw query_err;

                if(query_res === undefined){
                    res.json([])
                }else{
                    res.json(query_res)
                }
                db.close()
            })
        })
    }catch(error){
        console.log(`Error: there was a issue retrieving users. ${error}`);
        res.status(500).send()  
    }
})


/* SIGN UP ----------------------------------------------- */
app.get('/signup', (req, res) => {
    fs.readFile('./pages/signup.html', (err, data) => {
        if (err) throw err;
        res.write(data);
        res.end();
    })
})

app.post('/signup', async (req, res) => {
    try{
        config.Mongo.connect(config.db, (connection_err, db) => {
            if (connection_err) throw connection_err;

            db.collection('users').find({ "username": req.body.username }).toArray(async (query_err, query_res) => {
                if (query_err) throw query_err;

                if(query_res[0] !== undefined){
                    console.log('invalid username'); 
                    throw new Error("Error: user already exists");
                }

                const hashedPassword = await bcrypt.hash(req.body.password, 10)
                db.collection('users').insertOne({ "username": req.body.username, "password": hashedPassword }, (insertion_err) => {
                    if (insertion_err) throw insertion_err;

                    res.status(201).send()
                    db.close()
                })
            })
        })
    }catch(error){
        console.log(`ERROR: there was a problem signing up. ${error}`);
        res.status(500).send()
    }
})


/* LOGIN ------------------------------------------------ */
app.get('/login', (req, res) => {
    fs.readFile('./pages/login.html', (err, data) => {
        if (err) throw err
        res.write(data)
        res.end()
    })
})

app.post('/login', async (req, res) => {
    try{
        config.Mongo.connect(config.db, (connection_err, db) => {
            if(connection_err) throw connection_err;

            db.collection('users').find({ "username": req.body.username }).toArray(async (query_err, query_res) => {
                if (query_err) throw query_err;
                if (query_res[0] === undefined) throw new Error("Error: user not found");

                if(await bcrypt.compare(req.body.password, query_res[0].password)){
                    res.status(201).send("Logging In...")
                }else{
                    res.status(400).send("Invalid password.")
                }
                db.close()
            })
        })
    }catch(error){
        console.log(`ERROR: there was a problem logging in. ${error}`);
        res.status(500).send()
    }
})

app.listen(3000)