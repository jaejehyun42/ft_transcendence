DOCKER_COMPOSE_FILE := ./srcs/docker-compose.yml

# Open Docker
# open -a Docker

up :
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build

down : 
	docker-compose -f $(DOCKER_COMPOSE_FILE) down -v

clean :
	make down

re :
	make down
	make up

.PHONY: up down clean re