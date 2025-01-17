const express = require('express')
const modelSync = require('./models/modelSync')

const app = express()

modelSync().then(connection => {
    if (connection) {
        app.listen(8080, () => {
            console.log(`Server running on http://localhost:8080/nha`);
        })
    }
    else console.log(`Unable to connect to the database.`);
})

