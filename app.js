//app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Package requirements
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files and views
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

routes(app);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});