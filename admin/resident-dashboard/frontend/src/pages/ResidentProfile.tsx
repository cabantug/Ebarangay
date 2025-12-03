import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getResidentById } from '../services/api';
import ResidentCard from '../components/ResidentCard';

const ResidentProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [resident, setResident] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResident = async () => {
            try {
                const data = await getResidentById(id);
                setResident(data);
            } catch (err) {
                setError('Failed to fetch resident data');
            } finally {
                setLoading(false);
            }
        };

        fetchResident();
    }, [id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Resident Profile</h1>
            {resident ? <ResidentCard resident={resident} /> : <div>No resident found</div>}
        </div>
    );
};

export default ResidentProfile;