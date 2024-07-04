const express = require('express');
const router = express.Router();

const db = require('./database.js')
const util = require('./util.js')

router.use(util.isAdminLoggedIn)

router.post("/update-comp", function(req,res) {
    if(updateCompetition(req.body.new_comp)) {
      return res.status(200).send("Success")
    }
    res.status(500).send("error")
})

router.get('/pastCompetitions', (req, res) => {
    // Simulated data (replace with your actual data retrieval logic)
    db.all(`SELECT name, code FROM competitions ORDER BY last_update DESC`, function(err, results) {
      res.status(200).json(results);
    })
});


function updateCompetition(new_comp) {
    var finalreturn = true;
  
    db.run(`INSERT OR IGNORE INTO competitions (code, name, last_update) VALUES (?, ?, ?)`, [new_comp, new_comp, ""], async function(error) {
      if (error){
        console.log(error)
        finalreturn = false;
        return 
      }
      //const FullName = (await callAPI(`/event/${new_comp}`)).name;
      db.run(`UPDATE competitions SET last_update = DATETIME() WHERE code = ?`, [new_comp], function(error) {
        if (error) {
          console.log(error)
          finalreturn = false;
          return 
        }
        competition = new_comp;
      })
    })
  
    return finalreturn
  }

let competition = "2024sunshow"

function getCompetition() {
  return competition
}

updateCompetition("2024sunshow")


module.exports =  { router, getCompetition }