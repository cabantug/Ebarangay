export interface Resident {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO format date
    address: string;
    phoneNumber: string;
    email: string;
    emergencyContact: {
        name: string;
        relationship: string;
        phoneNumber: string;
    };
    medicalHistory: string[];
    createdAt: string; // ISO format date
    updatedAt: string; // ISO format date
}