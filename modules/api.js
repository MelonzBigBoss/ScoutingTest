const express = require('express');
const path = require("path");
const router = express.Router();

const db = require('./database.js')
const util = require('./util.js')
const  { getCompetition } = require('./admin_api.js')

router.post("/register_account", function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
  
    db.all(
      "SELECT * FROM accounts WHERE username = ?",
      [username],
      function (error, results, fields) {
        if (results.length > 0) {
          res.json({ used: true }).end();
        } else {
          if (username && password) {
            db.run(
              `INSERT INTO accounts (username, password, admin) VALUES (?, ?, 0);`,
              [username, util.hashPassword(password)],
              function (error, results, field) {
                if (error) throw error;
  
                res.redirect("/login");
              },
            );
          }
        }
      },
    );
  });

router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

router.post("/auth", function (request, response) {
let username = request.body.username;
let password = request.body.password;
if (username && password) {
    db.get(
    "SELECT * FROM accounts WHERE username = ? AND password = ?",
    [username, util.hashPassword(password)],
    function (error, result) {
        if (error) {
            response.send(500).end();
            return;
        }
        if (result) {
        request.session.loggedin = true;
        request.session.username = username;
            request.session.primaryKey = result.id;
        request.session.isAdmin = result.admin == 1;
        response.set('HX-Redirect', '/home');
        } else {
        response.send("Incorrect Username or Password!");
        }
        response.end();
    },
    );
} else {
    response.send("Please enter Username and Password!");
    response.end();
}
});

router.use(util.isLoggedIn)

router.post("/submitMatchScout", (req, res) => {


  db.run(`INSERT INTO matchscout (team, match, comp, data, account_id) VALUES (?,?,?,?,?)`, [ req.body.team, req.body.match, getCompetition(), JSON.stringify(req.body), req.session.primaryKey ], function(err) {
    if (err) {
      console.log(err)
    }

    res.status(200).end()
  })
})



router.get("/teamImageNames", (req, res) => {
  db.all(`SELECT fileName FROM teamImages where team = ?`, [req.query.team], (error, results) => {
    res.send(results.map(row => row.fileName))
  })
})

router.get("/teamImage", (req, res) => {
  db.get(`SELECT * FROM teamImages where fileName = ?`, [req.query.fileName], (error, result) => {
      if(result)
        res.sendFile(path.join(__dirname, '..', 'Data', 'images', result.fileName))
  })
})


router.get("/currentUser", (req, res)=> {
    res.send(req.session.username)
})

router.get("/pitscout-get", function (req, res) {
	db.get(`SELECT * FROM pitscout WHERE team = ?`, [req.query.teamNumber], function(error, result) {
		if(error) {
			console.log(error)
			return res.status(500).end()
		}

		if (!result) {
			return res.json({})
		} 
		
		res.json(result)
	})
});

router.post("/pitscout-submit", function (req, res) {
	let data = req.body;
  const formattedData = {
    $weight: data.weight,
    $account_id: req.session.primaryKey,
    $team: data.team,
    $size: data.size
  };
	db.run(`INSERT OR IGNORE INTO pitscout (account_id, team, weight, size) VALUES ($account_id, $team, $weight, $size)`, formattedData, function (error) {
		if (error) {
			console.log(error)
			return res.status(500)
		}
    db.run(`UPDATE pitscout SET weight = $weight, size = $size, account_id = $account_id WHERE team = $team;`, formattedData, function(error) {
      if (error) {
        console.log(error)
        return res.status(500)
      }
      res.send("Received Successfully")
    })
	})
});

router.post("/upload", function (req, res) {
    const results = [];
    db.all(
      `SELECT * FROM teamImages WHERE team = ?`,
      [+req.body.teamNumber],
      function (error, rows) {
        if (error) {
          res.status(500).end();
          return;
        }
        let count = rows.length;
  
        if (!req.files) {
          res.status(200).end();
          return;
        }
        if (req.files.images.length) {
          req.files.images.forEach(function (file, index) {
            results.push(addImage(req.body.teamNumber, count, file, index, req.session.primaryKey));
          });
        } else {
          results.push(addImage(req.body.teamNumber, count, req.files.images, 0, req.session.primaryKey));
        }
  
        Promise.all(results).then((resultsArray) => {
          res.send(resultsArray.join("\n"));
        });
      },
    );
  });

  const allowedMIMETypes = ["image/jpeg", "image/png", "image/gif"];
function addImage(teamnumber, count, file, index, account_id) {
  return new Promise((resolve, reject) => {
    //if (!allowedMIMETypes.includes(file.mimetype)) {
    //  results.push("Filetype Not Allowed:" + file.name);
    //  return;
    // }
    const fileName = `${teamnumber}-${count + index + 1}.${getFileExtension(file.name)}`;
    file.mv(`Data/images/${fileName}`, function (err) {
      if (err) {
        resolve(err);
      }
      db.run(`INSERT INTO teamImages (team, fileName, account_id) VALUES (?,?,?)`, [
        teamnumber,
        fileName,
        account_id
      ]);
      resolve("File Uploaded Successfully");
    });
  });
}

function getFileExtension(filename) {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}
  
module.exports = router