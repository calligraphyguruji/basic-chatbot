import Chatbot from './components/Chatbot';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  return (
    <main className="app-main">
      <Chatbot />
      <Analytics />
    </main>
  );
}

export default App;
