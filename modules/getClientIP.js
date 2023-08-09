// getClientIP.js
module.exports = function getClientIP(req, res, next) {
    const forwardedFor = req.headers['x-forwarded-for'];
    let ipAddress = forwardedFor ? forwardedFor.split(',')[0] : req.connection.remoteAddress;
    if (['::1', '::ffff:127.0.0.1'].includes(ipAddress)) ipAddress = '127.0.0.1';
    if (ipAddress.startsWith('::ffff:')) ipAddress = ipAddress.replace('::ffff:', '');
    req.ipAddress = ipAddress;
    next();
};
