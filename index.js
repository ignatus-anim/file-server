import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/files', fileRoutes);
app.use('/admin', adminRoutes);
app.use(errorHandler);


app.get('/', (req, res) => {
  res.render('index');
});



app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/`);
});
