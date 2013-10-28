# Dummy hello world service
#
# Run with:
#    docker run -e INSTANCE=instance-name hello-nodejs

FROM shykes/nodejs
MAINTAINER Fabio Rehm "fgrehm@gmail.com"

ADD hello-world-server.js /bin/hello-world-server.js

EXPOSE 80
CMD ["/usr/local/bin/node", "/bin/hello-world-server.js"]
