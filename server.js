const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const app = express();


// Middleware para parsear JSON y solicitudes codificadas en URL
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de multer para manejar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
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

// Endpoint para enviar correos
app.post('/send-email', upload.single('archivo'), async (req, res) => {
  try {
    console.log('Datos del formulario:', req.body);
    console.log('Archivo recibido:', req.file);

    const { nombre, telefono, email, mensaje } = req.body;
    const file = req.file;

    const mailOptions = {
      from: 'pwebcasao@gmail.com',
      to: 'sebastianburbano06@gmail.com', // Reemplaza con el correo destinatario
      subject: 'Nueva queja o reclamo',
      text: `Nombre: ${nombre}\nTeléfono: ${telefono}\nCorreo electrónico: ${email}\nMensaje: ${mensaje}`,
    };

    // Adjuntar archivo si está presente
    if (file) {
      mailOptions.attachments = [
        {
          filename: file.originalname,
          path: file.path,
        },
      ];
    }

    // Enviar el correo
    await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente');

    // Eliminar el archivo después de enviarlo
    if (file) {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error('Error al eliminar el archivo adjunto:', err);
        } else {
          console.log('Archivo eliminado correctamente');
        }
      });
    }

    res.status(200).json({ message: 'Correo enviado exitosamente' });
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

