require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

// open livereload high port and start to watch public directory for changes
const liveReloadServer = livereload.createServer({ exts: ['ejs', 'css', 'js'] });
liveReloadServer.watch([__dirname + '/public', __dirname + '/views']);
app.use(connectLivereload());

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://qcaodigital:${process.env.MONGO_PW}@qcaodigital.vys9n.mongodb.net/qcaodigital?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json());

client.connect(async(err) => {
    const collection = client.db("staxx").collection("scores");
 
    app.set('view engine', 'ejs');
    app.use(express.static(__dirname + "/public"));

    app.get('/', (req, res) => {
        const numRows = 14; //14 default
        const numCols = 7; //7 default 
        res.render('game', { numRows: numRows, numCols: numCols})
    })

    app.post('/scores', async (req, res) => {
        console.log(req.body)
        const result = await collection.insertOne({ name: req.body.name,  time: req.body.time })
        res.send(result.data)
    })

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log('Server started on port', port))

    // ping browser on Express boot, once browser has reconnected and handshaken
    liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/");
    }, 100);
    });
});
