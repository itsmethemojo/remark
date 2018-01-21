# remark

run local
```
docker run -dit --name remark -v "$PWD/public":/usr/local/apache2/htdocs/ httpd:2.4 ;\
echo -e "\n\n   open this url: http://"$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' remark)"/\n\n"
```
