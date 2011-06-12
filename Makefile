
all: docs

docs: README.html CHANGELOG.html

README.html:
	asciidoc -a stylesheet=`pwd`/css/docs.css README

CHANGELOG.html:
	asciidoc -a stylesheet=`pwd`/css/docs.css CHANGELOG

clean:
	rm -f README.html CHANGELOG.html

