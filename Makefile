DOCKER_COMPOSE_FILE := ./srcs/docker-compose.yml

# Open Docker
# open -a Docker

up :
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build

down : 
	docker-compose -f $(DOCKER_COMPOSE_FILE) down -v

clean :
	make down
	rm ./srcs/merge/public/uploads/*

re :
	make down
	make up