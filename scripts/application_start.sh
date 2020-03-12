#!/bin/bash

# Stop all servers and start the server as a daemon
# forever stopall
# forever start /home/ubuntu/bin/www

# sudo kill -9 `sudo lsof -t -i:8000`
cd /home/ubuntu/
# npm start
pm2 start server.js