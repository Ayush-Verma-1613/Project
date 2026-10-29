import { Router } from 'express';
import {
  createAppointment,
  deleteAppointment,
  getAppointment,
  listAppointments,
  updateAppointmentStatus,
} from '../controllers/appointmentsController.js';

const router = Router();

router.get('/', listAppointments);
router.get('/:id', getAppointment);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

export default router;
