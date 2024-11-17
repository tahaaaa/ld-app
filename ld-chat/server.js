
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
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content: `${userInput}`,
                },
            ],
        });

    console.log(completion.choices[0].message);

    const command = completion.choices[0].message.content.trim();

     //Run the command in LaunchDarkly
     if(command.startsWith('enable')) {
        const featureFlag = command.split(' ')[1];
        ldClient.variation(featureFlag, {key: 'user123'}, false, (err, flagValue) => {
            if(err){
                res.status(500).send('Error with LaunchDarkly');
            } else {
                res.send(`Feature ${featureFlag} has been ${flagValue?"enabled":"disabled"}`)
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