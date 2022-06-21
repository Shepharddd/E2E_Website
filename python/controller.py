'''
    This file will handle our typical Bottle requests and responses 
    You should not have anything beyond basic page loads, handling forms and 
    maybe some simple program logic
'''

from bottle import route, get, post, error, request, static_file
from requests import session

import model

#-----------------------------------------------------------------------------
# Static file paths
#-----------------------------------------------------------------------------

# Allow image loading
@route('/img/<picture:path>')
def serve_pictures(picture):
    '''
        serve_pictures

        Serves images from static/img/

        :: picture :: A path to the requested picture

        Returns a static file object containing the requested picture
    '''
    return static_file(picture, root='static/img/')

#-----------------------------------------------------------------------------

# Allow CSS
@route('/css/<css:path>')
def serve_css(css):
    '''
        serve_css

        Serves css from static/css/

        :: css :: A path to the requested css

        Returns a static file object containing the requested css
    '''
    return static_file(css, root='static/css/')

#-----------------------------------------------------------------------------

# Allow javascript
@route('/js/<js:path>')
def serve_js(js):
    '''
        serve_js

        Serves js from static/js/

        :: js :: A path to the requested javascript

        Returns a static file object containing the requested javascript
    '''
    return static_file(js, root='static/js/')

#-----------------------------------------------------------------------------
# Pages
#-----------------------------------------------------------------------------

# Redirect to login
@get('/')
@get('/home')
def get_index():
    '''
        get_index
        
        Serves the index page
    '''
    return model.index()

#-----------------------------------------------------------------------------

# Display the login page
@get('/login')
def get_login_controller():
    '''
        get_login
        
        Serves the login page
    '''
    return model.login_form()

#-----------------------------------------------------------------------------

# Attempt the login
@post('/login')
def post_login():
    '''
        post_login
        
        Handles login attempts
        Expects a form containing 'username' and 'password' fields
    '''

    # Handle the form processing
    username = request.json['username']
    password = request.json['password']
    
    # Call the appropriate method
    return model.login_check(username, password)
    

@post('/logout')
def logout():
    username = request.json['username']
    return model.logout(username)

@post('/check_user')
def check_user():
    user = request.json['user']
    key = request.json['key']
    return model.check_user(user, key)

@post('/mute_user')
def mute_user():
    admin_user = request.json['admin_user']
    key = request.json['key']
    mute_user = request.json['mute_user']
    return model.mute_user(admin_user, key, mute_user)

#-----------------------------------------------------------------------------

@get('/blog')
def get_blog():
    '''
        get_blog
        
        Serves the blog page
    '''
    return model.blog()

@post('/get_content')
def get_content():
    return model.get_content(request.json["content_id"])

#-----------------------------------------------------------------------------

@get('/forum')
def contact_form():
    '''
        get_about
        
        Serves the about page
    '''
    return model.forum()

@post('/get_topic_names')
def get_topic_names():
    user = request.json['user']
    key = request.json['key']
    return model.get_topic_names(user, key)

@post('/create_post')
def create_post():
    title = request.json['title']
    description = request.json['description']
    op = request.json['op']
    return model.create_post(title, op, description)

@post('/get_topic')
def get_topic():
    title = request.json['content_id']
    return model.get_topic(title)

@post('/delete_topic')
def delete_topic():
    title = request.json['title']
    user = request.json['user']
    key = request.json['key']
    return model.delete_topic(title, user, key)

@post('/send_reply')
def send_reply():
    name = request.json['name']
    user = request.json['user']
    reply = request.json['reply']
    if name is not None and user is not None and reply is not None:
        return model.send_reply(name, user, reply)
    

#-----------------------------------------------------------------------------

@get('/main')
def main_form():
    '''
        main page to message people on
        
        check here to see if get user data from cookie when we log in

        if not reroute to login page using:
            redirect("/login")
    '''
    return model.main_form()

@post('/get_friends')
def get_friends():
    '''
        returns a list of friends to user

    '''
    username = request.json["user"]
    return  model.get_friends(username)

#adds friend
@post('/add_friend')
def post_main():
    '''
        post_login
        
        Handles login attempts
        Expects a form containing 'username' and 'password' fields
    '''
    # Handle the form processing

    this_user = request.json["this_user"]
    friend = request.json["friend"]
    
    # Call the appropriate method
    return model.add_friend(this_user, friend)
     

#-----------------------------------------------------------------------------

@get('/register')
def register_form():
    '''
        get_about
        
        Serves the about page
    '''
    return model.register_form()

#-----------------------------------------------------------------------------

# Attempt the login
@post('/register')
def post_register():
    '''
        post_login
        
        Handles login attempts
        Expects a form containing 'username' and 'password' fields
    '''
    # Handle the form processing
    username = request.json['username']
    password = request.json['password']
    public_key = request.json['public_key']
    salt = request.json['salt']
    # Call the appropriate method
    successful = model.register(username, password, public_key, salt)
    if successful:
        return successful
    else:
        return "err"


# Attempt the login
@post('/send_message')
def send_message():
    '''
        handle messages
    '''
    # Handle the form processing
    sender = request.json['sender']
    sent_to = request.json['sent_to']
    data = request.json['data']
    # Call the appropriate method
    successful = model.handle_message(sender, sent_to, data)
    if successful:
        return "/main"
    else:
        return "err"

# Attempt the login
@post('/get_messages')
def get_messages():

    user = request.json['user']
    friend = request.json['friend']

    successful = model.get_messages(friend, user)
    return successful


#-----------------------------------------------------------------------------

# find a way to log out users when they close their browsers.

#-----------------------------------------------------------------------------

# Help with debugging
@post('/debug/<cmd:path>')
def post_debug(cmd):
    return model.debug(cmd)

#-----------------------------------------------------------------------------

# 404 errors, use the same trick for other types of errors
@error(404)
def error(error): 
    return model.handle_errors(error)
