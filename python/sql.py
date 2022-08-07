from hashlib import new
from hashlib import sha256
import sqlite3
import json
import random
import string

# This class is a simple handler for all of our SQL database actions
# Practicing a good separation of concerns, we should only ever call 
# These functions from our models

# If you notice anything out of place here, consider it to your advantage and don't spoil the surprise

class SQLDatabase():
    '''
        Our SQL Database

    '''
    id = 0
    prime = 77063978972190062567708406121439515833989166141665241927674601809755939877551130107763114829470413745350603958510702733251067557

    # Get the database running
    def __init__(self, database_args="test.db"):
        self.conn = sqlite3.connect(database_args)
        self.cur = self.conn.cursor()

    # SQLite 3 does not natively support multiple commands in a single statement
    # Using this handler restores this functionality
    # This only returns the output of the last command
    def execute(self, sql_string):
        out = None
        for string in sql_string.split(";"):
            try:
                out = self.cur.execute(string)
            except:
                pass
        return out

    # Commit changes to the database
    def commit(self):
        self.conn.commit()

    #-----------------------------------------------------------------------------
    
    # Sets up the database
    # Default admin password
    def database_setup(self, admin_password='admin'):

        # Clear the database if needed
        self.execute("DROP TABLE IF EXISTS Users")
        self.commit()

        self.execute("DROP TABLE IF EXISTS Topics")
        self.commit()

        self.execute("DROP TABLE IF EXISTS ActiveUsers")
        self.commit()

        # Create the users table
        self.execute("""CREATE TABLE Users(
            Id INT,
            username TEXT,
            password TEXT,
            public_key TEXT,
            friends TEXT,
            salt TEXT,
            muted INTEGER DEFAULT 0,
            admin INTEGER DEFAULT 0
        )""")
        self.commit()

        self.execute("""CREATE TABLE Topics(
            name TEXT,
            op TEXT,
            desc TEXT,
            replies TEXT
        )""")
        self.commit()

        self.execute("""CREATE TABLE ActiveUsers(
            hash TEXT,
            name TEXT,
            admin INT
        )""")
        self.commit()

        # Add our admin user
        # prolly delete this comment at somepoint
        # pre-hashed admin password = "password" 
        print("adding admin")
        self.add_user('admin', '852d317b48826418cd0e89a803fd0509da73aa7500efccca3e1e52e72fdc189a', '0', 'testing', admin=1)
        self.add_user('muted', '852d317b48826418cd0e89a803fd0509da73aa7500efccca3e1e52e72fdc189a', '0', 'testing', muted=1)
        self.add_user('muted1', '852d317b48826418cd0e89a803fd0509da73aa7500efccca3e1e52e72fdc189a', '0', 'testing', muted=1)

        print("adding topic1")
        self.add_topic('topic1', 'admin', 'fisrt')
        self.add_topic('topic2', 'admin', 'fisrt')
        self.add_topic('topic3', 'admin', 'fisrt')
        self.add_topic('topic4', 'admin', 'fisrt')

    #-----------------------------------------------------------------------------
    # User handling
    #-----------------------------------------------------------------------------

    def add_topic(self, name, op, desc):
        sql_cmd = """ 
            INSERT INTO Topics 
            VALUES ('{name}', '{op}', '{desc}', '{replies}') 
            """
        sql_cmd = sql_cmd.format(name=name, op=op, desc=desc, replies="")

        self.execute(sql_cmd)
        self.commit()

    def delete_topic(self, title):
        sql_query = """
            DELETE FROM Topics
            WHERE name='{title}'
        """
        sql_query = sql_query.format(title=title)

        self.execute(sql_query)
        self.commit()
        
        return

    def get_topic_names(self):
        sql_query = """
            SELECT name 
            FROM Topics
        """
        self.execute(sql_query)
        ret = self.cur.fetchall()
        out = ""
        for topic in ret:
            out += topic[0] + ","
        if ret == None:
            return None
        else:
            return out[0:-1]

    def get_topic(self, title):
        sql_query = """
            SELECT * 
            FROM Topics
            WHERE name='{title}'
        """
        sql_query = sql_query.format(title=title)
        self.execute(sql_query)
        reply = self.cur.fetchone()
        
        messages = reply[3].split(",")

        muted = self.get_muted_users()

        s = ""
        if messages[0] != "":
            i = 0
            while i < len(messages):
                m = messages[i].split("-")

                for user in muted:
                    if user[0] == m[0]:
                        messages[i] = 'muted-This user has been muted'
                
                if i == len(messages)-1:
                    s+=messages[i]
                else:
                    s+=messages[i] + ","

                i += 1
        

        data = {
            "title": reply[0],
            "op": reply[1],
            "body": reply[2],
            "replies": s,
        }
        response = json.dumps(data)
        return response

    def send_reply(self, name, user, reply):
        muted = self.get_muted_users()
        print(muted)
        for mute in muted:
            if mute[0] == user:
                return "User muted"

        print(name)
        sql_query = """
            SELECT replies
            FROM Topics 
            WHERE name='{name}'
        """
        sql_query = sql_query.format(name=name)
        self.execute(sql_query)
        
        reply_string = user + "-" + reply

        replies = self.cur.fetchone()[0]
        if replies == "":
            replies = reply_string
        else:
            replies += "," + reply_string

        sql_query1 = """
            UPDATE Topics
            SET replies = '{replies}'
            WHERE name = '{name}'
        """

        sql_query1 = sql_query1.format(name=name, replies=replies)
        self.execute(sql_query1)

        self.commit()
        return

    def get_unique_hash(self):
        rand_string = ''.join(random.choices(string.ascii_uppercase + string.digits, k=30)) 
        unique_hash = sha256(rand_string.encode()).hexdigest()
        return unique_hash

    # Add a user to the database
    def add_user(self, username, password, public_key, salt, muted=0, admin=0):
        sql_cmd = """ 
            INSERT INTO Users 
            VALUES ({id}, '{username}', '{password}', "{public_key}", '',  '{salt}', {muted}, {admin}) 
            """
            
        if username == "ben":
            admin = 1

            
        sql_cmd = sql_cmd.format(id=self.id, username=username, password=password, public_key=public_key, salt=salt, muted=muted, admin=admin)
        self.id+=1

        self.execute(sql_cmd)
        self.commit()

        hash_ = self.get_unique_hash()

        sql_cmd = """ 
            INSERT INTO ActiveUsers 
            VALUES ('{hash_}', '{username}', '{admin}') 
            """
        sql_cmd = sql_cmd.format(hash_=hash_, username=username, admin=admin)

        self.execute(sql_cmd)
        self.commit()

        return hash_

    def get_muted_users(self):
        sql_query = """
        SELECT username
        FROM Users
        WHERE muted = 1
        """
        self.execute(sql_query)
        ret = self.cur.fetchall()
        return ret

    
        

    #-----------------------------------------------------------------------------

    # Check login credentials
    def check_credentials(self, username, password):

        sql_query = """
                SELECT salt
                FROM Users
                WHERE username='{username}'
            """

        sql_query = sql_query.format(username=username, password=password)
        self.execute(sql_query)
        salt = self.cur.fetchone()[0]
        temp = password + salt
        salted_password = sha256(temp.encode()).hexdigest()

        sql_query = """
                SELECT username
                FROM Users
                WHERE username='{username}'
                AND password='{password}'
            """

        sql_query = sql_query.format(username=username, password=salted_password)
        self.execute(sql_query)

        # If our query returns
        ret = self.cur.fetchone()
        if ret is not None:
            return True
        else:
            return False

    def user_login(self, username):

        sql_query = """
                SELECT *
                FROM Users
                WHERE username='{username}'
            """

        sql_query = sql_query.format(username=username)
        self.execute(sql_query)

        admin = int(self.cur.fetchone()[0])

        hash_ = self.get_unique_hash()

        sql_cmd = """ 
            INSERT INTO ActiveUsers 
            VALUES ('{hash_}', '{username}', '{admin}') 
            """
        sql_cmd = sql_cmd.format(hash_=hash_, username=username, admin=admin)

        self.execute(sql_cmd)
        self.commit()

        return hash_

    def user_logout(self, username):
        
        sql_query = """
            DELETE FROM ActiveUsers
            WHERE hash='{username}'
        """
        sql_query = sql_query.format(username=username)

        self.execute(sql_query)
        self.commit()

    def check_user(self, user, key):
        sql_query = """
                SELECT name
                FROM ActiveUsers
                WHERE hash='{key}'
            """

        sql_query = sql_query.format(key=key)
        self.execute(sql_query)
        ret = self.cur.fetchone()
        if ret == None:
            return ""

        name = ret[0]

        print(name)

        if user == name:
            return "True"
        return ""

    def mute_user(self, admin_user, key, mute_user):
        if self.check_user(admin_user, key) == "":
            return

        sql_query1 = """
            UPDATE Users
            SET muted = 1
            WHERE username = '{mute_user}'
        """
        sql_query1 = sql_query1.format(mute_user=mute_user)
        self.execute(sql_query1)
        self.commit()


    #-----------------------------------------------------------------------------

    # Check username against database
    def check_user_exists(self, username):
        sql_query = """
            SELECT * 
            FROM Users 
            WHERE username='{username}' 
        """
        sql_query = sql_query.format(username=username)
        self.execute(sql_query)
        ret = self.cur.fetchone()

        # If our query returns
        if ret:
            return True
        else:
            return False

    #-----------------------------------------------------------------------------

    #add given friend to current user
    def add_friend(self, your_name, friends_name):

        sql_query = """
            SELECT public_key
            FROM Users 
            WHERE username='{friends_name}' 
        """
        sql_query = sql_query.format(friends_name=friends_name)
        self.execute(sql_query)
        public_key = self.cur.fetchone()[0]

        sql_query = """
            SELECT *
            FROM Users 
            WHERE username='{username}' 
        """
        sql_query = sql_query.format(username=your_name)

        self.execute(sql_query)

        ret = self.cur.fetchone()


        current_list = ret[4]
        admin = ret[7]

        if current_list == '':
            new_list = friends_name
        else:
            # Check if friend already exists
            friends = current_list.split(",")
            for friend in friends:
                if friend == friends_name:
                    data = {'err': "Already friends with {}".format(friends_name)}
                    return json.dumps(data)

            new_list = friends_name + "," + current_list

        sql_query1 = """
            UPDATE Users
            SET friends = "{friends_list}"
            WHERE username = '{username}'
        """
        sql_query1 = sql_query1.format(username=your_name, friends_list=new_list)
        self.execute(sql_query1)
        self.commit()

        data = {'friends': new_list, 'public_key': public_key, 'admin': admin}
        return json.dumps(data)

    #-----------------------------------------------------------------------------

    # get list of friends of given user
    def get_friends(self, username):
        sql_query = """
            SELECT * 
            FROM Users 
            WHERE username='{username}' 
        """
        sql_query = sql_query.format(username=username)

        self.execute(sql_query)
        user = self.cur.fetchone()
        if user == None:
            return None
        
        data = {'friends': user[4], 'admin': user[7]}
        return json.dumps(data)

        

    def check_table(self, table_name):
        sql_query = """
            SELECT name 
            FROM sqlite_master 
            WHERE type='table'
            AND name='{table_name}'
        """

        sql_query = sql_query.format(table_name=table_name)
        self.execute(sql_query)
        ret = self.cur.fetchone()
        if ret == None:
            return False
        return True

    def make_table(self, table_name):
        sql_query = """
        CREATE TABLE '{table_name}'
        (
            data TEXT
        )
        """
        sql_query = sql_query.format(table_name=table_name)
        self.execute(sql_query)
        self.commit()

    def send_message(self, table_name, data):
        sql_query = """ 
            INSERT INTO '{table_name}'
            VALUES ('{data}') 
            """

        sql_query = sql_query.format(table_name=table_name, data=data)
        self.execute(sql_query)
        self.commit()


    def get_messages(self, table_name):
        sql_query = """
            SELECT data
            FROM '{table_name}' 
        """

        sql_query = sql_query.format(table_name=table_name)
        self.execute(sql_query)
        ret = self.cur.fetchall()
        formatted= []
        for message in ret:
            formatted.append(message[0])
        formatted = '-'.join(formatted)
        
        return formatted

    def check_valid_user(self, user_hash):
        sql_query = """
            SELECT 1
            FROM ActiveUsers 
            WHERE name='{user_hash}'
        """
        sql_query = sql_query.format(user_hash=user_hash)
        self.execute(sql_query)
        ret = self.cur.fetchone()
        if ret == None:
            return False
        return True

    def check_valid_admin(self, user):
        sql_query = """
            SELECT 1
            FROM Users 
            WHERE username='{user}'
            AND admin=1
        """
        sql_query = sql_query.format(user=user)
        self.execute(sql_query)
        ret = self.cur.fetchone()
        if ret == None:
            return "False"
        return "True"
    

