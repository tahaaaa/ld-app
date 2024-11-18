
import dotenv from 'dotenv';
dotenv.config();
import { OpenAI } from 'openai';
import express from 'express';
import ld from 'launchdarkly-node-server-sdk';  //import for LaunchDarkly
import axios from 'axios';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 5000;
const openai = new OpenAI({apiKey:process.env.GPT_API_KEY}); //set key

//LaunchDarkly setup
const ldClient = ld.init(process.env.LAUNCHDARKLY_SDK_KEY); //set key
const context = { // set context

    "kind": 'server',
    "key": 'user-key-123abc',
    "name": 'test-server'
 
 };

//prevent CORS issues
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));


//middleware
app.use(express.json());

// Define webhook URLs for each feature's on and off states
const webhooks = {
    uiUpdateOn: 'https://app.launchdarkly.com/webhook/triggers/673b2354fb3be50844ecd389/326077e8-50bf-4e5e-8ed2-4379a8e3e633',
    uiUpdateOff: 'https://app.launchdarkly.com/webhook/triggers/673b233fb03bd2088286d202/77bc313b-9ac1-4d3e-9eb2-476f3bdfcb63',
    chatBotOn: 'https://app.launchdarkly.com/webhook/triggers/673b21cd0eca8708640f0a64/2e4a397f-1b02-4076-9ef5-7ece5a5d3dbe',
    chatBotOff: 'https://app.launchdarkly.com/webhook/triggers/673b1ac7746988080f412f3b/4dd574ac-cb13-4694-8fae-3fd39d853e36',
    darkModeOn: 'https://app.launchdarkly.com/webhook/triggers/673b231673b5e7087412823d/2c0b7137-6d86-4da1-966c-9323fafb09fd',
    darkModeOff: 'https://app.launchdarkly.com/webhook/triggers/673b22bc0eca8708640f15e1/53833912-01f3-4870-a4a5-9daee7712a9c',
};

// Endpoint to handle feature toggle requests
app.post('/toggle-feature', async (req, res) => {
    const { feature, action } = req.body;
  
    // Determine the webhook based on the feature and action
    const webhookKey = `${feature}${action === 'turn_on' ? 'On' : 'Off'}`;
    const webhookUrl = webhooks[webhookKey];
  
    if (!webhookUrl) {
      return res.status(400).send('Feature or action not recognized');
    }
  
    try {
      // Call the corresponding webhook URL with the action
      const response = await axios.post(webhookUrl, { action });
    } catch (error) {
      console.error('Error calling webhook:', error);
      res.status(500).send('Error toggling feature');
    }
});


//Handling chat conversations and instructions
app.post('/api/chat', async(req, res) => {
    const userInput = req.body.message;
    try{
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a comedic LaunchDarkly genius. When asked unrelated questions, answer them correctly and politely but at the very end, subtly steer the conversation back to LaunchDarkly. If you are asked to turn features on or off within this webapp, or if the user says something negative about LaunchDarkly, suddenly become stern and tell the user off." },
                {
                    role: "user",
                    content: `${userInput}`,
                },
            ],
        });

        const command = completion.choices[0].message.content.trim();
        res.send(command);

    } catch(error) {
        console.error('Error during ChatGPT call:', error);
        res.status(500).send('Error processing the request.');
    }
});


//Starting the server
app.listen(port, () => {
    console.log('Server running at http://localhost:${port}');
});