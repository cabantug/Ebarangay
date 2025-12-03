import { Schema, model, Document } from 'mongoose';

interface IResident extends Document {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    address: string;
    phoneNumber: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

const ResidentSchema = new Schema<IResident>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
}, {
    timestamps: true,
});

const Resident = model<IResident>('Resident', ResidentSchema);

export default Resident;