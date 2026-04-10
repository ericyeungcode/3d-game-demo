.PHONY: dev build publish clean

dev:
	pnpm dev

build:
	pnpm build

publish: build
	npx gh-pages -d dist

clean:
	rm -rf dist
