import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

const App: React.FC = () => {
  const [srcNameInput, setSrcNameInput] = useState('');
  const [srcName, setSrcName] = useState('');

  return <div className="App">
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />

      {srcName
        ? <div>This is where the user '{srcName}' can see and edit his schedule forms</div>
        : <>
          <label>Enter your SRC name</label>
          <input
            id="src-name"
            name="src-name"
            onChange={event => setSrcNameInput(event.currentTarget.value)}
          ></input>
          <button onClick={() => setSrcName(srcNameInput)}>Access my schedules</button>
        </>
      }
    </header>
  </div>
}

export default App;
