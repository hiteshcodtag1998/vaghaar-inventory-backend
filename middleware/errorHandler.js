// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        success: false,
        message,
        // Only in development: stack trace
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
