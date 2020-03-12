#!/bin/bash

# Stop all servers and start the server as a daemon
cd /home/ubuntu/
# forever stopall
# forever start server.js

# sudo kill -9 `sudo lsof -t -i:8000`
# npm start
pm2 stop all
pm2 start ./bin/www