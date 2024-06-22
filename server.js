const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });


// Create 'uploads' directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}


// Endpoint to upload a file
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log('Uploaded file:', req.file.filename); // Log the filename
    res.send(`File uploaded successfully: ${req.file.filename}`);
});


// Endpoint to download a file
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath, (err) => {
        if (err) {
            res.status(404).send('File not found.');
        }
    });
});



// Endpoint to list all files
app.get('/listFiles', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            return res.status(500).send('Error listing files.');
        }
        res.json(files);
    });
});


// Endpoint to search for files
app.get('/searchFiles', (req, res) => {
    const searchTerm = req.query.q;
    fs.readdir('uploads', (err, files) => {
        if (err) {
            return res.status(500).send('Error searching files.');
        }
        const matchedFiles = files.filter(file => file.includes(searchTerm));
        res.json(matchedFiles);
    });
});


// Endpoint to delete a file
app.delete('/deleteFile/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(404).send('File not found or could not be deleted.');
        }
        res.send('File deleted successfully.');
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
