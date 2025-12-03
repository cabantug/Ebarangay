import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ResidentProfile from './pages/ResidentProfile';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <Header />
        <Sidebar />
        <Switch>
          <Route path="/" exact component={Dashboard} />
          <Route path="/resident/:id" component={ResidentProfile} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;