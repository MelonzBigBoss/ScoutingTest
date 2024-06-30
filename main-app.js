const express = require("express")
const session = require("express-session")
const fileUpload = require("express-fileupload")
const sqlite = require("sqlite3")
const crypto = require('crypto')
const path = require("path")

const db = new sqlite.Database("data")

const app = express()

app.use(session({
	secret: 'garbage',
	resave: true,
	saveUninitialized: true,
  cookie: {
    secure: false,
    expires: 1000 * 60 * 60 * 3, // 3 Hour
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
const port = process.env.port || 3000

const callAPI = async route => { // https://www.thebluealliance.com/apidocs/v3 API DOCS
    return await (await fetch("https://www.thebluealliance.com/api/v3" + route, {
        method: "GET",
        withCredentials: true,
        headers: {
            "X-TBA-Auth-Key": process.env.tbaKey
        }
    })).json();
};

db.exec(`
	CREATE TABLE IF NOT EXISTS accounts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password VARCHAR(32) NOT NULL,
		admin BOOLEAN NOT NULL CHECK(admin IN (0,1))); 
		
	INSERT OR IGNORE INTO accounts (id, username, password, admin) VALUES (1, '${process.env.adminName}','${hashPassword(process.env.adminPass)}',1);
		
	CREATE TABLE IF NOT EXISTS pitscout (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		team INTEGER NOT NULL UNIQUE,
		weight REAL NOT NULL, 
		size TEXT NOT NULL)	
`)



function hashPassword(cleanPassword) {
	return crypto.createHash('md5').update(cleanPassword + "SaltyThing").digest("hex")
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
})

app.get('/login', (req, res) => {
	if (req.session.loggedin) {
		res.redirect('/home')
	} else {
  		res.sendFile(__dirname + '/pages/login.html')
	}
})

app.get('/register', (req, res) => {
	res.sendFile(__dirname + '/pages/register.html')
})

app.get('/logout', (req, res) => {
	req.session.destroy()
	res.redirect("/")
})

app.post('/auth', function(request, response) {
	let username = request.body.username;
	let password = request.body.password;
	if (username && password) {
	  	db.all('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, hashPassword(password)], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.post("/register_account", function(req, res) {
	let username = req.body.username;
	let password = req.body.password;

	db.all('SELECT * FROM accounts WHERE username = ?', [username], function(error, results, fields) {
		if (results.length > 0) {
			res.json({used: true}).end()
		} else {
			if (username && password) {
				db.run(`INSERT INTO accounts (username, password, admin) VALUES (?, ?, 0);`, [username, hashPassword(password)], function(error, results, field) {
					if (error) throw error;
		
					res.redirect('/login')
				});	
			}
		}
	});
})

app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
    	response.sendFile(__dirname + '/pages/home.html')
	} else {
		// Not logged in
		response.status(401).send('Please login to view this page!');
	}
});

app.get("/pitscout", function(req, res) {
	if (req.session.loggedin) {
    	res.sendFile(__dirname + '/pages/pitscout.html')
	} else {
		// Not logged in
		res.status(401).send('Please login to view this page!');
	}
})

app.get("/pitscout-get", function(req, res) { 
	res.json({car : "hi", number: req.query.teamNumber})
})

app.post("/pitscout-submit", function(req, res) {
	console.log(req.body)

	res.status(200).send("Received Successfully");
})

app.listen(port, ()=>{
  console.log(`Listening on port ${port}`)
})
