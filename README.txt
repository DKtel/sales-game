Netlify Functions (public seed-get + protected seed-put)

Copy to your project root:
- netlify.toml
- netlify/ (lowercase) with functions inside

Install dependency:
npm i @netlify/blobs

Set env var on Netlify:
ADMIN_TOKEN = <your secret>

Deploy from Git (Import from Git). Then test:
- /.netlify/functions/seed-get
- /.netlify/functions/seed-put  (POST with header x-admin-token and JSON body { users, products })
