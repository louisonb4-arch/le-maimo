#!/bin/sh
# Usage : ./set-domain.sh https://www.maimo-nantes.fr
# Remplace __SITE_URL__ (canonical, Open Graph, sitemap, robots, llms.txt) par le vrai domaine.
[ -z "$1" ] && echo "Usage : ./set-domain.sh https://domaine.fr" && exit 1
URL="${1%/}"
for f in index.html mentions-legales.html robots.txt sitemap.xml llms.txt; do
  sed -i.bak "s#__SITE_URL__#$URL#g" "$f" && rm -f "$f.bak"
done
echo "Domaine appliqué : $URL"
