
require('dotenv').config();
const express = require('express');
const ld = require('launchdarkly-node-server-sdk');
const axios = require('axios');

const app = express();
const port = process.env.port || 5000;

//LaunchDarkly setup
const ldClient = ld.init(process.env.LAUNCHDARKLY_SDK_KEY);

//middleware
app.use(express.json());

//OpenAI setup
const gptApiKey = process.env.GPT_API_KEY;
const gptApiUrl = 'https://api.openai.com/v1/completions';

//Handling chat conversations and instructions
app.post('/api/chat', async(req, res) => {
    const userInput = req.body.message;
    try{
     //Send to chatGPT for interpretation
     const aiResponse = await axios.post(openaiApiUrl, {
        model: 'gpt-3.5-turbo',
        prompt: 'Interpret this command related to LaunchDarkly feature flags: "${UserInput}"',
        max_tokens: 60,
        temperature: 0.7,
     }, {
        headers: {
            'Authorization': 'Bearer ${gptApiKey}',
        },
     });
     
     const command = aiResponse.data.choices[0].text.trim();

     //Run the command in LaunchDarkly
     if(command.startsWith('enable')) {
        const featureFlag = command.split(' ')[1];
        ldClient.variation(featureFlag, {key: 'user123'}, false, (err, flagValue) => {
            if(err){
                res.status(500).send('Error with LaunchDarkly');
            } else {
                res.send('Feature ${featureFlag} has been ${flagValue?"enabled":"disabled"}')
            }
        });
     } else {
        res.send('Sorry, I did not understand that command.');
     }
    } catch(error) {
        console.error('Error during ChatGPT call:', error);
        res.status(500).send('Error processing the request.');
    }
});

//Starting the server
app.listen(port, () => {
    console.log('Server running at http://localhost:${port}');
});