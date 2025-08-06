const express = require('express');
const bodyParser = require('body-parser');

const introRoute = require('./routes/intro');
const mainRoute = require('./routes/main');
const outroRoute = require('./routes/outro');
const composeRoute = require('./routes/compose');
const clearSessionRoute = require('./routes/clearSession');

const app = express();
app.use(bodyParser.json());

// Routes
app.use(introRoute);
app.use(mainRoute);
app.use(outroRoute);
app.use(composeRoute);
app.use(clearSessionRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // for tests
