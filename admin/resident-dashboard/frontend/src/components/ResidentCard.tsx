import React from 'react';
import { Resident } from '../types/resident';

interface ResidentCardProps {
    resident: Resident;
}

const ResidentCard: React.FC<ResidentCardProps> = ({ resident }) => {
    return (
        <div className="resident-card">
            <h2>{resident.name}</h2>
            <p>Age: {resident.age}</p>
            <p>Address: {resident.address}</p>
            <p>Email: {resident.email}</p>
            <p>Phone: {resident.phone}</p>
        </div>
    );
};

export default ResidentCard;