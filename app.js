const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const path = require("path");
//const cron = require('node-cron')
const airsync = require("./functions/airsync");

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('json spaces', 2);
app.set('views', './views')
app.set('view engine', 'pug');

app.get('/', (req, res) => {
            res.render("index", {title: "Airsync"})
})

app.get('/request', async (req, res) => {

        let time = await airsync().catch(err => {console.error((err))})
    console.log(time)
        res.json(time)
    })

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

