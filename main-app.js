const express = require("express");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const path = require("path");

const apiRoutes = require("./modules/api.js")
const admin_apiRoutes = require("./modules/admin_api.js")
const pages = require('./pages/pages.js')

const app = express();
app.use(
  session({
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
