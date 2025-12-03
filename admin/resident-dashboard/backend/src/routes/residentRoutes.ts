import { Router } from 'express';
import ResidentController from '../controllers/residentController';

const router = Router();
const residentController = new ResidentController();

router.get('/residents', residentController.getAllResidents);
router.get('/residents/:id', residentController.getResidentById);
router.post('/residents', residentController.createResident);
router.put('/residents/:id', residentController.updateResident);
router.delete('/residents/:id', residentController.deleteResident);

export default router;