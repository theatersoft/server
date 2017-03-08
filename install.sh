#!/bin/bash

echo installing

#run as nvm user
#npm i

if [ $UID -eq 0 ]; then

    echo install systemd services

    mkdir -p /usr/lib/systemd/system
    cp -r system/* /usr/lib/systemd/system

    echo start services
    systemctl daemon-reload
    systemctl enable theatersoft theatersoft-pipeline
    systemctl restart theatersoft

else

    echo rerun install with sudo to install services

fi
