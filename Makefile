
all: docs

docs: README.html CHANGELOG.html

README.html:
	asciidoc -a stylesheet=`pwd`/css/docs.css -f /etc/asciidoc/html5.conf README

CHANGELOG.html:
	asciidoc -a stylesheet=`pwd`/css/docs.css -f /etc/asciidoc/html5.conf CHANGELOG

clean:
	rm -f README.html CHANGELOG.html

