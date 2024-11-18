const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const cors = require('cors');
const app = express();



// Habilita CORS para tu dominio frontend
app.use(cors({
  origin: 'https://casa-odontologica.vercel.app' // Reemplaza con tu dominio frontend
}));

// Middleware para parsear JSON y solicitudes codificadas en URL
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configura Cloudinary con tus credenciales
cloudinary.config({
  cloud_name: 'dof97dudt', // Reemplaza con tu Cloud Name
  api_key: '761317986176149', // Reemplaza con tu API Key
  api_secret: 'WGtY0xjLG0Csw-Uk4Fr67EINcR0', // Reemplaza con tu API Secret
});

// Configura Multer para usar Cloudinary como almacenamiento
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // Carpeta donde se guardarán los archivos en Cloudinary
    resource_type: 'auto', // Permite subir imágenes, videos, PDF, etc.
  },
});

const upload = multer({ storage });


// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pwebcasao@gmail.com',
    pass: 'tonm snzz xdgv swjn', 
  },
});

//ENDPOINT PARA ENVIAR CORREO
app.post('/send-email', upload.single('archivo'), async (req, res) => {
  try {
    const { nombre, telefono, email, mensaje } = req.body;
    const file = req.file;

    // Enlace público del archivo subido a Cloudinary
    const fileUrl = file ? file.path : null;

    const mailOptions = {
      from: 'pwebcasao@gmail.com',
      to: 'comercial@casaodontologica.com.co',
      subject: 'Nueva queja o reclamo',
      text: `Nombre: ${nombre}\nTeléfono: ${telefono}\nCorreo electrónico: ${email}\nMensaje: ${mensaje}`,
      attachments: fileUrl
        ? [
            {
              filename: file.originalname,
              path: fileUrl, // Enlace al archivo en Cloudinary
            },
          ]
        : [],
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Correo enviado exitosamente', fileUrl });
  } catch (error) {
    console.error('Error en el backend al enviar el correo:', error);
    res.status(500).json({ message: 'Error al enviar el correo' });
  }
});


// Endpoint para leer productos desde un archivo Excel
app.get('/products', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'products.xlsx');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'El archivo productos.xlsx no existe' });
    }

    // Leer el archivo Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Tomar la primera hoja
    const sheet = workbook.Sheets[sheetName];

    // Convertir los datos de la hoja a JSON
    const products = xlsx.utils.sheet_to_json(sheet);

    res.status(200).json(products);
  } catch (error) {
    console.error('Error al leer el archivo Excel:', error);
    res.status(500).json({ message: 'Error al leer los productos' });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

