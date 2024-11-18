Setup and Instructions

1. Clone repository.
git clone https://github.com/tahaaaa/ld-app.git

2. Update the .env file in the root of the project if required with your personal API keys.

3. Start backend server.
Server:
cd ./ld-app
npm install
node server.js

4. Start frontend application.
cd ./ld-app/frontend
npm install
npm start

5. By default, the backend will run on port 5000 and the frontend will be on port 3000.
Once running, access the app at:
http://localhost:3000/

Built using:
- Node v22.11.0
- NPM v10.9.0
- React

Required to run:
- LaunchDarkly SDK key
- (Not required for LD functionality to work) OpenAI API key
- LaunchDarkly test environment with three feature flags set up: Chat bot, UI update, Dark Mode
- The trigger webhook URLs are hardcoded and must be changed if a new test environment is being used. (Can be found in ld-app/server.js)


App Introduction
The app consists of three main features -- a chat bot, a UI update, and a dark mode.

Part 1: Release and Remediate
All three features can be deployed (toggled on) and rolled back (off) either directly through the application or via the LaunchDarkly web UI. All releases and changes are dynamic and require no page refreshes. You can test this by triggering off the problematic chat bot.

Part 2: Target
The dark mode feature has been selectively rolled out to the three most popular browsers. You can spoof a user agent change using the browser dropdown and see how the dark mode feature availability is targeted to different audience segments. This is utilizing the context kind of user with a custom attribute for browsers.

Part 3: Metrics (incomplete)
A metric for page load time has been added for monitoring. The frontend measures page load time and uses ldClient.track() to track this however it is not fully implemented with experimentation.

Part 4: Integrations
The LaunchDarkly project is integrated into a Slack workspace where notifications about changes appear. The workspace URL is:
https://launchdarklyt-y3h1453.slack.com
And updates will appear in the #all-new-workspace channel.
