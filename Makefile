COMPOSE      = docker compose
COMPOSE_DEV  = $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml
APP          = app

.PHONY: dev up down build test test-e2e test-visual pw-install pw-update install shell

dev:
	$(COMPOSE_DEV) up --build

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

test:
	$(COMPOSE_DEV) run --rm $(APP) npm test

pw-install: ## Install Playwright browsers inside dev container (run once)
	$(COMPOSE_DEV) run --rm $(APP) npx playwright install --with-deps chromium webkit

test-e2e: ## Run Playwright e2e tests (requires: make pw-install)
	$(COMPOSE_DEV) run --rm $(APP) npm run test:e2e

test-visual: ## Run visual snapshot tests (requires: make pw-install)
	$(COMPOSE_DEV) run --rm $(APP) npm run test:visual

pw-update: ## Regenerate visual baseline snapshots (run after intentional UI changes)
	$(COMPOSE_DEV) run --rm $(APP) npm run test:visual -- --update-snapshots

install:
	$(COMPOSE_DEV) run --rm $(APP) npm install $(PACKAGE)

shell:
	$(COMPOSE_DEV) run --rm $(APP) sh
