kill $( lsof -i:8081 -t )

# remove contents of __pychache__
rm -rf __pycache__

# make the js into something the browser can use
browserify ./static/js/register.js -o ./static/js/register_bf.js
browserify ./static/js/login.js -o ./static/js/login_bf.js
browserify ./static/js/logout.js -o ./static/js/logout_bf.js
browserify ./static/js/main.js -o ./static/js/main_bf.js
browserify ./static/js/blog.js -o ./static/js/blog_bf.js
browserify ./static/js/forum.js -o ./static/js/forum_bf.js

# run server
python3 python/run.py

