FROM ubuntu:latest
WORKDIR /usr/share/oj
COPY requirements.txt ./
RUN apt-get update -y
RUN apt-get install -y python3-pip
RUN python3 -m pip install -r requirements.txt
COPY . .
EXPOSE 80

CMD ["python3", "manage.py", "runserver", "0.0.0.0:80"]