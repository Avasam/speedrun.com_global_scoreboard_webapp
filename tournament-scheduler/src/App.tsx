import React, { useState } from 'react';
import logo from './logo.svg';

import './App.css';

const App: React.FC = () => {
  const [srcApiKeyInput, setSrcApiKeyInput] = useState('');
  const [srcName, setSrcName] = useState('');

  const login = () =>
    fetch(`${process.env.REACT_APP_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        srcApiKeyInput,
      })
    })
      .then(res => res.json())
      .then(res => {
        if (!res.token) return
        console.log(res)
        setSrcName(res.user.name);
      })

  return <div className="App">
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />

      {srcName
        ? <div>This is where the user '{srcName}' can see and edit their schedule forms</div>
        : <>
          <label>Enter your SRC API key</label>
          <input
            id="src-name"
            name="src-name"
            type="password"
            onChange={event => setSrcApiKeyInput(event.currentTarget.value)}
          ></input>
          <button onClick={() => login()}>Access my schedules</button>
        </>
      }
    </header>
  </div>
}

export default App;
