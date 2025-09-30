# Introduce myself:
- Personal information
- About me
- Review about myself
- Achievements

For test:
chạy server tĩnh
# Python
python -m http.server 5500

## Updating resume data

The site reads from `data.xml` when it is served over HTTP(S).
For offline previews opened directly from the filesystem, an embedded copy of
`data.xml` is loaded from `assets/js/site-data-inline.js`. Regenerate that file
after editing `data.xml` by running:

```
node scripts/sync-inline-data.mjs
```
