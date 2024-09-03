import express from 'express';
import path from 'path';
import fs from 'fs';
import convertURL from './api/convertURL.js';

const app = express();

const joinedPath = path.join(process.cwd(), 'public');
const staticDir = express.static(joinedPath);

app.use(staticDir);
app.use(express.json());

app.post('/', async (req, res, next) => {
  const passedInURL = req.body.url;
  console.time(`convertDuration – ${passedInURL}`);

  try {
    const pathToPDF = await convertURL(passedInURL);
    res.status(201).download(pathToPDF, pathToPDF, () => {
      fs.unlink(pathToPDF, (err) => {
        if (err) throw err;
        console.log(`${pathToPDF} successfully deleted!`);
        console.timeEnd(`convertDuration – ${passedInURL}`);
      });
    });
  } catch (err) {
    console.error('CATCH condition from app.post(): ', err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}!`);
});
