const express = require('express')
const bcrypt = require('bcrypt')
const fs = require('fs')

const app = express()
app.use(express.json())
app.use(express.urlencoded())

const users = []

app.get('/users', (req, res) => {
    res.json(users)
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
    console.log("POSTING");
    try{
        console.log(req.body);
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = { name: req.body.username, password: hashedPassword }
        users.push(user) //add to tb -- must check if user exists first (username)
        res.status(201).send()
    }catch{
        console.log("ERROR: posting to signup failed");
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
    const user = users.find(user => user.name === req.body.username) //find in db
    if(user == null){
        return res.status(400).send("Invalid username.")
    }

    try{
        if(await bcrypt.compare(req.body.password, user.password)){
            res.status(201).send("Logging In...")
        }else{
            res.status(400).send("Invalid password.")
        }
    }catch{
        res.status(500).send()
    }
})

app.listen(3000)