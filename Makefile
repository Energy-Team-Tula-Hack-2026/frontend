.PHONY: init
init: ## Environment configuration
	npm install
	copy .env.local .env

.PHONY: dev
dev: ## Start development server
	npm run dev

.PHONY: build
build: ## Build for production
	npm run build

.PHONY: clean
clean: ## Clean node_modules
	rmdir /s /q node_modules
