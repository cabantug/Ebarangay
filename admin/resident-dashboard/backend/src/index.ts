import express from 'express';
import bodyParser from 'body-parser';
import residentRoutes from './routes/residentRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use('/api/residents', residentRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});