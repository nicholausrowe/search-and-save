const express = require('express');
const path = require('path');
const fs = require('fs');
const convertURL = require('./api/convertURL.js');
// const convertURL = require('./server/api/convertSimple.js');
// const convertURL = require('./server/api/convertStreamSync.js');
// var browserify = require('browserify');
// var fs = require('browserify-fs');


const app = express();

const joinedPath = path.join(__dirname, 'public');
const staticDir = express.static(joinedPath);

app.use(staticDir);
app.use(express.json());

app.post('/', async (req, res, next) => {
  var passedInURL = req.body.url;
  console.time(`convertDuration – ${passedInURL}`);

  try {
    const pathToPDF = await convertURL(passedInURL);
    res.status(201)
      .download(pathToPDF, pathToPDF, () => {
        fs.unlink(pathToPDF, (err) => {
          if (err) throw err;
          console.log(`${pathToPDF} successfully deleted!`);
          console.timeEnd(`convertDuration – ${passedInURL}`);

        });
      })
  } catch (err) {
    console.error('CATCH condition from app.post(): ', err);
    res.sendStatus(500);
  }
});

app.listen(80, () => {
  console.log('Express server listening on port 80!');
});
