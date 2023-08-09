// routes.js
const signupRouter = require('./routers/signupRouter');
const loginRouter = require('./routers/loginRouter');
const logoutRouter = require('./routers/logoutRouter');
const expressRouter = require('./routers/expressRouter');
const profileRouter = require('./routers/profileRouter');

module.exports = function(app) {
    app.use('/signup', signupRouter);
    app.use('/login', loginRouter);
    app.use('/logout', logoutRouter);
    app.use(expressRouter);
    app.use('/profile', profileRouter);
};