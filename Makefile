
all: docs

docs: README.html CHANGELOG.html

README.html:
	asciidoc README

CHANGELOG.html:
	asciidoc CHANGELOG

clean:
	rm -f README.html CHANGELOG.html

