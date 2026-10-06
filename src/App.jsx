import Chatbot from './components/Chatbot';
import { AuthProvider } from './context/AuthContext';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <main className="app-main">
        <Chatbot />
        <Analytics />
      </main>
    </AuthProvider>
  );
}

export default App;
