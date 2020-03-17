#!/bin/bash
sudo npm install forever -g
sudo npm install pm2 -g
cd /home/ubuntu/

sudo npm install

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:cloudwatch-config.json \
    -s


cd /home/ubuntu/server/
mkdir logs
cd /home/ubuntu/