/**
 * Main App Component
 */

import { MainLayout } from './components/MainLayout';
import { LandingPage } from './components/LandingPage';
import './styles/App.css';

function App() {
  return (
    <MainLayout>
      <LandingPage />
    </MainLayout>
  );
}

export default App;
