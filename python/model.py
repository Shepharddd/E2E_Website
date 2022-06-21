'''
    Our Model class
    This should control the actual "logic" of your website
    And nicely abstracts away the program logic from your page loading
    It should exist as a separate layer to any database or data structure that you might be using
    Nothing here should be stateful, if it's stateful let the database handle it
'''
import view as view
import random
from bottle import template, redirect
import json

# Initialise our views, all arguments are defaults for the template
page_view = view.View()
db = None

def make_db(sql_db):
    global db
    db = sql_db

def add_friend(user, friend):
    if db.check_user_exists(friend):
        return db.add_friend(user, friend)
    else:
        data = {"err": "No User Exists By That Name"}
        return json.dumps(data)

def get_table_name(sender, sent_to):
    if sender < sent_to:
        table_name = sender + "_" + sent_to
    else:
        table_name = sent_to + "_" + sender
    return table_name

def handle_message(sender, sent_to, data):
    table_name = get_table_name(sender, sent_to)

    if not db.check_table(table_name):
        db.make_table(table_name)
    db.send_message(table_name, data)
    return "Done"

def get_messages(friend, user):
    table_name = get_table_name(friend, user)

    if not db.check_table(table_name):
        return "No previous messages"

    return db.get_messages(table_name)

def mute_user(admin_user, key, mute_user):
    db.mute_user(admin_user, key, mute_user)
    return db.get_friends(admin_user)


#-----------------------------------------------------------------------------
# Index
#-----------------------------------------------------------------------------

def index():
    '''
        index
        Returns the view for the index
    '''
    return page_view("index")

#-----------------------------------------------------------------------------
# Login
#-----------------------------------------------------------------------------

def login_form():
    '''
        login_form
        Returns the view for the login_form
    '''
    return page_view("login", msg = "")


#-----------------------------------------------------------------------------
# Contact
#-----------------------------------------------------------------------------

def forum():
    '''
        login_form
        Returns the view for the contact_form
    '''
    return page_view("forum")

def get_topic_names(user, key):

    is_admin = "0"
    if db.check_user(user, key) == "True":
        if db.check_valid_admin(user) == "True":
            is_admin = "1"


    data = {
            "admin": is_admin,
            "topics": db.get_topic_names()
        }
    return json.dumps(data)

def create_post(title, op, description):
    db.add_topic(title, op, description)
    return "done"

def get_topic(title):
    return db.get_topic(title)

def delete_topic(title, user, key):
    db.delete_topic(title)

    is_admin = "0"
    if db.check_user(user, key) == "True":
        if db.check_valid_admin(user) == "True":
            is_admin = "1"

    topics = db.get_topic_names()

    data = {
            "admin": is_admin,
            "topics": topics
        }
    return json.dumps(data)

def send_reply(name, user, reply):
    return db.send_reply(name, user, reply)


#-----------------------------------------------------------------------------
# Register
#-----------------------------------------------------------------------------

def register_form():
    '''
        login_form
        Returns the view for the contact_form
    '''
    return page_view("register", msg = "")

#-----------------------------------------------------------------------------
# main
#-----------------------------------------------------------------------------

def main_form():
    '''
        login_form
        Returns the view for the contact_form
    '''
    return page_view("main")

def get_friends(username):
    return db.get_friends(username)

#-----------------------------------------------------------------------------

def register(username, password, public_key, salt):
    '''
        Passwords Already Hashed on client browser
    '''
    if(db.check_user_exists(username)):
        return False
    else:
        return db.add_user(username, password, public_key, salt)


#-----------------------------------------------------------------------------

# Check the login credentials
def login_check(username, password):
    '''
        login_check
        Checks usernames and passwords

        :: username :: The username
        :: password :: The password

        redirects to main for valid credentials, or shows error message for invalid credentials
    '''
    if db.check_user_exists(username):
        if db.check_credentials(username, password):
            data = {"success": db.user_login(username)}
        else:
            data = {"err": "Wrong password"}
    else:
        data = {"err": "No User Exists By That Name"}
    return json.dumps(data)

def logout(username):
    db.user_logout(username)
    return True

def check_user(user, key):
    return db.check_user(user, key)


#-----------------------------------------------------------------------------
# About
#-----------------------------------------------------------------------------

def blog():
    '''
        about
        Returns the view for the about page
    '''
    return page_view("blog")

# Returns a random string each time
def get_content(i):
    
    file = [
        "templates/content_0.html",
        "templates/content_1.html",
        "templates/content_2.html",
        "templates/content_3.html",
        "templates/content_4.html"
    ]

    with open(file[i], 'r') as file:
        data = file.read().replace('\n', '')

    return data


#-----------------------------------------------------------------------------
# Debug
#-----------------------------------------------------------------------------

def debug(cmd):
    try:
        return str(eval(cmd))
    except:
        pass


#-----------------------------------------------------------------------------
# 404
# Custom 404 error page
#-----------------------------------------------------------------------------

def handle_errors(error):
    error_type = error.status_line
    error_msg = error.body
    return page_view("error", error_type=error_type, error_msg=error_msg)