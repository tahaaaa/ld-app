
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

//LaunchDarkly setup
import { render } from 'react-dom';
import { useFlags, asyncWithLDProvider, useLDClient } from 'launchdarkly-react-client-sdk';
import bowser from 'bowser';

const browser = bowser.getParser(window.navigator.userAgent);
const browserName = browser.getBrowser().name; //browser name -- should be Firefox, Chrome, Edge, etc

function App() {

  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkModeLocal, setDarkModeLocal] = useState(false); //local dark mode state for toggling if feature is enabled
  const [isTableVisible, setIsTableVisible] = useState(false); //tracking to see if table is collapsed or open
  const [selectedBrowser, setSelectedBrowser] = useState(''); //variable for browser spoof
  const { uiUpdate, chatBot, darkMode } = useFlags(); //set LD flags

  //browser dropdown
  useEffect(() => {
    // Set default browser based on browser detection (if a matching option exists)
    if (browserName) {
      setSelectedBrowser(browserName);
    }
  }, [browserName]);

  // Local dark mode toggle
  const toggleDarkMode = () => {
    setDarkModeLocal(!darkModeLocal);
  };

  // Add the dark mode class to the body
  useEffect(() => {
    if (darkModeLocal && darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkModeLocal, darkMode]);  // This runs whenever darkMode changes


  //sending message from website form to the backend for processing
  const handleMessageSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/chat', { message });
      setResponse(res.data);
    } catch (error) {
      setResponse('Error sending message.');
    } finally {
      setLoading(false);
    }
  };

  // Browser dropdown component
  const BrowserDropdown = ({ selectedBrowser, setSelectedBrowser }) => {
    const ldClient = useLDClient();
    const handleChange = (event) => {
      setSelectedBrowser(event.target.value);

      ldClient.identify({
        kind: 'user',
        key: 'user-123',
        browser: event.target.value,  // Update the browser property with the new value
      });
    };

    //getting browser load time to report back to LD for metrics tracking
    useEffect(() => {
      // Measure the page load time when the component mounts
      const loadStart = performance.timing.navigationStart;
      const loadEnd = performance.timing.loadEventEnd;
      const timeTaken = loadEnd - loadStart; // Time in milliseconds
      ldClient.track('ux', { 'latency': timeTaken }, timeTaken);

    }, []);

    return (
      <div className="form-group mb-3 d-flex justify-content-center align-items-center">
        <label htmlFor="browserSelect" className="mr2">Select a Browser:</label>
        <select
          id="browserSelect"
          className="form-control w-auto"
          value={selectedBrowser}
          onChange={handleChange}
        >
          <option value="">--Choose a browser--</option>
          <option value="Chrome">Chrome</option>
          <option value="Firefox">Firefox</option>
          <option value="Edge">Edge</option>
          <option value="Safari">Safari</option>
          <option value="Opera">Opera</option>
        </select>
      </div>
    );
  };

  // Function to handle feature toggle
  const handleFeatureToggle = async (feature, state) => {
    const action = state ? 'turn_off' : 'turn_on';

    try {
      // Send a request to the backend to toggle the feature
      const response = await axios.post('http://localhost:5000/toggle-feature', {
        feature,
        action,
      });
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  return (

    <div className="App">

      {/* Render the UI based on LD feature flag state */}

      {uiUpdate ? (
        <div className={`new-ui ${darkModeLocal && darkMode ? 'bg-dark text-light' : 'bg-light text-dark'}`}>

          {/* dark mode toggle button */}
          {
            darkMode ? (
              <div className="position-absolute top-0 end-0 p-3">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={toggleDarkMode}
                  aria-label="Toggle Dark Mode"
                >
                  {darkModeLocal ? "🌙" : "☀️"}
                </button>
              </div>) : (<div />)
          }

          {/* Table toggle button */}
          <div className="position-absolute top-0 start-0 p-3">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setIsTableVisible(!isTableVisible)}
              aria-label="Toggle Table Visibility"
            >
              {isTableVisible ? "Hide Table" : "Show Table"}
            </button>
          </div>

          {/* Display table or not */}

          {isTableVisible && (
            <div>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Status</th>
                    <th>Trigger</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>UI Update</td>
                    <td>{uiUpdate ? 'Enabled' : 'Disabled'}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleFeatureToggle('uiUpdate', uiUpdate)}
                      >
                        {uiUpdate ? 'Off' : 'On'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Chat bot</td>
                    <td>{chatBot ? 'Enabled' : 'Disabled'}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleFeatureToggle('chatBot', chatBot)}
                      >
                        {chatBot ? 'Off' : 'On'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>Dark Mode</td>
                    <td>{darkMode ? 'Enabled' : 'Disabled'}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleFeatureToggle('darkMode', darkMode)}
                      >
                        {darkMode ? 'Off' : 'On'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <BrowserDropdown selectedBrowser={selectedBrowser} setSelectedBrowser={setSelectedBrowser} />

          {/* Display chatbot or not depending on LD flag */}
          {
            chatBot ? (
              <div>
                <h2 className="mt-4">Sales Bot</h2>
                <form onSubmit={handleMessageSubmit} className="form-inline">
                  <input
                    type="text"
                    className="form-control mb-2 mr-sm-2"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can I help?"
                  />
                  <button type="submit" className="btn btn-primary mb-2">
                    Send
                  </button>
                </form>

                <div className="mt-3">
                  <h4>Response:</h4>
                  <p>{response}</p>
                  {loading && (
                    <div className = "spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role = "status">
                      <span className = "sr-only">...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (<p></p>)
          }

          <p></p>

        </div>

      ) : (
        <div className="old-ui table-responsive">
          <h3>Feature Flag Status</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Status</th>
                <th>Trigger</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>UI Update</td>
                <td>{uiUpdate ? 'Enabled' : 'Disabled'}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleFeatureToggle('uiUpdate', uiUpdate)}
                  >
                    {uiUpdate ? 'Off' : 'On'}
                  </button>
                </td>
              </tr>
              <tr>
                <td>Chat bot</td>
                <td>{chatBot ? 'Enabled' : 'Disabled'}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <p></p>

          {/* Displays chatbot based on LD flag */}
          {
            chatBot ? (
              <div>
                <h2>Sales Bot</h2>
                <form onSubmit={handleMessageSubmit}>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder='What can I do?'
                  />
                  <button type="submit">Send</button>
                </form>
                <div>
                  <p></p>
                  <h2>Response:</h2>
                  <p>{response}</p>
                </div>
              </div>
            ) : (<p></p>)
          }
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
      key: 'user-123',  //not really using this so it is a generic user key instead of something useful
      name: 'Test person',
      email: 'tester@example.com',
      browser: browserName, //just browser name instead of trying to parse the whole thing
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

  console.log(browserName);

})();

export default App;