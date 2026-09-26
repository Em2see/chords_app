COMPOSE      = docker compose
COMPOSE_DEV  = $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml
APP          = app

.PHONY: dev up down build test test-e2e install shell

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

test-e2e:
	$(COMPOSE_DEV) run --rm $(APP) npm run test:e2e

install:
	$(COMPOSE_DEV) run --rm $(APP) npm install $(PACKAGE)

shell:
	$(COMPOSE_DEV) run --rm $(APP) sh
