import React, { useEffect, useState } from 'react';
import ResidentCard from '../components/ResidentCard';
import { fetchResidents } from '../services/api';
import { Resident } from '../types/resident';

const Dashboard: React.FC = () => {
    const [residents, setResidents] = useState<Resident[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getResidents = async () => {
            try {
                const data = await fetchResidents();
                setResidents(data);
            } catch (err) {
                setError('Failed to fetch residents');
            } finally {
                setLoading(false);
            }
        };

        getResidents();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Resident Dashboard</h1>
            <div>
                {residents.map(resident => (
                    <ResidentCard key={resident.id} resident={resident} />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;