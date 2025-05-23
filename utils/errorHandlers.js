exports.catchErrors = (fn) => {
    return function (req, res, next) {
        const resp = fn(req, res, next);
        if (resp instanceof Promise) {
            return resp.catch(next);
        }
        return resp;
    };
};

exports.getIpAddress = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress ||
        null;
};

exports.sanitizeEntityData=(data)=> {
    if (!data) return null;
    if (Array.isArray(data)) return data.map(sanitizeEntityData);

    const sensitiveFields = ['password', 'token', 'creditCard', 'ssn', 'cvv'];
    const sanitized = {...data};

    sensitiveFields.forEach(field => {
        if (sanitized[field] !== undefined) {
            sanitized[field] = '**REDACTED**';
        }
    });

    return sanitized;

}


// Enhanced IP address detection
exports.getClientInfo = (req) => ({
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    protocol: req.protocol
});

exports.handleErrors = (res, error) => {
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            result: null,
            message: 'Please provide all required fields or correct invalid values.',
            error: error.errors.map(err => err.message), // Extract specific validation messages
        });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            result: null,
            message: 'Record already exists.',
            error: error.errors.map(err => err.message), // Extract specific constraint messages
        });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            result: null,
            message: 'Foreign key constraint error: The referenced record does not exist.',
            error: error.message, // Provide details about the foreign key violation
        });
    } else if (error.name === 'SequelizeDatabaseError') {
        return res.status(500).json({
            success: false,
            result: null,
            message: 'Database error occurred.',
            error: error.message,
        });
    } else {
        // Handle all other errors
        return res.status(500).json({
            success: false,
            result: null,
            message: 'An unexpected error occurred.',
            error: error.message,
        });
    }
};

exports.itemNotFound = (res,item="Record")=>{
    return res.status(404).json({
        success:false,
        message:`${item} not found`
    })
}

exports.successTransaction = (res,transaction=null,result=null,message=null)=>{
    return res.status(200).json({
        success:true,
        message:message?message:`Record ${transaction} successfully.`,
        result
    })
}

/*
  Not Found Error Handler

  If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
*/
exports.notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Url doesn't exist ",
    });
};

/*
  Production Error Handler

  No stacktraces are leaked to admin
*/
exports.productionErrors = (error, req, res, next) => {
    res.status(500).json({
        success: false,
        message: error.message,
        error: error,
    });
};

/*
  Development Error Handler

  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/
exports.developmentErrors = (error, req, res, next) => {
    error.stack = error.stack || '';
    const errorDetails = {
        message: error.message,
        status: error.status,
        stackHighlighted: error.stack.replace(/[a-z_-\d]+.js:\d+:\d+/gi, '<mark>$&</mark>'),
    };

    res.status(500).json({
        success: false,
        message: error.message,
        error: error,
    });
};