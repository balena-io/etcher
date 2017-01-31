FROM ubuntu:14.04

# Install dependencies
RUN apt-get update && apt-get install -y \
  build-essential \
  curl \
  fuse \
  git \
  jq \
  libasound2 \
  libgconf-2-4 \
  libgtk2.0-0 \
  libnss3 \
  libxss1 \
  libxtst6 \
  python \
  python-pip \
  python-dev \
  python-software-properties \
  software-properties-common \
  upx \
  unzip \
  wget \
  xvfb \
  zip

# NodeJS
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash - \
  && apt-get install -y nodejs
RUN npm config set spin=false
RUN npm install -g bower asar electron-installer-debian

# Python
RUN pip install codespell

# Ruby
RUN add-apt-repository ppa:brightbox/ruby-ng
RUN apt-get update
RUN apt-get install -y ruby2.3
RUN gem install scss_lint
