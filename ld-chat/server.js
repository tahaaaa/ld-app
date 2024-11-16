/*
require('dotenv').config();

//const openai = require('openai');

const { OpenAI } = require('openai');  // Use require for openai
const openai = new OpenAI();
  


const express = require('express');
const ld = require('launchdarkly-node-server-sdk');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
*/


import dotenv from 'dotenv';  // ES module import for dotenv
dotenv.config();

import { OpenAI } from 'openai';  // ES module import for openai
const openai = new OpenAI({apiKey:process.env.GPT_API_KEY});

import express from 'express';  // ES module import for express
import ld from 'launchdarkly-node-server-sdk';  // ES module import for LaunchDarkly
import axios from 'axios';  // ES module import for axios
import cors from 'cors';  // ES module import for cors

const app = express();
const port = process.env.PORT || 5000;  // Fixed environment variable (PORT)



//LaunchDarkly setup
const ldClient = ld.init(process.env.LAUNCHDARKLY_SDK_KEY);

//middleware
app.use(express.json());

//prevent CORS issues
app.use(cors({
    origin: 'http://localhost:3000'
  }));

//OpenAI setup
const gptApiKey = process.env.GPT_API_KEY;



//Handling chat conversations and instructions
app.post('/api/chat', async(req, res) => {
    const userInput = req.body.message;
    try{    
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content: `${userInput}`,
                },
            ],
        });

    const command = completion.choices[0].text.trim();
    console.log(completion.choices[0].message);


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