import { Request, Response } from 'express';
import ResidentService from '../services/residentService';

class ResidentController {
    async getAllResidents(req: Request, res: Response) {
        try {
            const residents = await ResidentService.getAllResidents();
            res.status(200).json(residents);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching residents', error });
        }
    }

    async getResidentById(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const resident = await ResidentService.getResidentById(id);
            if (resident) {
                res.status(200).json(resident);
            } else {
                res.status(404).json({ message: 'Resident not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching resident', error });
        }
    }

    async createResident(req: Request, res: Response) {
        try {
            const newResident = await ResidentService.createResident(req.body);
            res.status(201).json(newResident);
        } catch (error) {
            res.status(500).json({ message: 'Error creating resident', error });
        }
    }

    async updateResident(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const updatedResident = await ResidentService.updateResident(id, req.body);
            if (updatedResident) {
                res.status(200).json(updatedResident);
            } else {
                res.status(404).json({ message: 'Resident not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error updating resident', error });
        }
    }

    async deleteResident(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const deleted = await ResidentService.deleteResident(id);
            if (deleted) {
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Resident not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error deleting resident', error });
        }
    }
}

export default new ResidentController();