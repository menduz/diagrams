WEBAPP_SOURCES := $(wildcard src/**/*.ts)
WEBAPP_SOURCES_TSX := $(wildcard src/**/*.tsx)
WEBAPP := docs/index.js

docs/firepad/firepad.css:
	cp -r node_modules/firepad/dist docs/firepad

docs/wasm/graphviz.wasm:
	mkdir -p docs/wasm
	cp -r node_modules/@hpcc-js/wasm/dist/*.wasm docs/wasm

$(WEBAPP): $(WEBAPP_SOURCES) $(WEBAPP_SOURCES_TSX) docs/firepad/firepad.css docs/wasm/graphviz.wasm
	./node_modules/.bin/rollup -c --environment BUILD:production

build: docs/wasm/graphviz.wasm
	rm $(WEBAPP)
	$(MAKE) $(WEBAPP)

watch: $(WEBAPP)
	@./node_modules/.bin/concurrently \
		-n "rollup,server" \
		"./node_modules/.bin/rollup -c -w" \
		"./node_modules/.bin/hs docs -p 9091 --ssl --brotli --silent "

.PHONY: watch build