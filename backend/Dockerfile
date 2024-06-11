# FROM ubuntu:latest
# WORKDIR /usr/share/oj
# COPY requirements.txt ./
# RUN apt-get update -y
# RUN apt-get install -y python3-pip
# RUN python3 -m pip install -r requirements.txt
# COPY . .
# EXPOSE 80

# CMD ["python3", "manage.py", "runserver", "0.0.0.0:80"]
############################################################################################

# Use the official Python image as a base
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /usr/share/oj

# Install system dependencies if needed
# If you're using PostgreSQL (psycopg2), install the following packages
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt to install dependencies first
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 80

# Command to run the Django app
CMD ["python", "manage.py", "runserver", "0.0.0.0:80"]
