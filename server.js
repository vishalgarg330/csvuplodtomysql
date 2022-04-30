const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const fs = require('fs');
const csv = require('fast-csv');
const mysql = require('mysql')
const multer = require('multer')
const path = require('path')
 
 
//use express static folder
app.use(express.static("./public"))
 
// body-parser middleware use
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))
 
// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "w00dl@nd",
    database: "test"
})
 
db.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }
    console.log('Connected to the MySQL server.');
})
 
//! Use of Multer
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')    
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
 
var upload = multer({
    storage: storage
});
 
//! Routes start
 
//route for Home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
 
//@type   POST
// upload csv to database
app.post('/uploadfile', upload.single("uploadfile"), (req, res) =>{
    console.log(req.file.filename)
    UploadCsvDataToMySQL(__dirname + '/uploads/' + req.file.filename,req.file.filename);
    console.log('CSV file data has been uploaded in mysql database ');
});
 
function UploadCsvDataToMySQL(filePath,filename){
    console.log(filePath);
    let stream = fs.createReadStream(filePath);
    let csvData = [];
    let csvStream = csv
        .parse()
        .on("data", function (data) {
            console.log(data)
            csvData.push(data);
        })
        .on("end", function () {
            csvData.shift();
            db.connect((error) => {
                if (error) {
                    console.error(error);
                } else {
                    let index;
                    csvData.forEach(([key, value]) => {
                        index = key;
                        
                    })
                    let insertQuery = `CREATE TABLE ${filename} (
                        id int(20) NOT NULL,
                        ${index} varchar(255) DEFAULT NULL,
                        PRIMARY KEY (id) 
                      )`
                    
                    db.query(insertQuery, (error, response) => {
                        console.log(error || response);
                    });
                    let query = `INSERT INTO  ${filename} (id, ${index}) VALUES ?`;
                    db.query(query, value, (error, response) => {
                        console.log(error || response);
                    });
                }
            });
             
            // delete file after saving to MySQL database
            // -> you can comment the statement to see the uploaded CSV file.
            fs.unlinkSync(filePath)
        });
  
    stream.pipe(csvStream);
}
 
//create connection
const PORT = process.env.PORT || 7000
app.listen(PORT, () => console.log(`Server is running at port ${PORT}`))