import AWS from 'aws-sdk';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { uploadFile, listFiles, findFileById, deleteFile, generateShareableLink, findFileBySharedLink, searchFiles } from '../models/fileModel.js';
import redisClient from '../redisClient.js';

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
        await uploadFile(file.originalname, downloadURL, userId); // Pass parameters directly
        
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
    const files = await listFiles(userId);
    console.log(files)
    res.render('files', { files });
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

const createPresignedUrlWithoutClient = async (url) => {
  const presigner = new S3RequestPresigner({
    credentials: fromEnv(),
    region,
    sha256: Hash.bind(null, "sha256"),
  });


  try {
    const signedUrlObject = await presigner.presign(new HttpRequest(url));
    signedUrlObject.hostname = url
    console.log(signedUrlObject)
    return formatUrl(signedUrlObject);
    
  } catch (error) {
    console.error(error)
  }
};

// const createPresignedUrlWithClient = async ({ region, bucket, key }) => {
//   const client = new S3Client({ region });
//   const command = new GetObjectCommand({ Bucket: bucket, Key: key });
//   return getSignedUrl(client, command, { expiresIn: 3600 });
// };

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