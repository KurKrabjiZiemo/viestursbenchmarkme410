const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importē routes
const authRoutes = require('./routes/auth');
const profilesRoutes = require('./routes/profiles');
const testResultsRoutes = require('./routes/testResults');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:8080', // Lovable frontend ports
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/test-results', testResultsRoutes);

// Veselības pārbaude
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BenchmarkMe API darbojas!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Maršruts nav atrasts' });
});

// Kļūdu handler
app.use((err, req, res, next) => {
  console.error('Servera kļūda:', err);
  res.status(500).json({ error: 'Iekšēja servera kļūda' });
});

// Startē serveri
app.listen(PORT, () => {
  console.log(`BenchmarkMe API darbojas uz porta ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
