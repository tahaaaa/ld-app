import logo from './logo.svg';
import './App.css';

import React, {useState, useEffect} from 'react';
import axios from 'axios';

//LaunchDarkly setup
import { render } from 'react-dom';
import { useFlags, asyncWithLDProvider, withLDConsumer } from 'launchdarkly-react-client-sdk';

function App() {

  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const {uiUpdate, chatBot} = useFlags(); //set LD flags
  console.log('Feature states: ', {uiUpdate, chatBot})


  //sending message from website form to the backend for processing
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

      <h1>Features Status</h1>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>UI Update</td>
            <td>{uiUpdate ? 'Enabled' : 'Disabled'}</td>
          </tr>
          <tr>
            <td>Chat bot</td>
            <td>{chatBot ? 'Enabled' : 'Disabled'}</td>
          </tr>
        </tbody>
      </table>


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
{/* TODO: Need to update UI!! */}
      {uiUpdate && (
        <div>
          <p>The 'UI Update' feature is enabled!</p>
        </div>
      )}

    </div>
  );
}


// Wrapping the App component with LaunchDarkly provider to manage feature flags
(async () => {
  const LDProvider = await asyncWithLDProvider({
    clientSideID: '67314cc4e85a1e086b74762e',
    context: {
      kind: 'user',
      key: 'user-123',  // A unique key for the user
      name: 'Test person',
      email: 'tester@example.com',
    },
    options: {
      sendEvents: false, //Stop the CORS warnings for LD diagnostic events
    }
  });

  render(

    <LDProvider>
      <App />
    </LDProvider>,

    document.getElementById('root'),

  );

})();

export default App;