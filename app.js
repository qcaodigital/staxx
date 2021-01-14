const express = require('express');
const app = express();
const path = require('path');
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

// open livereload high port and start to watch public directory for changes
const liveReloadServer = livereload.createServer({ exts: ['ejs', 'css', 'js'] });
liveReloadServer.watch([__dirname + '/public', __dirname + '/views']);
app.use(connectLivereload());

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) => {
    const numRows = 11;
    const numCols = 7;
    res.render('start', { numRows: numRows, numCols: numCols})
})

const port = 3000 || process.env.PORT;
app.listen(port, () => {
    console.log('Server started on port', port)
}
)
// ping browser on Express boot, once browser has reconnected and handshaken
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});