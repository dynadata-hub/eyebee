process.on("SIGINT",() => {
    console.log("SIGINT received... exiting process");
	process.exit();
});

process.on("SIGTERM",() => {
    console.log("SIGTERM received... exiting process");
	process.exit();
});


const express = require('express');

const cors = require('cors');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.raw({ type: "*/*",limit:512000000 }))

// // enable files upload
// app.use(fileUpload());

//add other middleware
app.use(morgan('dev'));

app.get("/download/:filename", (req,res) => {
    console.log("sending file "+process.env.DUMMY_FILES_DIR+path.sep+req.params.filename);
    res.sendFile(process.env.DUMMY_FILES_DIR+path.sep+req.params.filename);
});

app.get("/ping", (req,res) => {
    
    res.sendStatus(200);
});

app.post("/upload", (req,res) => {

    // if(req.files && Object.keys(req.files)[0]){
    //     let sampleFile = req.files[Object.keys(req.files)[0]];

    //     sampleFile.mv("/tmp/dummy-upload-"+Date.now(), (err) => {
    //         if (err){
    //             console.error(err);
    //             return res.status(500).send(err);
    //         }else{
    //             res.send('File uploaded!');
    //         }

    //     });
    // }else{
    //     res.sendStatus(400);
    // }
    let size = req.headers['content-length'];
    console.log("los headers de req",{req:req.headers});

    let dataLength = 0;
    req.on("data",(chunk) => {
        dataLength = dataLength + chunk.length;
        console.log("lo que va teniendo datalength",{dataLength:dataLength});
    });

    req.on("end",() => {
       console.log("entra en on end!",{dataLength:dataLength});
       res.sendStatus(200);
    });


    
});

//start app 
const port = process.env.PORT || 5100;

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);