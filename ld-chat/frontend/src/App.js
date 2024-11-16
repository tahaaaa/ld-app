import logo from './logo.svg';
import './App.css';

import React, {useState} from 'react';
import axios from 'axios';

function App() {

  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const handleMessageSubmit = async (event) => {
    event.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/chat', {message});
      setResponse(res.data);
    } catch(error) {
      setResponse('Error sending message.');
    }
  };

  return (
    <div className="App">
      <h1>LaunchDarkly Feature Control Bot</h1>
      <form onSubmit = {handleMessageSubmit}>
        <input
          type = "text"
          value = {message}
          onChange = {(e) => setMessage(e.target.value)}
          placeholder = 'What can I do?'
        />
        <button type = "submit">Send</button>
      </form>
      <div>
        <h2>Response:</h2>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default App;
