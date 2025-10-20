const CodeError = require('../util/CodeError.js');

async function verifyID(req,res,next) {

    //if(isNaN(req.params.id)) return res.status(400).json({status: false, message: 'The id is not on the right format'});
    //verifier que l'id est un nombre ou qu'il commence par SE pour les bathing site
    //verifier qu'il est bien en base ou dans l'api externe
    next();
}

module.exports = {verifyID};