import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { uploadFile, listFiles, findFileById, deleteFile, generateShareableLink, findFileBySharedLink } from '../models/fileModel.js';


// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory where uploaded files should be stored
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Define the filename and extension
  }
});

// Initialize Multer Upload
const upload = multer({ storage: storage });

export const renderUpload = (req, res) => {
  res.render('upload');
};

export const uploadHandler = async (req, res) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'File upload error', err });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      const userId = req.user.userId;
      const fileId = uuidv4();
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const uploadPath = path.join(__dirname, '..', 'uploads', fileId);

      try {
        // Save file details into the database
        await uploadFile(file.originalname, uploadPath, userId); // Pass parameters directly
        res.redirect('/files/list'); // Redirect to list page after successful upload
      } catch (err) {
        console.error("Database error:",err);
        res.status(500).json({ message: 'Server error', err });
      }
    });
  } catch (err) {
    console.error('Unhandled error', err);
    res.status(500).json({ message: 'Server error', err });
  }
};



export const listHandler = async (req, res) => {
  try {
    const files = await listFiles();
    res.render('files', { files });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

export const downloadHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const file = await findFileById(id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    res.download(file.filepath, file.filename);
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

export const deleteHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const file = await findFileById(id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    await deleteFile(id);
    res.redirect('/files/list');
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

export const shareHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const file = await findFileById(id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const sharedLink = await generateShareableLink(id);
    res.redirect('/files/list');
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

export const accessSharedHandler = async (req, res) => {
  const { link } = req.params;
  try {
    const file = await findFileBySharedLink(link);
    if (!file) return res.status(404).json({ message: 'File not found' });

    res.render('shared', { message: `Download the file: ${file.filename}`, link: `/files/download/${file.id}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};