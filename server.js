const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// In-memory store for shareable links (for simplicity)
const shareableLinks = {};

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

// Endpoint to generate a shareable link for a file
app.post('/shareFile/:filename', (req, res) => {
    const filename = req.params.filename;
    const shareId = uuidv4(); // Generate a unique identifier
    shareableLinks[shareId] = filename; // Store the mapping

    const shareableLink = `http://localhost:${PORT}/shared/${shareId}`;
    res.send({ shareableLink });
});

// Endpoint to access a file via a shareable link
app.get('/shared/:shareId', (req, res) => {
    const shareId = req.params.shareId;
    const filename = shareableLinks[shareId];

    if (!filename) {
        return res.status(404).send('Shareable link not found or expired.');
    }

    const filePath = path.join(__dirname, 'uploads', filename);
    res.download(filePath, (err) => {
        if (err) {
            res.status(404).send('File not found.');
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


// import { v4 as uuidv4 } from 'uuid';
// import path from 'path';
// import fs from 'fs';
// import { uploadFile, listFiles, findFileById, deleteFile, generateShareableLink, findFileBySharedLink } from '../models/fileModel.js';

// export const renderUpload = (req, res) => {
//   res.render('upload');
// };


// export const uploadHandler = async (req, res) => {
//   try {
//       if (!req.file) {
//           return res.status(400).send('No file uploaded.');
//       }

//       const { originalname, filename, path: filePath } = req.file;
//       const userId = req.user.id; // Assuming user ID is available in req.user

//       // Save file details to database
//       const file = await uploadFile(originalname, filePath, userId);

//       res.send(`File uploaded successfully: ${filename}`);
//   } catch (err) {
//       res.status(500).json({ message: 'Server error', err });
//   }
// };


// export const listHandler = async (req, res) => {
//   try {
//       const userId = req.user.id; // Assuming user ID is available in req.user

//       // Fetch list of files from database
//       const files = await listFiles(userId);

//       res.json(files);
//   } catch (err) {
//       res.status(500).json({ message: 'Server error', err });
//   }
// };


// export const downloadHandler = async (req, res) => {
//   try {
//       const fileId = req.params.id;
//       const file = await findFileById(fileId);

//       if (!file) {
//           return res.status(404).send('File not found.');
//       }

//       const filePath = file.filepath; // Assuming file object has 'filepath' property
//       res.download(filePath, file.filename);
//   } catch (err) {
//       res.status(500).json({ message: 'Server error', err });
//   }
// };


// export const deleteHandler = async (req, res) => {
//   try {
//       const fileId = req.params.id;
//       const file = await findFileById(fileId);

//       if (!file) {
//           return res.status(404).json({ message: 'File not found or could not be deleted.' });
//       }

//       await deleteFile(fileId);
//       res.status(200).json({ message: 'File deleted successfully' });
//   } catch (err) {
//       res.status(500).json({ message: 'Server error', err });
//   }
// };


// export const shareHandler = async (req, res) => {
//   try {
//       const fileId = req.params.id;
//       const shareId = uuidv4(); // Generate a unique identifier
//       const shareableLink = `http://localhost:${process.env.PORT || 3000}/shared/${shareId}`;
      
//       const file = await generateShareableLink(fileId, shareId);

//       if (!file) {
//           return res.status(404).json({ message: 'File not found or could not be shared.' });
//       }

//       res.status(200).json({ shareableLink });
//   } catch (err) {
//       res.status(500).json({ message: 'Server error', err });
//   }
// };


// export const accessSharedHandler = async (req, res) => {
//   try {
//       const shareId = req.params.shareId;
//       const file = await findFileBySharedLink(shareId);

//       if (!file) {
//           return res.status(404).json({ message: 'Shareable link not found or expired.' });
//       }

//       const filePath = path.join(__dirname, '..', 'uploads', file.filename);
//       res.download(filePath, (err) => {
//           if (err) {
//               res.status(404).json({ message: 'File not found.' });
//           }
//       });
//   } catch (err) {
//       res.status(500).json({ message: 'Server error', err });
//   }
// };






