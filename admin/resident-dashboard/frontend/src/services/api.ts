import axios from 'axios';
import { Resident } from '../types/resident';

const API_URL = 'http://localhost:5000/api/residents';

export const fetchResidents = async (): Promise<Resident[]> => {
    const response = await axios.get<Resident[]>(API_URL);
    return response.data;
};

export const fetchResidentById = async (id: string): Promise<Resident> => {
    const response = await axios.get<Resident>(`${API_URL}/${id}`);
    return response.data;
};

export const createResident = async (resident: Resident): Promise<Resident> => {
    const response = await axios.post<Resident>(API_URL, resident);
    return response.data;
};

export const updateResident = async (id: string, resident: Resident): Promise<Resident> => {
    const response = await axios.put<Resident>(`${API_URL}/${id}`, resident);
    return response.data;
};

export const deleteResident = async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};