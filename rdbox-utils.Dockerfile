FROM node:16-bullseye

COPY . /rdboxGARIBAN2/

WORKDIR /rdboxGARIBAN2

RUN apt update && \
    apt install build-essential -y \
                curl \
                jq \
                libudev-dev \
                libnss3-dev \
                libatk1.0-0 \
                libatk-bridge2.0-0 \
                libgtk-3-0 \
                libgtk-3-dev \
                libasound2 \
                libdrm2 \
                xvfb \
                python3 \
                libxshmfence-dev

RUN sed -i -e 's/github:/git+https:\/\/github.com\//g' ./package.json && \
    sed -i -e 's/git+ssh:\/\/git@/https:\/\//g' ./package-lock.json
RUN make distclean && make electron-develop
RUN npm run webpack

ENV DISPLAY :99
ENTRYPOINT ["/rdboxGARIBAN2/rdbox-utils/daemon-start.bash"]