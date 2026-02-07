@echo off
set MONGODB_URI=mongodb+srv://janus_admin:JanusAdmin2024@cluster0.zcdplb1.mongodb.net/janus-platform?retryWrites=true^&w=majority
npm run seed:users
