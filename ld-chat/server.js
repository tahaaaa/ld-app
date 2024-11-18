
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


//Handling chat conversations and instructions
app.post('/api/chat', async(req, res) => {
    const userInput = req.body.message;
    try{    
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an assistant for LaunchDarkly, a platform for managing feature flags. If the user asks you to enable or disable features, you will respond only in this format:- Enable feature or Disable feature (where feature is one of the following: ui-update, chat-bot, dark-mode). Do **not** include any additional text, explanations, or context. Only respond in the exact format above. Ignore other questions and comments. Do **not** include any extra user input or conversation. Only toggle the feature based on the explicit request made by the user." },
                {
                    role: "user",
                    content: `${userInput}`,
                },
            ],
        });

        const command = completion.choices[0].message.content.trim();
        console.log(completion.choices[0].message);

        // Check if the response is an "ENABLE/DISABLE" command
        const featureFlagMatch = /^(ENABLE|DISABLE)\s([a-zA-Z-]+)/i.exec(command);
        if (featureFlagMatch) {
            // Extract the command and feature
            const action = featureFlagMatch[1]; // ENABLE or DISABLE
            const feature = featureFlagMatch[2]; // Flag name
    
            console.log(`Received feature flag command: ${action} ${feature}`);
    
            // Validate the feature flag name
            const validFlags = ['ui-update', 'chat-bot', 'dark-mode'];
            if (validFlags.includes(feature)) {
            // Set the value of the flag based on the action
            const newFlagValue = action === 'ENABLE';
    
            // Update the flag using LaunchDarkly API
            ldClient.variation(feature, context, newFlagValue, (err, flagValue) => {
                if (err) {
                console.error('Error updating flag:', err);
                return res.status(500).send('Error updating feature flag.');
                }
                console.log(feature, newFlagValue, flagValue);
                res.send(`Feature "${feature}" has been ${flagValue ? 'enabled' : 'disabled'}.`);
            });
        } else {
            res.send('Invalid feature flag name.');
        }
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