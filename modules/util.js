const crypto = require("crypto");

function hashPassword(cleanPassword) {
    return crypto
      .createHash("md5")
      .update(cleanPassword + "SaltyThing")
      .digest("hex");
  }
  
  const isLoggedIn = (req, res, next) => {
    if (req.session && req.session.loggedin) {
      next();
    } else {
        res.status(401).send("Unauthenticated")
    }
}

const isAdminLoggedIn = (req, res, next) => {
    if (req.session && req.session.loggedin && req.session.isAdmin) {
      next();
    } else {
        res.status(401).send("Unauthenticated")
    }
  }

module.exports={
    hashPassword,
    isLoggedIn,
    isAdminLoggedIn,
}