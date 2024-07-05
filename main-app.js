const express = require("express");
const session = require("express-session");
const sqlitestore = require("connect-sqlite3")(session)
const fileUpload = require("express-fileupload");
const ws = require('ws')
const path = require("path");

const apiRoutes = require("./modules/api.js")
const admin_apiRoutes = require("./modules/admin_api.js")
const pages = require('./pages/pages.js')

const tba = require('./modules/tba.js')

const db = require('./modules/database.js')

const app = express();
const wss = new ws.Server({port: 8080})

app.use(
  session({
    store: new sqlitestore ({
      db: "Data/data.db",
      table: 'sessions',
      concurrentDB: true,
    }),
    secret: "garbage",
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
      expires: 1000 * 60 * 60 * 3, // 3 Hour
    },
  }),
);
app.use(express.json());
app.use(
  fileUpload({
    limits: {
      fileSize: 100 * 1024 * 1024, //100 MB
      files: 3,
      safeFileNames: true,
      preserveExtension: true,
      useTempFiles: true,
      tempFileDir: "Data/images/temp",
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));

app.use('/api', apiRoutes)
app.use('/api', admin_apiRoutes.router)
app.use('', pages)

const port = process.env.port || 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

function sendDataToClients(){
  var i = 1;
  wss.clients.forEach(function each(client) {

    if (client.readyState == WebSocket.OPEN) {
      client.send(JSON.stringify({teamToScout : i}));
      i++
    }
  })
}

app.get('/TeamToScout', async function (req, res) {
  const matchNum = req.query.match

  const allMatchData = await tba.callAPI(`/event/${admin_apiRoutes.getCompetition()}/matches`)

  const matchData = allMatchData.find(obj => obj.comp_level == 'qm' && obj.match_number == matchNum)

  if (!matchData) return res.status(500);
  
  const allianceData = matchData.alliances

  const blueTeams = allianceData.blue.team_keys 
  const redTeams = allianceData.red.team_keys

  console.log(blueTeams, redTeams)

  res.status(200)
})

wss.on('connection', (ws, req) => {
  ws.sessionId = req.headers.cookie.split("=")[1].split('.')[0].substring(4); // Used To get sessionId from headers
  db.get(`SELECT * FROM sessions where sid = ?`, [ws.sessionId], function(err, res) {
    if (!res)  { 
      ws.close()
      return; 
    }

    ws.username = JSON.parse(res.sess).username
    console.log(`${ws.username} connected`)
  })

  ws.on('message', (message) => {
      console.log(`Message from ${ws}: ${message}`)
      sendDataToClients();
  })

  ws.on('close', () => {
    console.log(`${ws.username} disconnected`)
  })
})