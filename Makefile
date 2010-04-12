
all: docs

docs: README.html

README.html:
	asciidoc README
