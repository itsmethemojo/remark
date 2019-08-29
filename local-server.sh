#!/bin/bash

docker stop remark-fe || true
docker rm remark-fe || true
docker run -dit --name remark-fe -v "$PWD/dist":/usr/local/apache2/htdocs/ httpd:2.4 ;echo -e "\n\n   open this url: http://"$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' remark-fe)"/\n\n"
