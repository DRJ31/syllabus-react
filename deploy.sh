#!/bin/bash

tar xvf dist.tar.xz
mkdir -p /data/nginx/www/syllabus
find /data/nginx/www/syllabus -mindepth 1 ! -name index.html -exec rm -rf {} +
mv dist/index.html /data/nginx/www/syllabus/index.html
rm -rf dist
rm -f dist.tar.xz
