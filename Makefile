
all: docs

docs: README.html

README.html:
	asciidoc README

clean:
	rm -f README.html
