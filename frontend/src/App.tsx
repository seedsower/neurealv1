import React from 'react';
import { Web3Provider } from './contexts/Web3Context';
import SimpleApp from './components/SimpleApp';

function App() {
  return (
    <Web3Provider>
      <SimpleApp />
    </Web3Provider>
  );
}

export default App;
