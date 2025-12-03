import React from 'react';

const Header: React.FC = () => {
    return (
        <header>
            <h1>Resident Dashboard</h1>
            <nav>
                <ul>
                    <li><a href="/dashboard">Dashboard</a></li>
                    <li><a href="/resident-profile">Resident Profile</a></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;