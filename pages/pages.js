const express = require('express');
const router = express.Router();

const util = require('../modules/util.js')

router.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

router.get("/login", (req, res) => {
    if (req.session.loggedin) {
        res.redirect("/home");
    } else {
        res.sendFile(__dirname + "/login.html");
    }
});

router.get("/register", (req, res) => {
    res.sendFile(__dirname + "/register.html");
});

router.get("/adminpanel", util.isAdminLoggedIn, function (request, response) {
    response.sendFile(__dirname + "/admin.html");
});

router.use(util.isLoggedIn)

router.get("/home", function (request, response) {
    response.sendFile(__dirname + "/home.html");
});

router.get("/pitscout", function (req, res) {
    res.sendFile(__dirname + "/pitscout.html");
  });
  
router.get("/viewpitscout", function(req, res) {
    res.sendFile(__dirname + "/viewpitscout.html");
})

module.exports = router