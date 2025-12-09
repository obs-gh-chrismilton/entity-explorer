.PHONY: help dev build up down restart logs logs-backend logs-frontend clean test shell-backend shell-frontend ps health stop start

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Entity Explorer - Docker Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# Development Commands
dev: ## Start development environment with hot reload
	@echo "$(GREEN)Starting development environment...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found!$(NC)"; \
		echo "$(YELLOW)Please copy .env.example to .env and configure it.$(NC)"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-detached: ## Start development environment in detached mode
	@echo "$(GREEN)Starting development environment (detached)...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Production Commands
build: ## Build production Docker images
	@echo "$(GREEN)Building production images...$(NC)"
	docker-compose build --no-cache

up: ## Start production containers
	@echo "$(GREEN)Starting production containers...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found!$(NC)"; \
		echo "$(YELLOW)Please copy .env.example to .env and configure it.$(NC)"; \
		exit 1; \
	fi
	docker-compose up -d

start: ## Start existing containers
	@echo "$(GREEN)Starting containers...$(NC)"
	docker-compose start

stop: ## Stop running containers
	@echo "$(YELLOW)Stopping containers...$(NC)"
	docker-compose stop

down: ## Stop and remove containers, networks
	@echo "$(YELLOW)Stopping and removing containers...$(NC)"
	docker-compose down

down-volumes: ## Stop and remove containers, networks, and volumes
	@echo "$(RED)Stopping and removing containers, networks, and volumes...$(NC)"
	docker-compose down -v

restart: ## Restart all containers
	@echo "$(YELLOW)Restarting containers...$(NC)"
	docker-compose restart

# Logs Commands
logs: ## Tail logs from all containers
	docker-compose logs -f

logs-backend: ## Tail logs from backend container
	docker-compose logs -f backend

logs-frontend: ## Tail logs from frontend container
	docker-compose logs -f frontend

# Status Commands
ps: ## Show running containers
	@docker-compose ps

health: ## Check health status of all services
	@echo "$(BLUE)Health Status:$(NC)"
	@docker-compose ps | grep -E "(backend|frontend)" || echo "$(RED)No containers running$(NC)"

# Shell Access
shell-backend: ## Open shell in backend container
	@echo "$(GREEN)Opening shell in backend container...$(NC)"
	docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	@echo "$(GREEN)Opening shell in frontend container...$(NC)"
	docker-compose exec frontend sh

# Testing Commands
test: ## Run tests in all containers
	@echo "$(BLUE)Running tests...$(NC)"
	docker-compose exec backend npm test
	docker-compose exec frontend npm test

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	docker-compose exec backend npm test

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	docker-compose exec frontend npm test

# Cleanup Commands
clean: ## Remove all containers, networks, volumes, and images
	@echo "$(RED)Cleaning up Docker resources...$(NC)"
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f

clean-volumes: ## Remove named volumes
	@echo "$(RED)Removing named volumes...$(NC)"
	docker volume rm entity-explorer-backend-node-modules entity-explorer-frontend-node-modules 2>/dev/null || true

# Setup Commands
setup: ## Initial setup - copy .env.example to .env
	@if [ -f .env ]; then \
		echo "$(YELLOW).env file already exists. Skipping...$(NC)"; \
	else \
		echo "$(GREEN)Creating .env file from .env.example...$(NC)"; \
		cp .env.example .env; \
		echo "$(YELLOW)Please edit .env file and add your API keys and configuration.$(NC)"; \
	fi

# Utility Commands
rebuild: ## Rebuild and restart all services
	@echo "$(GREEN)Rebuilding and restarting all services...$(NC)"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

rebuild-backend: ## Rebuild and restart backend service
	@echo "$(GREEN)Rebuilding backend service...$(NC)"
	docker-compose build --no-cache backend
	docker-compose up -d backend

rebuild-frontend: ## Rebuild and restart frontend service
	@echo "$(GREEN)Rebuilding frontend service...$(NC)"
	docker-compose build --no-cache frontend
	docker-compose up -d frontend

stats: ## Show container resource usage statistics
	docker stats entity-explorer-backend entity-explorer-frontend

inspect-backend: ## Inspect backend container
	docker inspect entity-explorer-backend

inspect-frontend: ## Inspect frontend container
	docker inspect entity-explorer-frontend

# Installation verification
verify: ## Verify Docker installation and configuration
	@echo "$(BLUE)Verifying Docker installation...$(NC)"
	@docker --version || (echo "$(RED)Docker not installed!$(NC)" && exit 1)
	@docker-compose --version || (echo "$(RED)Docker Compose not installed!$(NC)" && exit 1)
	@echo "$(GREEN)Docker and Docker Compose are installed correctly.$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN).env file exists.$(NC)"; \
	else \
		echo "$(YELLOW).env file not found. Run 'make setup' to create it.$(NC)"; \
	fi
