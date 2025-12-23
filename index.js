// save as server.js (replace your old file)
// npm install express ws axios fca-mafiya

const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const axios = require('axios');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 22133;

// Session management
const sessions = new Map();

// Generate session ID
function generateSessionId() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `KARTIK ${timestamp}${random}`;
}

// Configuration template
function createConfig() {
    return {
        prefix: '',
        delay: 5,
        running: false,
        api: null,
        repeat: true,
        sessionId: '',
        startTime: null
    };
}

// Message data template
function createMessageData() {
    return {
        threadID: '',
        messages: [],
        currentIndex: 0,
        loopCount: 0
    };
}

// WebSocket server
let wss;

// HTML Control Panel (updated with Kartik Rajput theme and session management)
const htmlControlPanel = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Kartik Rajput - Web Convo Chat Loop</title>
<style>
  *{box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif}
  html,body{height:100%;margin:0;background:linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #c8e6c9 100%)}
  
  body{
    background: linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #c8e6c9 100%);
    position: relative;
    overflow-y: auto;
  }
  body::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23007e33' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
    z-index: -1;
  }
  
  header{
    padding: 20px 25px;
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 2px solid rgba(0, 126, 51, 0.2);
    background: linear-gradient(90deg, #007e33, #00c851);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 126, 51, 0.3);
  }
  header h1{
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    text-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  header .sub{
    font-size: 14px;
    margin-left: auto;
    opacity: 0.9;
  }
  
  .container{
    max-width: 1000px;
    margin: 25px auto;
    padding: 20px;
  }
  
  .panel{
    background: white;
    border: 1px solid #e0e0e0;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 6px 15px rgba(0, 126, 51, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .panel:hover {
    box-shadow: 0 8px 20px rgba(0, 126, 51, 0.15);
    transform: translateY(-2px);
  }
  
  label{
    font-size: 14px;
    color: #007e33;
    font-weight: 500;
    margin-bottom: 5px;
    display: block;
  }
  
  .row{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
  
  .full{
    grid-column: 1/3;
  }
  
  input[type="text"], input[type="number"], textarea, select, .fake-file {
    width: 100%;
    padding: 12px 15px;
    border-radius: 8px;
    border: 1px solid #c8e6c9;
    background: #f9fffa;
    color: #2e7d32;
    outline: none;
    transition: all 0.3s;
    font-size: 14px;
  }
  
  input[type="text"]:focus, input[type="number"]:focus, textarea:focus, select:focus {
    border-color: #007e33;
    box-shadow: 0 0 0 3px rgba(0, 126, 51, 0.2);
    background: white;
  }
  
  .fake-file{
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  button{
    padding: 12px 20px;
    border-radius: 8px;
    border: 0;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s;
    box-shadow: 0 4px 6px 
