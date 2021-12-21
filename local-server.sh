#!/bin/bash

docker stop remark-fe || true
docker rm remark-fe || true
docker run -dit --name remark-fe -p8081:80 -v "$PWD/dist":/usr/local/apache2/htdocs/ httpd:2.4 ;echo -e "\n\n   open this url: http://localhost:8081/\n\n"
