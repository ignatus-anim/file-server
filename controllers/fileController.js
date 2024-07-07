import AWS from 'aws-sdk';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { uploadFile, listFiles, findFileById, deleteFile, generateShareableLink, findFileBySharedLink, searchFiles, verifyAdminStatus, incrementDownloadCount, incrementEmailCount } from '../models/fileModel.js';
import redisClient from '../redisClient.js';
import nodemailer from 'nodemailer';

// import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromIni, fromEnv } from "@aws-sdk/credential-providers";
import { HttpRequest } from "@smithy/protocol-http";
import {
  getSignedUrl,
  S3RequestPresigner,
} from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@smithy/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";
import { Hash } from "@smithy/hash-node";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
      user: process.env.SMTP_LOGIN,
      pass: process.env.SMTP_PASSWORD
  }
});

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;

// Configure Multer Storage
const storage = multer.memoryStorage();
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
      const title = req.body.title
      const description = req.body.description
      const userId = req.user.id;
      const fileId = uuidv4();
      const fileName = `${fileId}-${file.originalname}`;

      try {
        // Upload file to AWS S3
        const params = {
          Bucket: bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read"
        };

        await s3.putObject(params).promise();
        const downloadURL = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

        // Save file details into the database
        await uploadFile(file.originalname, downloadURL, userId, title, description); // Pass parameters directly
        
        // Invalidate the cache for listFiles
        const cacheKey = `files:${userId}`;
        await redisClient.del(cacheKey);

        res.redirect('/files/list'); // Redirect to list page after successful upload
      } catch (err) {
        console.error("AWS S3 error:", err);
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
    const userId = req.user.id;
    const isAdmin = await verifyAdminStatus(userId)

    const files = await listFiles(userId);
    res.render('files', { files, isAdmin });
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', err });
  }
};

export const downloadHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const file = await findFileById(id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const fileName = file.filepath.split('/').pop();
    const params = {
      Bucket: bucketName,
      Key: fileName,
    };

    incrementDownloadCount(id)
    
    // Get the file from S3
    const fileStream = s3.getObject(params).createReadStream();

    // Set headers to force download
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);

    // Pipe the file stream to the response
    fileStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', err });
  }
};

export const deleteHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const file = await findFileById(id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const fileName = file.filepath.split('/').pop().split('?')[0];
    const params = {
      Bucket: bucketName,
      Key: fileName
    };

    await s3.deleteObject(params).promise();

    await deleteFile(id);
    // Invalidate the cache for listFiles
    const cacheKey = `files:${file.user_id}`;
    await redisClient.del(cacheKey);

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

    const sharedLink = file.filepath;
    await generateShareableLink(id, sharedLink);
    
    res.json({ sharedLink })
    // res.redirect('/files/list');
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
};

export const renderShareViaEmail = async (req, res) => {
  const {id} = req.params

  res.render('share-via-email', {id})
}

export const shareViaEmail = async (req, res) => {
  const {id, email} = req.body

  try {
    const file = await findFileById(id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const sharedLink = file.filepath;
    await generateShareableLink(id, sharedLink);

    await transporter.sendMail({
      from: "ignatusa3@gmail.com",
      to: email,
      subject: 'A file has been shared with you',
      text: `Click the link to access a file shared with you: ${sharedLink}`,
      html: `<a href='${sharedLink}'>Click the link to access a file shared with you: ${sharedLink}</a>`
  });

  incrementEmailCount(id)

  res.status(200).redirect("/files/list")
    
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
}

export const accessSharedHandler = async (req, res) => {
  const { link } = req.params;
  try {
    const file = await findFileBySharedLink(link);
    if (!file) return res.status(404).json({ message: 'File not found' });

    res.redirect(file.shared_link);
    // res.render('shared', { message: `Download the file: ${file.filename}`, link: `/files/download/${file.id}` });
  } catch (err) {
    res.status (500).json({ message: 'Server error', err });
  }
};


export const searchHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q;
    const files = await searchFiles(query, userId);
    res.render('files', { files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', err });
  }
};